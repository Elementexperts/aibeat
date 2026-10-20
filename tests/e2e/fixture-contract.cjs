const {roles}=require('./fixture-plan.cjs');
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
function validateFixtureManifest(m) {
  if(!/^c01-e2e-[0-9a-f-]{36}$/.test(m.runId))throw Error('Fresh fixture namespace required');
  const all=[];
  for(const role of roles){const a=m.actors?.[role];if(!a||!uuid(a.id)||!uuid(a.memberId)||a.email!==`${m.runId}-${role}@example.invalid`||typeof a.password!=='string'||!a.password)throw Error('Invalid synthetic actor');all.push(a.id,a.memberId);}
  for(const key of ['organizationId','secondOrganizationId','recoveryOrganizationId','workflowId','approvalId','workflowRunId','failureRunId']){if(!uuid(m[key]))throw Error('Fixture ID required');all.push(m[key]);}
  if(new Set(all).size!==all.length)throw Error('Fixture IDs must be unique');
  if(m.storageBucket!=='business-documents'||m.invitationEmail!==m.runId+'-invite@example.invalid')throw Error('Fixture bucket/invitation mismatch');
  const safePath=(value,org)=>typeof value==='string'&&value.startsWith(org+'/'+m.runId+'/')&&!value.includes('..')&&!value.includes('%')&&!value.includes('\\');
  if(m.permittedStoragePath&&!safePath(m.permittedStoragePath,m.organizationId))throw Error('Own storage fixture path escaped namespace');
  if(m.foreign){for(const key of ['documentId','workflowId','approvalId']){if(!uuid(m.foreign[key])||all.includes(m.foreign[key]))throw Error('Foreign sentinel ID required');all.push(m.foreign[key]);}if(!safePath(m.foreign.storagePath,m.secondOrganizationId))throw Error('Foreign storage fixture path escaped namespace');}
  if(m.auditExpectation){const e=m.auditExpectation;if(!uuid(e.id)||!roles.includes(e.actorRole)||!/^[A-Z_]+$/.test(e.eventType)||!e.entityId||e.workflowRunId!==m.failureRunId)throw Error('Exact failure audit fixture required');}
  return m;
}
module.exports={validateFixtureManifest};
