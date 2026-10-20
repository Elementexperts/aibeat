// Offline identity allocation ONLY. This module never connects to a database or emits passwords.
const {randomUUID}=require('node:crypto');
const roles=['owner','admin','manager','member','suspended','nonmember','secondOwner','newOwner','recoverOwner'];
function plan(retainedIds=[]) {
  const runId='c01-e2e-'+randomUUID();
  const actors=Object.fromEntries(roles.map(role=>[role,{id:randomUUID(),memberId:randomUUID(),email:runId+'-'+role+'@example.invalid'}]));
  const p={runId,projectRef:'oejxwsvlvelxmfbysjbx',actors,organizationId:randomUUID(),secondOrganizationId:randomUUID(),recoveryOrganizationId:randomUUID(),invitationEmail:runId+'-invite@example.invalid',workflowId:randomUUID(),approvalId:randomUUID(),workflowRunId:randomUUID(),failureRunId:randomUUID()};
  validatePlan(p,retainedIds);return p;
}
function validatePlan(p,retainedIds=[]) {
  if(p.projectRef!=='oejxwsvlvelxmfbysjbx' || !/^c01-e2e-[0-9a-f-]{36}$/.test(p.runId))throw Error('Invalid fixture namespace');
  const ids=[p.organizationId,p.secondOrganizationId,p.recoveryOrganizationId,p.workflowId,p.approvalId,p.workflowRunId,p.failureRunId,...roles.flatMap(role=>[p.actors[role]?.id,p.actors[role]?.memberId])];
  if(ids.some(id=>typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||retainedIds.includes(id)) || new Set(ids).size!==ids.length)throw Error('Fixture ID collision');
  for(const role of roles)if(p.actors[role].email!==p.runId+'-'+role+'@example.invalid')throw Error('Non-synthetic actor');
  return p;
}
module.exports={plan,validatePlan,roles};
