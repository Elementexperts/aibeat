-- Adds connector lifecycle fields and pilot integration definitions.

alter table integrations
  add column if not exists category text,
  add column if not exists auth_type text not null default 'NONE',
  add column if not exists pilot_priority integer not null default 100,
  add column if not exists oauth_scopes text[] not null default '{}',
  add column if not exists description text not null default '';

alter table integration_connections
  add column if not exists access_token_expires_at timestamptz,
  add column if not exists refresh_token_rotated_at timestamptz,
  add column if not exists last_connected_at timestamptz,
  add column if not exists last_health_check_at timestamptz,
  add column if not exists last_error text,
  add column if not exists reconnect_url text;

create unique index if not exists integration_connections_org_integration_uidx
  on integration_connections(organization_id, integration_id);

insert into integrations (id, name, capabilities, category, auth_type, pilot_priority, oauth_scopes, description)
values
  (
    'google-workspace',
    'Google Workspace',
    array['READ','CREATE','WRITE'],
    'GOOGLE_WORKSPACE',
    'OAUTH2',
    1,
    array['openid','email','profile','https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/calendar.readonly'],
    'Pilot connector for Drive, Docs, Sheets, Calendar, and workspace context.'
  ),
  (
    'crm',
    'CRM',
    array['READ','CREATE','WRITE'],
    'CRM',
    'OAUTH2',
    2,
    array['contacts.read','contacts.write','deals.read'],
    'Pilot CRM connector for accounts, contacts, duplicate checks, notes, and pipeline signals.'
  ),
  (
    'email-slack',
    'Email / Slack',
    array['READ','CREATE'],
    'EMAIL_COLLABORATION',
    'OAUTH2',
    3,
    array['email.read','email.compose','chat.write'],
    'Pilot collaboration connector for email drafting, notifications, and Slack delivery.'
  )
on conflict (id) do update set
  name = excluded.name,
  capabilities = excluded.capabilities,
  category = excluded.category,
  auth_type = excluded.auth_type,
  pilot_priority = excluded.pilot_priority,
  oauth_scopes = excluded.oauth_scopes,
  description = excluded.description,
  updated_at = now();
