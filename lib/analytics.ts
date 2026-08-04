export const FOUNDER_ANALYTICS_EVENTS = {
  founderPageView: 'founder_page_view',
  pricingPlanView: 'pricing_plan_view',
  pricingPlanSelect: 'pricing_plan_select',
  submitFreeClick: 'submit_free_click',
  enhancedListingClick: 'enhanced_listing_click',
  spotlightClick: 'spotlight_click',
  launchFeatureClick: 'launch_feature_click',
  newsletterFeatureClick: 'newsletter_feature_click',
  sponsoredArticleClick: 'sponsored_article_click',
  growthCampaignClick: 'growth_campaign_click',
  partnerApplicationClick: 'partner_application_click',
  mediaKitRequest: 'media_kit_request',
  founderFormStart: 'founder_form_start',
  founderFormComplete: 'founder_form_complete',
} as const

export type FounderAnalyticsEvent = typeof FOUNDER_ANALYTICS_EVENTS[keyof typeof FOUNDER_ANALYTICS_EVENTS]

export function founderEventForPlan(planId: string): FounderAnalyticsEvent {
  if (planId === 'free') return FOUNDER_ANALYTICS_EVENTS.submitFreeClick
  if (planId === 'enhanced') return FOUNDER_ANALYTICS_EVENTS.enhancedListingClick
  if (planId === 'spotlight') return FOUNDER_ANALYTICS_EVENTS.spotlightClick
  if (planId === 'launch-feature') return FOUNDER_ANALYTICS_EVENTS.launchFeatureClick
  if (planId === 'newsletter-feature') return FOUNDER_ANALYTICS_EVENTS.newsletterFeatureClick
  if (planId === 'sponsored-article') return FOUNDER_ANALYTICS_EVENTS.sponsoredArticleClick
  if (planId === 'growth-campaign') return FOUNDER_ANALYTICS_EVENTS.growthCampaignClick
  if (planId === 'partnership') return FOUNDER_ANALYTICS_EVENTS.partnerApplicationClick
  return FOUNDER_ANALYTICS_EVENTS.pricingPlanSelect
}
