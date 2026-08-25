import type { ConnectorCapability, IntegrationConnection, IntegrationConnectionStatus, IntegrationDefinition } from './types'

export interface ConnectorResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  summary: string
}

export interface Connector {
  id: string
  name: string
  capabilities: ConnectorCapability[]
  healthCheck(connection?: IntegrationConnection): Promise<ConnectorResult>
  execute(action: string, input: unknown): Promise<ConnectorResult>
}

export class PilotConnector implements Connector {
  constructor(
    public id: string,
    public name: string,
    public capabilities: ConnectorCapability[],
  ) {}

  async healthCheck(connection?: IntegrationConnection): Promise<ConnectorResult> {
    const status = getEffectiveConnectionStatus(connection)
    if (status !== 'CONNECTED') {
      return { ok: false, error: status, summary: `${this.name} requires ${status === 'TOKEN_EXPIRED' ? 'token refresh' : 'connection'}` }
    }
    return { ok: true, summary: `${this.name} connected` }
  }

  async execute(action: string, input: unknown): Promise<ConnectorResult> {
    return {
      ok: true,
      data: { action, input, connectorId: this.id },
      summary: `${this.name} executed ${action}`,
    }
  }
}

export const pilotIntegrationDefinitions: IntegrationDefinition[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'GOOGLE_WORKSPACE',
    authType: 'OAUTH2',
    capabilities: ['READ', 'CREATE', 'WRITE'],
    pilotPriority: 1,
    oauthScopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/calendar.readonly'],
    description: 'Pilot connector for Drive, Docs, Sheets, Calendar, and workspace context.',
  },
  {
    id: 'crm',
    name: 'CRM',
    category: 'CRM',
    authType: 'OAUTH2',
    capabilities: ['READ', 'CREATE', 'WRITE'],
    pilotPriority: 2,
    oauthScopes: ['contacts.read', 'contacts.write', 'deals.read'],
    description: 'Pilot CRM connector for accounts, contacts, duplicate checks, notes, and pipeline signals.',
  },
  {
    id: 'email-slack',
    name: 'Email / Slack',
    category: 'EMAIL_COLLABORATION',
    authType: 'OAUTH2',
    capabilities: ['READ', 'CREATE'],
    pilotPriority: 3,
    oauthScopes: ['email.read', 'email.compose', 'chat.write'],
    description: 'Pilot collaboration connector for email drafting, notifications, and Slack delivery.',
  },
]

export const integrationDefinitions: IntegrationDefinition[] = [
  ...pilotIntegrationDefinitions,
  { id: 'analytics', name: 'Google Analytics', category: 'ANALYTICS', authType: 'OAUTH2', capabilities: ['READ'], pilotPriority: 4, description: 'Read analytics KPIs and traffic trends.' },
  { id: 'search-console', name: 'Google Search Console', category: 'ANALYTICS', authType: 'OAUTH2', capabilities: ['READ'], pilotPriority: 5, description: 'Read search visibility and query trends.' },
  { id: 'documents', name: 'Documents', category: 'DOCUMENTS', authType: 'NONE', capabilities: ['READ', 'CREATE', 'WRITE'], pilotPriority: 6, description: 'Internal Business Memory document store.' },
  { id: 'web-research', name: 'Web Research', category: 'WEB_RESEARCH', authType: 'NONE', capabilities: ['READ'], pilotPriority: 7, description: 'Public web research adapter.' },
  { id: 'notifications', name: 'Notifications', category: 'NOTIFICATIONS', authType: 'OAUTH2', capabilities: ['READ', 'CREATE'], pilotPriority: 8, description: 'Slack or Teams notifications.' },
  { id: 'email', name: 'Email', category: 'EMAIL_COLLABORATION', authType: 'OAUTH2', capabilities: ['READ', 'CREATE'], pilotPriority: 9, description: 'Email read and draft adapter.' },
]

export const connectorRegistry: Record<string, Connector> = {
  'google-workspace': new PilotConnector('google-workspace', 'Google Workspace', ['READ', 'CREATE', 'WRITE']),
  crm: new PilotConnector('crm', 'CRM', ['READ', 'CREATE', 'WRITE']),
  'email-slack': new PilotConnector('email-slack', 'Email / Slack', ['READ', 'CREATE']),
  analytics: new PilotConnector('analytics', 'Google Analytics', ['READ']),
  'search-console': new PilotConnector('search-console', 'Google Search Console', ['READ']),
  email: new PilotConnector('email', 'Email', ['READ', 'CREATE']),
  documents: new PilotConnector('documents', 'Documents', ['READ', 'CREATE', 'WRITE']),
  'web-research': new PilotConnector('web-research', 'Web Research', ['READ']),
  notifications: new PilotConnector('notifications', 'Slack / Teams', ['READ', 'CREATE']),
}

export function getIntegrationDefinition(id: string): IntegrationDefinition | undefined {
  return integrationDefinitions.find((integration) => integration.id === id)
}

export function getEffectiveConnectionStatus(connection?: IntegrationConnection): IntegrationConnectionStatus {
  if (!connection) return 'NOT_CONNECTED'
  if (connection.status !== 'CONNECTED') return connection.status
  if (connection.accessTokenExpiresAt && new Date(connection.accessTokenExpiresAt).getTime() <= Date.now()) return 'TOKEN_EXPIRED'
  return 'CONNECTED'
}

export function buildOAuthStartUrl(integrationId: string, organizationId: string): string {
  const definition = getIntegrationDefinition(integrationId)
  if (!definition || definition.authType !== 'OAUTH2') return ''
  const params = new URLSearchParams({
    integration: integrationId,
    organization: organizationId,
    scopes: (definition.oauthScopes ?? []).join(' '),
  })
  return `/business/integrations/oauth/start?${params.toString()}`
}
