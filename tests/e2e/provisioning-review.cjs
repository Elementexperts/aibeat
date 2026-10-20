// Offline review artifact generator. No transport, auth admin or SQL executor is imported.
const {validatePlan,roles}=require('./fixture-plan.cjs');
function reviewProvisioning(plan,retainedIds=[]) {
  validatePlan(plan,retainedIds);
  const operations=roles.map(role=>({phase:'identities',actor:role,operation:'create exactly one preconfirmed synthetic auth identity',email:plan.actors[role].email,plannedId:plan.actors[role].id,passwordSource:'protected setup-only input; never ledger/runtime',emailDelivery:false,credentialScope:'separate short-lived setup process'}));
  operations.push(...[['owner','primary'],['secondOwner','secondary'],['recoverOwner','recovery']].map(([actor,tenant])=>({phase:'organizations',actor,tenant,operation:'authenticated creator RPC; record actual returned organization/member IDs'})));
  operations.push({phase:'membership',operation:'legitimate invitation acceptance / activation',status:'BLOCKED',reason:'accept_business_invitation is prepared in additive migration 202610200001, NOT APPLIED or database-validated. Use owner invitation and verified-recipient acceptance after separate approvals; then owner-authorized suspension. No direct SQL/service-role membership insertion.',acceptanceRPC:'accept_business_invitation',acceptanceRoute:'/business/invitations/accept?invitation=<actual-returned-id>'});
  operations.push({phase:'data',operation:'authenticated owner/admin APIs only',items:['one clean single-boundary workflow with no prior runs','separate pending-approval and failure-display fixtures','populated secondary-tenant document/workflow/approval sentinels','exact own/foreign storage objects','naturally produced audit actor/event/entity/run identifiers'],status:'BLOCKED pending exact versioned definitions and membership activation'});
  return {projectRef:plan.projectRef,runId:plan.runId,decision:'BLOCKED',counts:{accounts:9,preparedOrganizations:3,uiCreatedOrganizations:1},operations,inventory:{record:['actual auth/org/member/workflow/run/step/approval/document/audit IDs','exact bucket/object paths','timestamp and actor for each operation','proposed-to-actual ID mapping'],passwords:false,tokens:false},cleanup:'retain; no broad deletion or automatic cleanup',preserveRetainedEvidence:true};
}
function executeProvisioning(){throw Error('Provisioning execution gate closed; no accounts or database operations performed');}
if(require.main===module){console.error('Preparation/review module only. Provisioning is not authorized.');process.exitCode=1;}
module.exports={reviewProvisioning,executeProvisioning};
