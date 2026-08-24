export const FOUNDER_ANALYTICS_EVENTS = {
  founderPageView: 'founder_page_view',
  pricingPlanView: 'pricing_plan_view',
  pricingPlanSelect: 'pricing_plan_select',
  submitFreeClick: 'submit_free_click',
  simplePlacementClick: 'simple_placement_click',
  featuredPlacementClick: 'featured_placement_click',
  spotlightProClick: 'spotlight_pro_click',
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

export const BUSINESS_ANALYTICS_EVENTS = {
  teaserClicked: 'business_teaser_clicked',
  calculatorViewed: 'ai_spend_calculator_viewed',
  calculatorInputChanged: 'calculator_input_changed',
  calculatorCompleted: 'calculator_completed',
  businessCalculatorCompleted: 'business_calculator_completed',
  earlyAccessClicked: 'early_access_clicked',
  earlyAccessSubmitted: 'early_access_submitted',
  demoOpened: 'business_demo_opened',
  signupStarted: 'business_signup_started',
  signupCompleted: 'business_signup_completed',
  pricingViewed: 'business_pricing_viewed',
  planSelected: 'business_plan_selected',
  surveyClicked: 'business_survey_clicked',
} as const

export type BusinessAnalyticsEvent = typeof BUSINESS_ANALYTICS_EVENTS[keyof typeof BUSINESS_ANALYTICS_EVENTS]

export function founderEventForPlan(planId: string): FounderAnalyticsEvent {
  if (planId === 'free') return FOUNDER_ANALYTICS_EVENTS.submitFreeClick
  if (planId === 'simple') return FOUNDER_ANALYTICS_EVENTS.simplePlacementClick
  if (planId === 'featured') return FOUNDER_ANALYTICS_EVENTS.featuredPlacementClick
  if (planId === 'spotlight_pro') return FOUNDER_ANALYTICS_EVENTS.spotlightProClick
  if (planId === 'launch-campaign') return FOUNDER_ANALYTICS_EVENTS.launchFeatureClick
  if (planId === 'newsletter-sponsorship') return FOUNDER_ANALYTICS_EVENTS.newsletterFeatureClick
  if (planId === 'sponsored-article') return FOUNDER_ANALYTICS_EVENTS.sponsoredArticleClick
  if (planId === 'growth-campaign') return FOUNDER_ANALYTICS_EVENTS.growthCampaignClick
  if (planId === 'partnership') return FOUNDER_ANALYTICS_EVENTS.partnerApplicationClick
  return FOUNDER_ANALYTICS_EVENTS.pricingPlanSelect
}
