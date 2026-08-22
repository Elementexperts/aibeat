import type { ConnectorCapability } from './types'

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
  healthCheck(): Promise<ConnectorResult>
  execute(action: string, input: unknown): Promise<ConnectorResult>
}

export class MockConnector implements Connector {
  constructor(
    public id: string,
    public name: string,
    public capabilities: ConnectorCapability[],
  ) {}

  async healthCheck(): Promise<ConnectorResult> {
    return { ok: true, summary: `${this.name} mock connector healthy` }
  }

  async execute(action: string, input: unknown): Promise<ConnectorResult> {
    return {
      ok: true,
      data: { action, input },
      summary: `${this.name} mock executed ${action}`,
    }
  }
}

export const connectorRegistry: Record<string, Connector> = {
  'google-workspace': new MockConnector('google-workspace', 'Google Workspace', ['READ', 'CREATE', 'WRITE']),
  crm: new MockConnector('crm', 'CRM', ['READ', 'CREATE', 'WRITE']),
  analytics: new MockConnector('analytics', 'Google Analytics', ['READ']),
  'search-console': new MockConnector('search-console', 'Google Search Console', ['READ']),
  email: new MockConnector('email', 'Email', ['READ', 'CREATE']),
  documents: new MockConnector('documents', 'Documents', ['READ', 'CREATE', 'WRITE']),
  'web-research': new MockConnector('web-research', 'Web Research', ['READ']),
  notifications: new MockConnector('notifications', 'Slack / Teams', ['READ', 'CREATE']),
}
