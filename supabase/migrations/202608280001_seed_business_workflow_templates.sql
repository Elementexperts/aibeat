insert into public.workflow_templates (
  id,
  name,
  description,
  agent_type,
  trigger,
  schedule,
  inputs,
  steps,
  required_integrations,
  approval_policy,
  output_definition,
  status,
  version
)
values

(
  'tpl-lead-research',
  'Lead Research & Qualification',
  'Research a prospect, compare it against ICP, detect duplicates, and prepare an evidence-based fit score.',
  'LEAD_RESEARCH',
  'MANUAL',
  null,
  '[
    {
      "key": "leadUrl",
      "label": "Prospect website or CRM lead",
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "id": "read-context",
      "name": "Retrieve business context",
      "description": "Load ICP, products, CRM hints, and previous findings.",
      "action": "searchBusinessContext",
      "risk": "READ"
    },
    {
      "id": "research-lead",
      "name": "Research prospect",
      "description": "Collect public prospect evidence and CRM duplicate checks.",
      "action": "researchCompany",
      "risk": "READ",
      "connectorId": "web-research"
    },
    {
      "id": "score-lead",
      "name": "Score fit",
      "description": "Generate structured fit score, risks, evidence, and outreach angle.",
      "action": "generate lead qualification brief",
      "risk": "DRAFT"
    },
    {
      "id": "approval",
      "name": "Request next-action approval",
      "description": "Pause before CRM note or outreach task creation.",
      "action": "create CRM note",
      "risk": "APPROVAL_REQUIRED",
      "connectorId": "crm"
    }
  ]'::jsonb,
  array['CRM', 'Web research'],
  '{
    "requiredForRisks": ["APPROVAL_REQUIRED"],
    "approverRoles": ["OWNER", "ADMIN", "MANAGER"]
  }'::jsonb,
  '{
    "leadName": "string",
    "company": "string",
    "fitScore": "number",
    "confidence": "number",
    "reasons": "string[]",
    "evidence": "string[]",
    "likelyNeeds": "string[]",
    "risks": "string[]",
    "recommendedNextAction": "string",
    "suggestedOutreachAngle": "string"
  }'::jsonb,
  'ACTIVE',
  1
),

(
  'tpl-competitor-monitor',
  'Competitor / Market Monitoring',
  'Monitor configured competitors and markets, deduplicate known developments, and rank what matters.',
  'COMPETITOR_MONITOR',
  'SCHEDULED',
  'Weekdays 07:00',
  '[
    {
      "key": "competitorSet",
      "label": "Competitor or market list",
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "id": "load-known",
      "name": "Load known findings",
      "description": "Retrieve previous competitor findings with source dates.",
      "action": "getCompetitorFindings",
      "risk": "READ"
    },
    {
      "id": "research-market",
      "name": "Research developments",
      "description": "Use public and connected sources to find material changes.",
      "action": "researchCompany",
      "risk": "READ",
      "connectorId": "web-research"
    },
    {
      "id": "rank",
      "name": "Rank and deduplicate",
      "description": "Identify opportunity, risk, and recommended response.",
      "action": "generate market monitoring finding",
      "risk": "DRAFT"
    }
  ]'::jsonb,
  array['Web research'],
  '{
    "requiredForRisks": ["APPROVAL_REQUIRED"],
    "approverRoles": ["OWNER", "ADMIN", "MANAGER"]
  }'::jsonb,
  '{
    "development": "string",
    "competitorOrMarket": "string",
    "importanceScore": "number",
    "whyItMatters": "string",
    "source": "string",
    "sourceDate": "string",
    "opportunity": "string",
    "risk": "string",
    "recommendedResponse": "string"
  }'::jsonb,
  'ACTIVE',
  1
),

(
  'tpl-marketing-content',
  'Marketing & Content Workflow',
  'Turn context, market findings, campaign goals, and prior content into briefs and approval-ready drafts.',
  'MARKETING_CONTENT',
  'MANUAL',
  null,
  '[
    {
      "key": "campaignGoal",
      "label": "Campaign goal",
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "id": "load-brand",
      "name": "Load brand and context",
      "description": "Retrieve brand, ICP, products, prior content, and competitor findings.",
      "action": "searchBusinessContext",
      "risk": "READ"
    },
    {
      "id": "brief",
      "name": "Create content brief",
      "description": "Create evidence-backed opportunity and brief.",
      "action": "draft content brief",
      "risk": "DRAFT"
    },
    {
      "id": "draft",
      "name": "Create draft",
      "description": "Draft content in approved tone with sources attached.",
      "action": "draft content",
      "risk": "DRAFT"
    },
    {
      "id": "publish-approval",
      "name": "Publication approval",
      "description": "External publishing cannot happen without approval.",
      "action": "publish content",
      "risk": "APPROVAL_REQUIRED",
      "connectorId": "documents"
    }
  ]'::jsonb,
  array['Documents'],
  '{
    "requiredForRisks": ["APPROVAL_REQUIRED"],
    "approverRoles": ["OWNER", "ADMIN", "MANAGER"]
  }'::jsonb,
  '{
    "opportunity": "string",
    "brief": "string",
    "draft": "string",
    "sources": "string[]"
  }'::jsonb,
  'ACTIVE',
  1
),

(
  'tpl-weekly-report',
  'Weekly Business Reporting',
  'Collect KPIs, compare periods, explain changes, include findings, and recommend next actions.',
  'WEEKLY_REPORT',
  'SCHEDULED',
  'Monday 08:00',
  '[
    {
      "key": "reportingPeriod",
      "label": "Reporting period",
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "id": "collect-kpis",
      "name": "Collect KPI inputs",
      "description": "Read analytics, CRM, workflow, spend, and findings.",
      "action": "readAnalytics",
      "risk": "READ",
      "connectorId": "analytics"
    },
    {
      "id": "analyze",
      "name": "Analyze changes",
      "description": "Detect anomalies, wins, risks, and likely causes.",
      "action": "generate weekly report",
      "risk": "DRAFT"
    },
    {
      "id": "approval",
      "name": "Report approval",
      "description": "Approval is needed before sending client or executive reports.",
      "action": "send client report",
      "risk": "APPROVAL_REQUIRED",
      "connectorId": "email"
    }
  ]'::jsonb,
  array['Analytics', 'CRM', 'Email'],
  '{
    "requiredForRisks": ["APPROVAL_REQUIRED"],
    "approverRoles": ["OWNER", "ADMIN", "MANAGER"]
  }'::jsonb,
  '{
    "reportingPeriod": "string",
    "executiveSummary": "string",
    "KPIChanges": "string[]",
    "wins": "string[]",
    "risks": "string[]",
    "anomalies": "string[]",
    "explanations": "string[]",
    "recommendedActions": "string[]"
  }'::jsonb,
  'ACTIVE',
  1
),

(
  'tpl-executive-brief',
  'Executive Daily Brief',
  'Synthesize opportunities, risks, approvals, deadlines, workflow issues, and spend recommendations for management.',
  'EXECUTIVE_BRIEF',
  'SCHEDULED',
  'Weekdays 07:30',
  '[
    {
      "key": "briefDate",
      "label": "Brief date",
      "required": true
    }
  ]'::jsonb,
  '[
    {
      "id": "collect-signals",
      "name": "Collect management signals",
      "description": "Load agent findings, approvals, calendar, workflow failures, and spend recommendations.",
      "action": "searchBusinessContext",
      "risk": "READ"
    },
    {
      "id": "synthesize",
      "name": "Synthesize brief",
      "description": "Produce concise priorities without repeating low-value noise.",
      "action": "generate executive brief",
      "risk": "DRAFT"
    }
  ]'::jsonb,
  array['Calendar', 'Workflow engine'],
  '{
    "requiredForRisks": ["APPROVAL_REQUIRED"],
    "approverRoles": ["OWNER", "ADMIN", "MANAGER"]
  }'::jsonb,
  '{
    "date": "string",
    "topPriorities": "string[]",
    "opportunities": "string[]",
    "risks": "string[]",
    "pendingDecisions": "string[]",
    "deadlines": "string[]",
    "workflowIssues": "string[]",
    "recommendedActions": "string[]"
  }'::jsonb,
  'ACTIVE',
  1
)

on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  agent_type = excluded.agent_type,
  trigger = excluded.trigger,
  schedule = excluded.schedule,
  inputs = excluded.inputs,
  steps = excluded.steps,
  required_integrations = excluded.required_integrations,
  approval_policy = excluded.approval_policy,
  output_definition = excluded.output_definition,
  status = excluded.status,
  version = excluded.version,
  updated_at = now();