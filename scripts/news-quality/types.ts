export type Risk = 'low' | 'medium' | 'high'
export type EvidenceMode = 'TRUSTED_SINGLE_SOURCE' | 'ENHANCED_VERIFICATION'
export type EditorialClassification = {
  publisherTrust: 'TRUSTED_EDITORIAL' | 'NOT_TRUSTED';
  contentType: 'STAFF_REPORTING' | 'CONTRIBUTOR' | 'OPINION' | 'SPONSORED' | 'SYNDICATED' | 'AGGREGATION' | 'COMMUNITY' | 'AMBIGUOUS' | 'PRIMARY';
  indicators: string[];
}
export type Reason = 'INSUFFICIENT_EVIDENCE' | 'NO_PRIMARY_SOURCE' | 'CONFLICTING_SOURCES' | 'UNVERIFIED_HIGH_RISK_CLAIM' | 'DUPLICATE_STORY' | 'STALE_STORY' | 'LOW_INFORMATION_VALUE' | 'INVALID_DATE' | 'UNVERIFIED_ENTITY' | 'UNSUPPORTED_CLAIM' | 'UNVERIFIED_QUOTE' | 'MALFORMED_MODEL_OUTPUT' | 'SOURCE_RETRIEVAL_FAILED' | 'BUDGET_EXHAUSTED'
export class Rejection extends Error { constructor(public reason: Reason, public detail?: string) { super(reason) } }
export type Candidate = { title: string; url: string; publishedAt: string; discoveryLinks?: string[] }
export type Source = {
  id: string; url: string; name: string; tier: 1 | 2 | 3; group: string;
  text: string; publishedAt: string; links: string[]; imageUrl?: string; originGroups?: string[];
  title?: string; requestedUrl?: string; editorial?: EditorialClassification;
}
export type Fact = { id: string; claim: string; core: boolean; confidence: number; supportedBy: Array<{ sourceId: string; excerpt: string }> }
export type NewsEvent = { entities: string[]; action: string; product: string; eventDate: string }
export type FactSheet = {
  story: string; event: NewsEvent; eventSourceId: string; eventDateEvidence: string;
  confirmedFacts: Fact[]; uncertainClaims: string[]; conflictingClaims: string[];
  riskLevel: Risk; riskAssessments: import('./risk').ClaimRisk[]; confidence: number;
}
export type Paragraph = { text: string; factIds: string[] }
export type Draft = { title: string; deck: string; sections: Array<{ heading: string; kind: 'facts' | 'analysis'; paragraphs: Paragraph[] }> }
export type Review = { supportedFactIds: string[]; unsupportedClaims: string[]; conflictingClaims: string[]; unverifiedEntities: string[]; derivativeGroups: string[][]; authoritativePrimaryIds: string[]; trustedEditorialSourceIds: string[]; eventDateVerified: boolean; independentReporting: boolean; analysisGrounded: boolean; originalValue: boolean; clearWriting: boolean; riskLevel: Risk; riskAssessments: import('./risk').ClaimRisk[] }
export type HistoricalStory = { slug: string; title: string; deck?: string; publishedAt: string; newsEvent?: NewsEvent; sources?: Array<{ name: string; url: string }> }
export type Approved = { draft: Draft; facts: FactSheet; sources: Source[]; qualityScore: number; removedParagraphs: number; evidenceMode: EvidenceMode }
export type Model = (stage: 'facts' | 'draft' | 'review', input: unknown) => Promise<unknown>
