"""Eight synthetic concurrency plans. Rendering never connects to a database."""
import json
import uuid

def q(value): return "'"+str(value).replace("'","''")+"'"
def build(name):
 ids={k:str(uuid.uuid4()) for k in ['a','b','target','org','ma','mb','mt','workflow','run','step','approval']}
 v={k:q(x) for k,x in ids.items()}
 setup=[f"INSERT INTO auth.users(id,email) VALUES ({v[k]},'c01-{ids[k]}@example.invalid')" for k in ['a','b','target']]
 checks=[]
 common=name not in ['provisioning','onboarding']
 if common:
  setup += [f"INSERT INTO public.organizations(id,name,primary_profile,created_by) VALUES ({v['org']},'C01 concurrency','CONSULTING',{v['a']})"]
  for user,member,role in [('a','ma','OWNER'),('b','mb','OWNER'),('target','mt','MEMBER')]:
   setup.append(f"INSERT INTO public.organization_members(id,organization_id,user_id,role,status) VALUES ({v[member]},{v['org']},{v[user]},'{role}','ACTIVE')")
 def change(member,role,status='ACTIVE'):
  return f"SELECT public.change_business_member({v['org']},{v[member]},'{role}','{status}')"
 expected=None; release='COMMIT'; same_result=False
 if name=='removal':
  a=f"SELECT public.remove_business_member({v['org']},{v['ma']})"; b=f"SELECT public.remove_business_member({v['org']},{v['mb']})"
  expected=('23514','LAST_ACTIVE_OWNER')
  checks += [f"SELECT count(*)=0 FROM public.organization_members WHERE id={v['ma']}"]
 elif name=='demotion':
  a=change('ma','MEMBER'); b=change('mb','MEMBER'); expected=('23514','LAST_ACTIVE_OWNER')
  checks += [f"SELECT role='MEMBER' FROM public.organization_members WHERE id={v['ma']}"]
 elif name=='suspension':
  a=change('ma','OWNER','SUSPENDED'); b=change('mb','OWNER','SUSPENDED'); expected=('23514','LAST_ACTIVE_OWNER')
  checks += [f"SELECT status='SUSPENDED' FROM public.organization_members WHERE id={v['ma']}"]
 elif name=='role_conflict':
  a=change('mt','ADMIN'); b=change('mt','MANAGER')
  checks += [f"SELECT role='MANAGER' AND status='ACTIVE' FROM public.organization_members WHERE id={v['mt']}",f"SELECT count(*)=2 FROM public.audit_events WHERE organization_id={v['org']} AND entity_id={q(ids['mt'])}"]
 elif name in ['approval_conflict','approval_rollback']:
  steps=q(json.dumps([{'id':'review','name':'Review','action':'publish content','risk':'APPROVAL_REQUIRED'}]))
  policy=q(json.dumps({'approverRoles':['OWNER','ADMIN','MANAGER'],'requiredForRisks':['APPROVAL_REQUIRED']}))
  setup += [f"INSERT INTO public.workflows(id,organization_id,name,description,agent_type,trigger,status,steps,approval_policy) VALUES ({v['workflow']},{v['org']},'C01 concurrency approval','synthetic','MARKETING_CONTENT','MANUAL','ACTIVE',{steps}::jsonb,{policy}::jsonb)",
   f"INSERT INTO public.workflow_runs(id,organization_id,workflow_id,status,idempotency_key) VALUES ({v['run']},{v['org']},{v['workflow']},'WAITING_FOR_APPROVAL',{q(ids['run'])})",
   f"INSERT INTO public.workflow_steps(id,organization_id,workflow_run_id,step_definition_id,name,risk,status) VALUES ({v['step']},{v['org']},{v['run']},'review','Review','APPROVAL_REQUIRED','WAITING_FOR_APPROVAL')",
   f"UPDATE public.workflow_runs SET current_step_id={v['step']} WHERE id={v['run']}",
   f"INSERT INTO public.approvals(id,organization_id,workflow_id,workflow_run_id,workflow_step_id,agent_type,action_type,action_risk,proposed_action,proposed_payload,target_system,target_entity,reason,requested_by) VALUES ({v['approval']},{v['org']},{v['workflow']},{v['run']},{v['step']},'MARKETING_CONTENT','publish content','APPROVAL_REQUIRED','publish content',jsonb_build_object('stepId','review','content','synthetic'),'documents','C01','test',{v['a']})"]
  a=f"SELECT public.decide_business_approval({v['org']},{v['approval']},'APPROVED')"
  b=f"SELECT public.decide_business_approval({v['org']},{v['approval']},'{ 'REJECTED' if name=='approval_conflict' else 'APPROVED'}')"
  if name=='approval_conflict': expected=('23514','APPROVAL_ALREADY_RESOLVED')
  else: release='ROLLBACK'
  winner='a' if name=='approval_conflict' else 'b'
  checks += [f"SELECT status='APPROVED' AND resolved_by={v[winner]} FROM public.approvals WHERE id={v['approval']}",f"SELECT status='COMPLETED' FROM public.workflow_runs WHERE id={v['run']}",f"SELECT count(*)=1 FROM public.audit_events WHERE organization_id={v['org']} AND event_type='APPROVAL_APPROVED'",f"SELECT count(*)=0 FROM public.audit_events WHERE organization_id={v['org']} AND actor_user_id={v['a' if winner=='b' else 'b']}"]
 elif name in ['provisioning','onboarding']:
  a=b=("SELECT public.create_business_organization('C01 concurrent',9,'CONSULTING','{}')" if name=='provisioning' else "SELECT public.complete_business_onboarding('C01 concurrent',9,'CONSULTING','Lead Research & Qualification','Synthetic concurrent onboarding')")
  same_result=True
  checks += [f"SELECT count(*)=1 FROM public.organizations WHERE created_by={v['a']}",f"SELECT count(*)=1 FROM public.organization_members WHERE user_id={v['a']} AND role='OWNER' AND status='ACTIVE'"]
  if name=='onboarding':
   checks += [f"SELECT business_onboarded_at IS NOT NULL FROM public.organizations WHERE created_by={v['a']}",f"SELECT count(*)=1 FROM public.business_context_items WHERE organization_id IN (SELECT id FROM public.organizations WHERE created_by={v['a']}) AND category='ONBOARDING'",f"SELECT count(*)=(SELECT count(*) FROM public.workflow_templates WHERE status='ACTIVE') AND count(*)=count(DISTINCT template_id) FROM public.workflows WHERE organization_id IN (SELECT id FROM public.organizations WHERE created_by={v['a']})",f"SELECT count(*)=1 FROM public.audit_events WHERE organization_id IN (SELECT id FROM public.organizations WHERE created_by={v['a']}) AND event_type='BUSINESS_ONBOARDED'"]
 else: raise ValueError('Unknown scenario')
 if name in ['removal','demotion','suspension']:
  checks += [f"SELECT count(*)=1 FROM public.organization_members WHERE organization_id={v['org']} AND role='OWNER' AND status='ACTIVE'", f"SELECT role='OWNER' AND status='ACTIVE' FROM public.organization_members WHERE id={v['mb']}", f"SELECT count(*)=1 FROM public.audit_events WHERE organization_id={v['org']}"]
 return dict(name=name,ids=ids,setup=setup,a=a,b=b,user_a=ids['a'],user_b=ids['a'] if same_result else ids['b'],expected=expected,release=release,same_result=same_result,checks=checks)

NAMES=['removal','demotion','suspension','role_conflict','approval_conflict','approval_rollback','provisioning','onboarding']
if __name__=='__main__': print(json.dumps([build(n) for n in NAMES],indent=2))
