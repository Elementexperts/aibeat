import type { Tool } from '@/lib/data'

// Editorial additions reviewed against submissions and official sites.
// See docs/submission-review-2026-09-07.md and docs/submission-review-2026-09-09.md.
// No hands-on score has been assigned.
export const SUBMITTED_TOOLS: Tool[] = [
{
  "slug": "hypemigo",
  "name": "HypeMigo AI Video Trends",
  "tagline": "Explore AI video trends and prepare local photo drafts",
  "description": "HypeMigo is an independent AI video trend studio with meme, dance, duo and pet templates. Users browse references, review photo requirements, save favorites and prepare drafts in their browser. Video generation is available only when the service is enabled for a template. The site describes 20 credits for a reference-length 480p scene; results and audio are newly generated rather than exact copies of the examples.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "HY",
  "logoUrl": "/tool-logos/hypemigo.png",
  "rating": null,
  "pricing": "Browsing and local drafts are free; generation uses 20 site credits per 480p scene when enabled",
  "pricingType": "freemium",
  "websiteUrl": "https://hypemigo.com/",
  "affiliateUrl": "https://hypemigo.com/",
  "featured": false,
  "pros": [
    "Template references and photo guidance",
    "Local drafts and favorites",
    "No prompt needed to prepare a template"
  ],
  "cons": [
    "Generation availability varies",
    "Drafts are limited to the current browser and device",
    "Results can differ from reference examples"
  ],
  "alternatives": []
},
{
  "slug": "timefolk",
  "name": "Timefolk",
  "tagline": "Find local Experts for practical in-person learning sessions",
  "description": "Timefolk is a marketplace for practical in-person sessions, including interview practice, language conversation, feedback and learning AI tools for work. Clients describe a skill through smart search, choose a local Expert, and schedule a meeting in a public place. The platform says Experts pass document and face checks. An optional Folk companion can attend for a separate fee. Availability depends on local Experts and supported locations.",
  "category": "Education",
  "logo": "#2563eb",
  "logoInitials": "TI",
  "logoUrl": "/tool-logos/timefolk.png",
  "rating": null,
  "pricing": "Free to join; Expert session and card fees apply; optional memberships and Folk companion fees",
  "pricingType": "freemium",
  "websiteUrl": "https://timefolk.com/",
  "affiliateUrl": "https://timefolk.com/",
  "featured": false,
  "pros": [
    "Skill-based local Expert discovery",
    "Public meeting places",
    "Optional companion and session messaging"
  ],
  "cons": [
    "Adults 18 and over only",
    "Local Expert availability varies",
    "Sessions and optional companions cost extra"
  ],
  "alternatives": []
},
{
  "slug": "inkroom",
  "name": "InkRoom",
  "tagline": "Connect references, image generation and editing in reusable creative workflows",
  "description": "InkRoom is a browser-based AI creative workspace for individual creators and small teams. Its public feature pages describe text-to-image generation, reference-image creation, visual editing, enhancement and reusable workflows for product images, posters and visual series. Image-to-video options depend on the current video catalog. Models, account permissions and credit costs vary; users should check the live estimate before generating. External reference uploads require login.",
  "category": "AI Image",
  "logo": "#2563eb",
  "logoInitials": "I",
  "logoUrl": "/tool-logos/inkroom.png",
  "rating": null,
  "pricing": "Credit-based generation; model access, trial availability and costs depend on current account and catalog settings",
  "pricingType": "paid",
  "websiteUrl": "https://inkroom.ai/",
  "affiliateUrl": "https://inkroom.ai/",
  "featured": false,
  "pros": [
    "Reference-image and visual editing workflows",
    "Reusable creative processes",
    "Generation cost estimates"
  ],
  "cons": [
    "Model availability varies",
    "Reference uploads require login",
    "No fixed free allowance guaranteed"
  ],
  "alternatives": []
},
{
  "slug": "showcasevideos-ai",
  "name": "ShowcaseVideos.ai",
  "tagline": "Turn real-estate photos into staged listing videos",
  "description": "ShowcaseVideos.ai creates real-estate listing videos from up to 30 photos or a supported listing URL. Its director workflow combines AI camera motion, optional virtual staging, address information and music. Landscape, vertical and square outputs are available subject to plan and credit rules. The beta offers starting credits without a card, with a small watermark on free output. Agents should review staging and property details before publication.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "S",
  "logoUrl": "/tool-logos/showcasevideos-ai.png",
  "rating": null,
  "pricing": "120 starting credits, no card; paid credit packs from $20 and optional subscriptions",
  "pricingType": "freemium",
  "websiteUrl": "https://showcasevideos.ai/",
  "affiliateUrl": "https://showcasevideos.ai/",
  "featured": false,
  "pros": [
    "Listing URL or photo inputs",
    "Virtual staging and camera motion",
    "Multiple output formats"
  ],
  "cons": [
    "Free output has a watermark",
    "Additional formats and scoring can cost credits",
    "Beta pricing and plan rules may change"
  ],
  "alternatives": []
},
{
  "slug": "repostit",
  "name": "Repostit",
  "tagline": "Automate TikTok cross-posting and manage publishing through AI assistants",
  "description": "Repostit republishes new or existing TikTok videos and supported image or carousel posts to connected social channels. Workflows offer manual or automatic routes, scheduling and delivery checks. Claude and ChatGPT connectors can create workflows, schedule posts and inspect publishing status. Supported destinations include Instagram, YouTube, Facebook, X, Threads, LinkedIn and Pinterest, with content support varying by destination.",
  "category": "Marketing",
  "logo": "#2563eb",
  "logoInitials": "R",
  "logoUrl": "/tool-logos/repostit.png",
  "rating": null,
  "pricing": "14-day trial without a card; paid plans from $10/month billed annually",
  "pricingType": "paid",
  "websiteUrl": "https://repostit.io/",
  "affiliateUrl": "https://repostit.io/",
  "featured": false,
  "pros": [
    "New and back-catalog workflows",
    "Image and carousel support",
    "Claude and ChatGPT connectors"
  ],
  "cons": [
    "Connected platform permissions required",
    "Trial limited to 10 destination posts and 3 workflows",
    "Source and destination support varies"
  ],
  "alternatives": []
},
{
  "slug": "dime-dime-baby-ai",
  "name": "Dime Dime Baby AI Generator",
  "tagline": "Turn portraits into short party-inspired meme videos",
  "description": "Dime Dime Baby AI creates party-inspired clips from one portrait or two photos for a duet. Choose classic party, friends dancing, garden party or character remix scenes. The workflow requests a nine-second 480p video with AI-generated instrumental backing and ambience, rather than the original recording. This independent tool uses purchased credits; likeness and motion can vary.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "DD",
  "logoUrl": "/tool-logos/dime-dime-baby-ai.png",
  "rating": null,
  "pricing": "$6.90 for 1 video, $29.90 for 5, or $99.90 for 20; no subscription",
  "pricingType": "paid",
  "websiteUrl": "https://aidimedimebaby.video/",
  "affiliateUrl": "https://aidimedimebaby.video/",
  "featured": true,
  "pros": [
    "Solo and duet options",
    "Four scene variations",
    "Vertical or landscape framing"
  ],
  "cons": [
    "480p output",
    "Paid generation",
    "Reference examples are not guaranteed results"
  ],
  "alternatives": []
},
{
  "slug": "crazy-frog-ai",
  "name": "Crazy Frog AI Video Generator",
  "tagline": "Preview an invisible-motorcycle chase video studio; checkout coming soon",
  "description": "Crazy Frog AI is an independent photo-to-video studio for comedic invisible-motorcycle chases. One rider photo guides a roughly 15-second scene with a fictional helmeted officer, original instrumental audio and coastal, neon-city or desert settings. The editor advertises 480p and 720p output in vertical or landscape format. Credit packs are currently a catalog preview: the site says checkout will open after payment setup. It is not affiliated with Crazy Frog or its rights holders.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "CF",
  "logoUrl": "/tool-logos/crazy-frog-ai.png",
  "rating": null,
  "pricing": "Preview pricing: $6.90 / $29.90 / $99.90 credit packs; checkout coming soon",
  "pricingType": "paid",
  "websiteUrl": "https://crazyfrogai.art/",
  "affiliateUrl": "https://crazyfrogai.art/",
  "featured": true,
  "pros": [
    "One rider photo",
    "Three scene options",
    "Reusable prompt available"
  ],
  "cons": [
    "Checkout not yet available",
    "No free video generation promised",
    "Likeness and complex motion may vary"
  ],
  "alternatives": []
},
{
  "slug": "flashcrafter-growth-brief",
  "name": "FlashCrafter Growth Brief",
  "tagline": "Research local markets, visibility and practical business growth priorities",
  "description": "FlashCrafter Growth Brief provides private AI-assisted research for local service businesses. It brings together public evidence on local demand, competitors, online visibility and reputation, with visible assumptions and suggested priorities. One initial report per authenticated account and resolved business is free, with no card required. Optional Google account connections can add business performance context. Owners should review the evidence and assumptions before acting on recommendations.",
  "category": "Research",
  "logo": "#2563eb",
  "logoInitials": "FG",
  "logoUrl": "/tool-logos/flashcrafter-growth-brief.png",
  "rating": null,
  "pricing": "One initial report per account and resolved business is free; account required, no card",
  "pricingType": "free",
  "websiteUrl": "https://www.flashcrafter.ai/growth-brief",
  "affiliateUrl": "https://www.flashcrafter.ai/growth-brief",
  "featured": true,
  "pros": [
    "Local-market and competitor research",
    "Visible evidence and assumptions",
    "Private authenticated report"
  ],
  "cons": [
    "Account required",
    "Free initial-report limits apply",
    "AI-assisted recommendations require review"
  ],
  "alternatives": []
},
{
  "slug": "bulin-47-ai-pro",
  "name": "Bulin 47 AI (bulin47aipro.org)",
  "tagline": "Turn a portrait into a silent street-freestyle character video",
  "description": "Bulin 47 AI at bulin47aipro.org replaces a performer in a fixed street-freestyle template using one portrait. It produces approximately 15-second, 480p silent videos; users add music separately. This independent tool uses purchased credits and is distinct from the similarly named bulin47videos.com service. Character likeness and background details can vary.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "B4",
  "logoUrl": "/tool-logos/bulin-47-ai-pro.png",
  "rating": null,
  "pricing": "One-time packs from $6.90 for one video; 20 credits per generation",
  "pricingType": "paid",
  "websiteUrl": "https://bulin47aipro.org/",
  "affiliateUrl": "https://bulin47aipro.org/",
  "featured": false,
  "pros": [
    "One portrait input",
    "Fixed template with no prompt required",
    "One-time credit packs"
  ],
  "cons": [
    "480p silent output",
    "Fixed scene and movements",
    "Likeness may vary"
  ],
  "alternatives": []
},
{
  "slug": "jeanphil-ai",
  "name": "JeanPhil AI",
  "tagline": "Create character scenes from one or two portrait photos",
  "description": "JeanPhil AI creates independent Jean Phil-inspired scenes from one or two portraits. Choose street shadowboxing, a cafe terrace, a pink-suit dance or garden comedy, with vertical or landscape framing. The service offers 15-second 720p MP4 videos with generated music and ambience using one-time credit packs. Use photos with permission; generated likeness varies.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "JA",
  "logoUrl": "/tool-logos/jeanphil-ai.png",
  "rating": null,
  "pricing": "$6.90 for 1 video, $29.90 for 5, or $99.90 for 20; no subscription",
  "pricingType": "paid",
  "websiteUrl": "https://jeanphilaipro.org/",
  "affiliateUrl": "https://jeanphilaipro.org/",
  "featured": false,
  "pros": [
    "Solo or two-person inputs",
    "Four scene styles",
    "Vertical and landscape framing"
  ],
  "cons": [
    "Fixed scene choices",
    "Paid generation",
    "Availability depends on generation service"
  ],
  "alternatives": []
},
{
  "slug": "vellm",
  "name": "Vellm",
  "tagline": "Create short AI videos from portrait and pet-photo templates",
  "description": "Vellm turns people and pet photos into short AI videos using dance, comedy, duo and cinematic templates. Its Create Studio offers additional image and video generation workflows. Template duration, input requirements, resolution and credit costs vary and are shown before generation. One-time packs and optional monthly plans are available; check the current checkout price because public pages show differing starting prices.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "V",
  "logoUrl": "/tool-logos/vellm.png",
  "rating": null,
  "pricing": "Paid credit packs and optional monthly plans; no free trial; confirm current checkout pricing",
  "pricingType": "paid",
  "websiteUrl": "https://vellm.app/",
  "affiliateUrl": "https://vellm.app/",
  "featured": false,
  "pros": [
    "People and pet templates",
    "Costs shown before generation",
    "Additional Create Studio workflows"
  ],
  "cons": [
    "Credits and duration vary by template",
    "Public pricing pages show differing starting prices",
    "Original audio may not be licensed for public posts"
  ],
  "alternatives": []
},
{
  "slug": "vricko",
  "name": "Vricko",
  "tagline": "Coordinate AI agents for small-business setup and recurring tasks",
  "description": "Vricko provides AI agents for planning, website creation, growth, sales and support for small businesses. Tasks include evidence of completion, nightly work queues and configurable spending and email caps. The service offers a limited trial, with company counts and monthly task credits depending on the plan. Users should review generated work and approve money-moving actions.",
  "category": "AI Agents",
  "logo": "#2563eb",
  "logoInitials": "V",
  "logoUrl": "/tool-logos/vricko.png",
  "rating": null,
  "pricing": "Trial: 3 days or 8 credits; Solo $49/month, Pro $149/month",
  "pricingType": "paid",
  "websiteUrl": "https://app.vricko.app/en",
  "affiliateUrl": "https://app.vricko.app/en",
  "featured": false,
  "pros": [
    "Specialized business agents",
    "Task evidence and spending caps",
    "Recurring night queues"
  ],
  "cons": [
    "Plan-based company and task limits",
    "Trial ends when time or credits run out",
    "Business outputs require user review"
  ],
  "alternatives": []
},
{
  "slug": "blueveta",
  "name": "BlueVeta",
  "tagline": "Turn a product photo into images, video and marketing copy",
  "description": "BlueVeta builds product-marketing packs from one product photo, including studio shots, lifestyle scenes, a short video and platform-ready copy. It targets brands and sellers preparing assets for multiple channels, with brand context and multilingual copy. Packs are purchased individually without a subscription. A public demo dashboard is available without signup. This is separate from the BlueVetaUpright image-orientation API.",
  "category": "Marketing",
  "logo": "#2563eb",
  "logoInitials": "B",
  "logoUrl": "/tool-logos/blueveta.png",
  "rating": null,
  "pricing": "Campaign packs from $9.99; no subscription; public demo available",
  "pricingType": "paid",
  "websiteUrl": "https://blueveta.com/",
  "affiliateUrl": "https://blueveta.com/",
  "featured": false,
  "pros": [
    "Images, video and copy in one pack",
    "Multiple platform formats",
    "No subscription required"
  ],
  "cons": [
    "Paid campaign generation",
    "Outputs need brand and product-accuracy review",
    "Separate from BlueVetaUpright API"
  ],
  "alternatives": []
},
{
  "slug": "blablascribe",
  "name": "BlaBlaScribe",
  "tagline": "Transcribe, subtitle, translate and dub audio and video",
  "description": "BlaBlaScribe converts uploaded recordings or supported media links into editable transcripts with speaker labels and timed subtitles. It supports transcription in over 120 languages, subtitle translation and paid dubbing in 27 languages. Export options and translation allowances depend on the plan. The free starter allowance is 30 minutes, with limits on long files; dubbing uses separately purchased minute packs.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "B",
  "logoUrl": "/tool-logos/blablascribe.png",
  "rating": null,
  "pricing": "30 starter minutes; Creator $14/month or $132/year; dubbing packs sold separately",
  "pricingType": "freemium",
  "websiteUrl": "https://blablascribe.ai/",
  "affiliateUrl": "https://blablascribe.ai/",
  "featured": false,
  "pros": [
    "Speaker labels and timed subtitles",
    "Multiple transcript export formats",
    "Translation and dubbing options"
  ],
  "cons": [
    "Free plan limits long-file transcription",
    "Translation allowances depend on plan",
    "Dubbing costs extra"
  ],
  "alternatives": []
},
{
  "slug": "bopreel",
  "name": "Bopreel",
  "tagline": "Make short meme videos from one or two photos",
  "description": "Bopreel generates 15-second MP4 meme videos from one or two photos using Hotel Lobby AI or What You Want Me To Do AI templates. The site estimates 10-15 minutes per generation and includes template audio. One-time video packs work across supported trends. It is independent of the original artists and shows; use permitted photos and check music rights before public sharing. Downloads remain available for 30 days.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "B",
  "logoUrl": "/tool-logos/bopreel.png",
  "rating": null,
  "pricing": "$6.99 for 1 video, $14.99 for 3, or $19.99 for 5; no subscription",
  "pricingType": "paid",
  "websiteUrl": "https://bopreel.com/",
  "affiliateUrl": "https://bopreel.com/",
  "featured": false,
  "pros": [
    "One or two photo inputs",
    "No subscription",
    "MP4 export with template audio"
  ],
  "cons": [
    "Two current templates",
    "Generation takes time",
    "Downloads expire after 30 days"
  ],
  "alternatives": []
},
{
  "slug": "horizon-web-group",
  "name": "Horizon Web Group",
  "tagline": "Build custom software, AI agents and business automation",
  "description": "Horizon Web Group is a custom development company led by founder Adebayo Emmanuel. It builds software and web applications, AI agents and chatbot integrations, business automation, internal dashboards, portals and API integrations. Engagements are scoped around each business rather than offered as a self-service software subscription. Contact the team to discuss requirements, delivery scope and pricing.",
  "category": "Business",
  "logo": "#2563eb",
  "logoInitials": "HW",
  "logoUrl": "/tool-logos/horizon-web-group.png",
  "rating": null,
  "pricing": "Custom project quote; contact the team",
  "pricingType": "paid",
  "websiteUrl": "https://horizonwebgroup.online/",
  "affiliateUrl": "https://horizonwebgroup.online/",
  "featured": true,
  "pros": [
    "Custom business applications",
    "AI agents and workflow integrations",
    "Dashboards and internal portals"
  ],
  "cons": [
    "Project scoping required",
    "No public fixed pricing",
    "Delivery depends on agreed requirements"
  ],
  "alternatives": [],
  "listingType": "service"
},
{
  "slug": "visual-maker-ai",
  "logoUrl": "/tool-logos/visual-maker-ai.png",
  "name": "Visual Maker AI",
  "tagline": "Create images, videos and script-based film projects in one workspace",
  "description": "Visual Maker AI combines text and reference-image generation, video creation and a film workspace for scripts, scenes and keyframes. Saved assets and references can be reused across projects. Available input modes, resolution and duration depend on the selected model. Paid subscriptions allocate credits monthly, while one-time packs provide non-expiring credits.",
  "category": "AI Image",
  "logo": "#7c3aed",
  "logoInitials": "VM",
  "pricing": "Paid subscriptions from $299/year ($24.92/month equivalent); one-time packs from $39.90 for 4,000 credits",
  "pricingType": "paid",
  "websiteUrl": "https://visualmakerai.com/",
  "pros": [
    "Image, video and film workflows together",
    "Reusable creative assets and references",
    "One-time credit packs without renewal"
  ],
  "cons": [
    "Subscription credits expire at the next allocation",
    "Generation costs vary by model and output settings",
    "Free signup allowance was not independently verified"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://visualmakerai.com/",
  "alternatives": []
},
{
  "slug": "destiny-book",
  "logoUrl": "/tool-logos/destiny-book.png",
  "name": "Destiny Book",
  "tagline": "Explore Chinese astrology charts and AI-written personal interpretations",
  "description": "Destiny Book combines calculated Four Pillars charts with AI-written interpretations of traditional Chinese astrology. It offers free birth-chart tools and optional paid topic reports, with separate products for personal traits, time cycles and relationship comparisons. Interfaces include Traditional and Simplified Chinese. Readings are cultural interpretation and personal reflection, not scientifically established predictions.",
  "category": "Lifestyle",
  "logo": "#b45309",
  "logoInitials": "DB",
  "pricing": "Free basic charts; optional one-time paid reports; prices depend on region and checkout currency",
  "pricingType": "freemium",
  "websiteUrl": "https://mymingshu.com/",
  "pros": [
    "Free basic chart tools",
    "Separate personal, timing and relationship reports",
    "Explains the role of chart calculations and AI text"
  ],
  "cons": [
    "Detailed reports require separate purchases",
    "Exact prices depend on region and checkout",
    "Birth-time uncertainty can affect interpretations"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://mymingshu.com/",
  "alternatives": []
},
{
  "slug": "ai-pop-video",
  "logoUrl": "/tool-logos/ai-pop-video.png",
  "name": "AI Pop Video",
  "tagline": "Turn photos into dance clips and creative video effects using templates",
  "description": "AI Pop Video creates short photo-based videos from dance and creative-effect templates. Users review the required photos, duration and credit cost before generating, then track and download results in their account. It also offers custom motion references and browser video utilities. Generation is credit-based; the weekly subscription renews automatically unless canceled, and additional credit packs require Pro membership.",
  "category": "AI Video",
  "logo": "#db2777",
  "logoInitials": "AP",
  "pricing": "Weekly Pro: $5.99 first week, then $9.99/week for 200 weekly credits; members-only top-ups from $5/100 credits",
  "pricingType": "paid",
  "websiteUrl": "https://aipopvideo.com/",
  "pros": [
    "Template previews show photo requirements and costs",
    "Custom motion-reference workflow",
    "Failed generations receive automatic credit refunds"
  ],
  "cons": [
    "Weekly plan renews automatically",
    "Credit requirements vary by duration and template",
    "Account creation does not guarantee a free video"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://aipopvideo.com/",
  "alternatives": []
},
{
  "slug": "fomrix",
  "logoUrl": "/tool-logos/fomrix.png",
  "name": "Fomrix",
  "tagline": "Generate 3D assets from images or text and inspect them with browser tools",
  "description": "Fomrix turns images and text prompts into downloadable GLB assets. Separate browser utilities view, inspect, convert and repair common 3D formats without consuming generation credits. New accounts receive limited welcome credits; paid packs and subscriptions add more capacity. Generation costs vary with input and settings. Users should inspect generated geometry, dimensions and printing requirements before downstream use.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "FO",
  "pricing": "Limited welcome credits: up to 90 in the first week; packs from $7.99/200 credits; monthly plans from $12.99",
  "pricingType": "freemium",
  "websiteUrl": "https://fomrix.com/",
  "pros": [
    "Image and text generation with GLB downloads",
    "Browser inspection and conversion utilities",
    "One-time packs and recurring plans available"
  ],
  "cons": [
    "Welcome credits expire seven days after receipt",
    "Generation settings change credit costs",
    "Generated meshes need review before printing or manufacturing"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://fomrix.com/",
  "alternatives": []
},
{
  "slug": "flippie-labs",
  "name": "Flippie Labs",
  "listingType": "service",
  "tagline": "Commission custom dashboards, AI reporting and business web applications",
  "description": "Flippie Labs is a B2B data and software studio offering custom dashboards, Power BI reporting, Excel automation, AI-written reporting commentary and KPI alerts. It also builds websites, interfaces and client portals around business data. Projects are scoped to a client’s requirements and quoted individually rather than sold as self-serve software. Optional ongoing support is available; the site also offers free browser utilities and business templates.",
  "category": "Business",
  "logo": "#0d9488",
  "logoInitials": "FL",
  "logoUrl": "/tool-logos/flippie-labs.png",
  "pricing": "Custom fixed project quotes; focused Power BI dashboards typically start around €300–€600; optional ongoing support quoted separately",
  "pricingType": "paid",
  "websiteUrl": "https://flippielabs.com/",
  "pros": [
    "Custom reporting and data integrations",
    "Dashboards, automation and web development in one engagement",
    "Fixed project quote before work begins"
  ],
  "cons": [
    "Service engagement rather than self-serve software",
    "Pricing and delivery depend on project scope",
    "Ongoing support and platform licensing may add costs"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://flippielabs.com/",
  "alternatives": []
},
{
  "slug": "novastart",
  "name": "Novastart",
  "tagline": "Organize apps, files and AI agents on a shared infinite canvas",
  "description": "Novastart provides an infinite-canvas workspace for arranging applications and files, saving separate workspaces and working alongside AI agents. Its Team plan adds shared canvases with independent participant cursors and keyboards. A limited free plan includes one folder, two canvases and four windows per canvas. Pro and Team remove canvas limits, while AI-agent usage is billed separately on every plan. Installation is required; advertised agent and collaboration capabilities have not been independently tested by AIBeat.",
  "category": "Productivity",
  "logo": "#6366f1",
  "logoInitials": "NS",
  "logoUrl": "/tool-logos/novastart.png",
  "pricing": "Free limited plan; Pro $10/month; Team $20/month; AI agents $0.02 per use with credit purchases from $25 on every plan",
  "pricingType": "freemium",
  "websiteUrl": "https://novastart.com/",
  "pros": [
    "Persistent canvases for apps and files",
    "AI agents alongside existing workflows",
    "Shared workspaces on the Team plan"
  ],
  "cons": [
    "AI-agent credits are separate from subscription pricing",
    "Free plan limits folders, canvases and windows",
    "Team collaboration requires the Team plan"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://novastart.com/",
  "alternatives": []
},
{
  "slug": "zombieai",
  "name": "ZombieAI",
  "tagline": "Explore zombie reunion story prompts and an early-stage video studio",
  "description": "ZombieAI provides public video examples, copyable storyboard prompts, and guides for fictional reunion stories using two reference photos. Prompts cover couples, friends, family, and pets for use with external AI video services. The site previews an in-site generator, but currently states that generation and payments are not open. Examples are supplied clips rather than results from uploaded photos.",
  "category": "AI Video",
  "logo": "#64748b",
  "logoInitials": "ZA",
  "pricing": "Free examples and prompts; in-site generation and paid packs are not yet available",
  "pricingType": "free",
  "websiteUrl": "https://zombieai.video/",
  "pros": [
    "Copyable story prompts",
    "Guides and public video examples",
    "Person and pet story concepts"
  ],
  "cons": [
    "In-site generation and payments are not open",
    "Creating videos requires an external service",
    "Model support and likeness vary"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://zombieai.video/",
  "alternatives": []
},
{
  "slug": "aicoursify",
  "name": "Aicoursify",
  "tagline": "Create editable course lessons, quizzes, assignments, and slides with AI",
  "description": "Aicoursify helps educators, coaches, and training teams turn topics into course outlines, written lessons, quizzes, assignments, and presentations. It also offers AI audio lessons and export workflows. A limited free course preview lets users explore generated material before purchasing. Paid plans provide different generation allowances; educators should review accuracy and teaching quality before publication.",
  "category": "Education",
  "logo": "#6366f1",
  "logoInitials": "AC",
  "pricing": "Limited free preview; Standard $49/month for 2 course generations; Pro $249/month for 100",
  "pricingType": "paid",
  "websiteUrl": "https://www.aicoursify.com/",
  "pros": [
    "Editable lessons and assessments",
    "Slides and AI audio workflows",
    "Course export options"
  ],
  "cons": [
    "Free access is a limited preview",
    "Course generation limits depend on plan",
    "Generated teaching material needs editorial review"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://www.aicoursify.com/",
  "alternatives": []
},
{
  "slug": "gender-swap-ai",
  "name": "Gender Swap AI",
  "tagline": "Explore feminine, masculine, and androgynous portrait or character variations",
  "description": "Gender Swap AI creates alternative looks from selfies, portraits, and character artwork. Users can upload a reference, select a target presentation, choose an optional art style, or supply a text prompt. The browser tool offers 10 free credits per week without signup for its low-quality generation option. Paid subscriptions and one-time credit packs unlock additional capacity and model settings.",
  "category": "AI Image",
  "logo": "#db2777",
  "logoInitials": "GS",
  "pricing": "10 free credits/week; subscriptions from $7/month billed annually; credit packs from $9",
  "pricingType": "freemium",
  "websiteUrl": "https://genderswapai.com/",
  "pros": [
    "Reference images and optional prompts",
    "Multiple presentation and art-style choices",
    "Weekly free credits without signup"
  ],
  "cons": [
    "Free generation uses limited quality settings",
    "Credit costs vary with quality",
    "Generated likeness and details can vary"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://genderswapai.com/",
  "alternatives": []
},
{
  "slug": "gemini-nano-banana",
  "name": "Gemini Nano Banana",
  "tagline": "Generate and edit images and videos in an independent multi-model workspace",
  "description": "Gemini Nano Banana is an independent browser workspace for text-to-image, reference-image editing, text-to-video, and image-to-video workflows. It offers a choice of models and controls for resolution, aspect ratio, and visual style. Generation uses credits, with subscriptions and credit packs available. This third-party service is not an official Google product; model capabilities and credit costs vary.",
  "category": "AI Image",
  "logo": "#f59e0b",
  "logoInitials": "GN",
  "pricing": "Paid credit-based plans and packs; Basic advertised from $6.99/month billed annually",
  "pricingType": "paid",
  "websiteUrl": "https://www.gemininanobanana.net/",
  "pros": [
    "Image creation and editing workflows",
    "Video generation from prompts or images",
    "Multiple models in one interface"
  ],
  "cons": [
    "Independent service, not an official Google product",
    "Credit use varies by model and settings",
    "Outputs require review before commercial use"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://www.gemininanobanana.net/",
  "alternatives": []
},
{
  "slug": "productshot-ai",
  "name": "ProductShot AI",
  "tagline": "Turn product uploads into ecommerce photos and campaign visuals",
  "description": "ProductShot AI creates white-background, studio, lifestyle, and marketplace images from uploaded product photos. Reference images and controls for scenes, lighting, and aspect ratios guide results. Product Lock aims to preserve key details, but generated labels and product accuracy still need review. Free credits support trials, with paid subscriptions and credit packs for more generation.",
  "category": "AI Image",
  "logo": "#0d9488",
  "logoInitials": "PS",
  "pricing": "Free trial credits and utilities; paid subscriptions and one-time credit packs available",
  "pricingType": "freemium",
  "websiteUrl": "https://productshotai.app/",
  "pros": [
    "Product uploads and optional visual references",
    "Studio, lifestyle, and marketplace image workflows",
    "Free background removal, compression, and enhancement tools"
  ],
  "cons": [
    "Generated product details need review",
    "Generation volume depends on credits",
    "Commercial use depends on plan and provider terms"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://productshotai.app/",
  "alternatives": []
},
{
  "slug": "tecadrise-bot",
  "name": "TecAdRise Bot",
  "tagline": "Run configurable AI agents in a local Windows desktop workspace",
  "description": "TecAdRise Bot is a free, MIT-licensed Windows multi-agent desktop workspace built on the Cursor SDK for indie builders, AI tool makers, and power users. Each agent has its own model, instructions, skills, and local workspace, with shared memory, MCP connections, and inter-agent messages through a localhost control plane. Scheduled routines run while the app is open. It is positioned as an independent Grok Bot alternative, not an official Grok or xAI product. Cursor API usage is billed separately; setup requires Windows 10/11, Node.js 22.13+, npm 10+, and a Cursor API key. Source code: https://github.com/tecadrise-ai/TecAdRiseBot",
  "category": "AI Agents",
  "logo": "#2563eb",
  "logoInitials": "TB",
  "pricing": "Free MIT-licensed software; Cursor API usage billed separately",
  "pricingType": "free",
  "websiteUrl": "https://tecadrise.ai/products/tecadrisebot",
  "pros": [
    "Configurable agents and local workspaces",
    "Shared memory and scheduled routines",
    "Open-source MIT license"
  ],
  "cons": [
    "Windows 10/11 required",
    "Technical setup and a Cursor API key required",
    "Model usage incurs separate API charges"
  ],
  "rating": null,
  "featured": true,
  "affiliateUrl": "https://tecadrise.ai/products/tecadrisebot",
  "alternatives": []
},
{
  "slug": "softsync-ai",
  "name": "SoftSync AI",
  "tagline": "Connect customer records, email, meeting notes, and AI-assisted sales workflows",
  "description": "SoftSync AI combines customizable CRM records, email campaigns, scheduling, reports, and meeting notes. Its AI Assistant, Autopilot workflows, API, and MCP access connect automation to customer data. A Mac and Windows desktop recorder captures meetings without a bot joining the call. Paid plans share core features, with different workspace and usage limits; review current trial terms at checkout.",
  "category": "Business",
  "logo": "#7c3aed",
  "logoInitials": "SA",
  "pricing": "Pro: $29/seat/month billed yearly or $39 monthly; trial terms shown at checkout",
  "pricingType": "paid",
  "websiteUrl": "https://softsync.ai/",
  "pros": [
    "Customer records and communication in one workspace",
    "Desktop meeting capture without a joining bot",
    "AI Assistant, Autopilot, API, and MCP access"
  ],
  "cons": [
    "Per-seat subscription pricing",
    "Usage and workspace limits vary by plan",
    "Meeting capture requires the desktop app"
  ],
  "rating": null,
  "featured": true,
  "affiliateUrl": "https://softsync.ai/",
  "alternatives": []
},
{
  "slug": "fiscus-ai",
  "name": "FISCUS AI",
  "tagline": "Manage Turkish SME finance workflows with human-reviewed AI suggestions",
  "description": "FISCUS AI combines pre-accounting, e-document preparation and status tracking, bank reconciliation, collections, and cash-flow visibility for Turkish SMEs. AI matching and classification suggestions require human review and do not themselves create official accounting records or tax filings. Live document transmission and bank synchronization depend on the plan, permissions, and provider readiness.",
  "category": "Business",
  "logo": "#0f766e",
  "logoInitials": "FA",
  "pricing": "14-day free trial · Launch pricing from ₺1,999/month; standard entry price ₺3,998/month",
  "pricingType": "paid",
  "websiteUrl": "https://fiscusai.org/",
  "pros": [
    "Shared invoice, collection, and bank workflows",
    "Human approval for AI suggestions",
    "Auditable transaction history"
  ],
  "cons": [
    "Focused on Turkish business workflows",
    "Bank connections and live document transmission are conditional",
    "Paid subscription after trial"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://fiscusai.org/",
  "alternatives": []
},
{
  "slug": "ai-fruit-video",
  "name": "AI Fruit Video",
  "tagline": "Turn story prompts and character references into talking-fruit video clips",
  "description": "AI Fruit Video creates short clips from story prompts, prepared fruit characters, and optional scene or character reference images. It includes story planning, image generation, and a browser-based MP4 merger. Available audio, resolution, and duration depend on the selected model. Signup includes 20 gift credits; subscriptions and one-time packs provide additional generation capacity.",
  "category": "AI Video",
  "logo": "#ea580c",
  "logoInitials": "FV",
  "pricing": "20 signup gift credits · Credit packs from $10/200 credits · Paid subscriptions available",
  "pricingType": "freemium",
  "websiteUrl": "https://aifruitvideo.com/",
  "pros": [
    "Prepared characters and scene references",
    "Story planning and clip generation",
    "Local browser MP4 merging"
  ],
  "cons": [
    "Character consistency can vary between clips",
    "Free visitor generations depend on availability and are watermarked",
    "Credit usage varies by model and settings"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://aifruitvideo.com/",
  "alternatives": []
},
{
  "slug": "arvow",
  "name": "Arvow",
  "tagline": "Research, write, and publish SEO content with AI-assisted site workflows",
  "description": "Arvow provides AI article writing, content editing, scheduled publishing, and technical SEO workflows for marketers and agencies. It also offers backlink exchange, AI-search visibility tracking, and Google Business Profile automation on eligible plans. Content and site changes need editorial oversight; search rankings and AI citations are not guaranteed. Subscription tiers vary by credits, websites, and included features.",
  "category": "Marketing",
  "logo": "#4f46e5",
  "logoInitials": "AR",
  "pricing": "Paid Solo, Business, and Ultimate subscriptions · Check current billing terms and promotional rates",
  "pricingType": "paid",
  "websiteUrl": "https://arvow.com/",
  "pros": [
    "Content research, writing, and publishing workflows",
    "Technical SEO and internal-linking tools",
    "Agency reporting and visibility features on eligible plans"
  ],
  "cons": [
    "Features and usage depend on subscription tier",
    "Generated content and automatic changes require review",
    "No guaranteed rankings or AI-search citations"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://arvow.com/",
  "alternatives": []
},
{
  "slug": "photogenerai",
  "name": "PhotoGenerAI",
  "tagline": "Generate and edit images using text prompts and reference photos",
  "description": "PhotoGenerAI is a browser-based image generator and editor for product scenes, portraits, illustrations, and visual concepts. Users can start from text or supply photos and reference images. It offers 10 free credits per week for its GPT Image 2 Low setting without requiring signup; advanced settings use purchased credits. Generated images are kept for 30 days, so users should download results they want to retain.",
  "category": "AI Image",
  "logo": "#7c3aed",
  "logoInitials": "PG",
  "pricing": "10 free credits per week for GPT Image 2 Low · Advanced settings use purchased credits",
  "pricingType": "freemium",
  "websiteUrl": "https://photogenerai.com/",
  "pros": [
    "Text generation and reference-guided photo edits",
    "Free allowance without account creation",
    "Multiple reference images supported"
  ],
  "cons": [
    "Free credits do not roll over",
    "Edits may change details that should remain unchanged",
    "Generated image history expires after 30 days"
  ],
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://photogenerai.com/",
  "alternatives": []
},
{
  "slug": "shopchief",
  "name": "ShopChief",
  "tagline": "Coordinate ecommerce research, store content, SEO, and marketing with AI agents",
  "description": "ShopChief is an AI workspace for ecommerce teams that combines product research, listing copy, visual assets, store improvements, SEO, and marketing tasks. Users connect supported services, provide product context, and review results and execution records. Actions depend on connector permissions. New workspaces receive 1,500 signup credits; paid subscriptions add shared team credits and unlimited members.",
  "category": "AI Agents",
  "logo": "#0f766e",
  "logoInitials": "SC",
  "rating": null,
  "pricing": "1,500 free signup credits · Paid plans from $19/month",
  "pricingType": "freemium",
  "websiteUrl": "https://shopchief.ai/",
  "affiliateUrl": "https://shopchief.ai/",
  "featured": false,
  "pros": [
    "Reusable product and store context",
    "Supported commerce and marketing connectors",
    "Scheduled tasks and execution records"
  ],
  "cons": [
    "External actions require connector authorization",
    "Usage is limited by credits",
    "Generated content and recommendations need human review"
  ],
  "alternatives": []
},
  {
    "slug": "openfate",
    "name": "OpenFate",
    "tagline": "Explore astrology charts and AI-assisted symbolic interpretations",
    "description": "OpenFate combines chart calculators with AI-assisted interpretations across Bazi, Western and Vedic astrology, Ziwei, Human Design, and Sukuyo. It also offers compatibility tools, oracles, and saved follow-up guidance. Free chart tools are available alongside credit-based features. The interpretations are for entertainment and personal reflection, rather than scientifically established predictions.",
    "category": "Lifestyle",
    "logo": "#7c3aed",
    "logoInitials": "OF",
    "rating": null,
    "pricing": "Free chart tools · Credit-based features; check the site for current paid options",
    "pricingType": "freemium",
    "websiteUrl": "https://openfate.ai/en",
    "affiliateUrl": "https://openfate.ai/en",
    "featured": true,
    "pros": [
      "Multiple chart and compatibility systems",
      "AI explanations alongside calculated charts",
      "Free chart tools"
    ],
    "cons": [
      "Interpretations are not scientifically validated predictions",
      "Some features use credits",
      "Personalized charts require birth details"
    ],
    "alternatives": []
  },
  {
    "slug": "pregnancy-ai",
    "name": "Pregnancy AI",
    "tagline": "Create AI maternity portraits from prompts or uploaded photos",
    "description": "Pregnancy AI generates maternity-style images from text prompts or edits uploaded photos into themed portraits. It offers studio, outdoor, fashion, and seasonal styles, plus image-to-video features. Free daily check-in credits and paid credit plans are available. Its baby-face images are creative visualizations, not predictions of a real child or medical assessments.",
    "category": "AI Image",
    "logo": "#db2777",
    "logoInitials": "PA",
    "rating": null,
    "pricing": "Free daily check-in credits · Paid subscriptions and one-time credit options",
    "pricingType": "freemium",
    "websiteUrl": "https://pregnancyai.ai/",
    "affiliateUrl": "https://pregnancyai.ai/",
    "featured": true,
    "pros": [
      "Prompt-based generation and photo editing",
      "Multiple maternity portrait styles",
      "Image and video generation options"
    ],
    "cons": [
      "Generation uses credits",
      "Generated likenesses and anatomy may need correction",
      "Uploaded photos are processed by the service"
    ],
    "alternatives": []
  },
  {
    slug: 'manhwa-translator', name: 'MangaTranslate',
    tagline: 'Translate manga images with OCR, typesetting, and editable dialogue',
    description: 'MangaTranslate is a browser-based manga image translator with OCR, automatic text replacement, and an editor for correcting dialogue and layout. Users select source and target languages, upload pages, and download translated images. It supports batch uploads and offers an API. The Russian and Arabic AI manga translator pages are localized entry points to the same product. Limited daily free credits are available, with paid subscriptions and pay-per-use options for additional capacity.',
    category: 'Productivity', logo: '#2563eb', logoInitials: 'MT', rating: null,
    pricing: 'Limited daily free credits · Paid subscriptions and pay-per-use credits', pricingType: 'freemium',
    websiteUrl: 'https://www.mangatranslate.com/', affiliateUrl: 'https://www.mangatranslate.com/', featured: true,
    pros: ['OCR and automatic text replacement in manga images', 'Editor for dialogue, fonts, and layout corrections', 'Batch uploads and API access'],
    cons: ['Free usage is limited by credits', 'Credit usage varies by translation model', 'Translations and page layout require human review'],
    alternatives: [],
  },
  {
    slug: 'nextlerai', name: 'NextlerAI',
    tagline: 'Add AI publishing, translation, and customer support to WordPress',
    description: 'NextlerAI offers separate WordPress plugins for content publishing, website translation, and customer support. Publisher researches and schedules articles with approval controls. Translator works with supported multilingual plugins, while Assistant connects WordPress knowledge and WooCommerce products to customer conversations. Users connect their own supported AI providers. Licences vary by product, site count, and duration; AI provider costs are separate.',
    category: 'Productivity', logo: '#2563eb', logoInitials: 'N', rating: null,
    pricing: 'Paid plugin licences · Annual and lifetime options · Bring your own AI provider', pricingType: 'paid',
    websiteUrl: 'https://nextlerai.com/', affiliateUrl: 'https://nextlerai.com/', featured: true,
    pros: ['Separate plugins for publishing, translation, and support', 'WordPress and WooCommerce workflows', 'Approval controls for customer-facing changes'],
    cons: ['Requires WordPress and compatible integrations', 'AI provider usage is separate from the plugin licence', 'Automated content and translations need review'],
    alternatives: ['jasper', 'copy-ai'],
  },
  {
    slug: 'magic-hour', name: 'Magic Hour',
    tagline: 'Generate and edit AI video, images, and audio for creative projects',
    description: 'Magic Hour combines AI media generation and editing in a web app, with API access for automated workflows. Its tools include text-to-video, image-to-video, lip sync, image editing, and audio generation. Free access provides limited experimentation, while paid subscriptions and credit packs increase capacity. Export resolution, queues, and tool usage vary by plan. Commercial use requires a paid plan under the published pricing terms.',
    category: 'AI Video', logo: '#7c3aed', logoInitials: 'MH', rating: null,
    pricing: 'Free access · Paid plans and credit packs · Commercial use on paid plans', pricingType: 'freemium',
    websiteUrl: 'https://magichour.ai/', affiliateUrl: 'https://magichour.ai/', featured: true,
    pros: ['Video, image, and audio tools in one workspace', 'Web interface and API access', 'Free access for trying basic features'],
    cons: ['Generation consumes credits', 'Free video and audio may include watermarks', 'Commercial rights and export limits depend on the plan'],
    alternatives: ['runway', 'pictory', 'solice'],
  },
  {
    slug: 'hairforge', name: 'hairforge',
    tagline: 'Compare beard styles and preview grooming ideas on your own photo',
    description: 'hairforge combines beard-style guides, face-shape suggestions, and optional AI photo previews. Users can browse styles and use the advertised free face analysis to narrow their choices, then spend credits to generate a personal preview. The previews help compare appearance and proportions; they do not predict hair growth. Photo processing and retention follow the service privacy policy.',
    category: 'AI Image', logo: '#b45309', logoInitials: 'HF', rating: null,
    pricing: 'Free guides and face analysis · Paid credits for AI previews', pricingType: 'freemium',
    websiteUrl: 'https://beardstyles.co/', affiliateUrl: 'https://beardstyles.co/', featured: true,
    pros: ['Style guides organized around face shape and maintenance', 'Optional personal photo previews', 'Preview credit cost shown before confirmation'],
    cons: ['Personal AI previews require paid credits', 'Generated images do not predict actual beard growth', 'Photo uploads involve the service processing and retention policies'],
    alternatives: [],
  },
  {
    slug: 'coanimator', name: 'CoAnimator',
    tagline: 'Build editable animations and product videos with your own AI agent',
    description: 'CoAnimator is a desktop animation studio that connects to supported AI agents to create scenes, timelines, narration, and effects. It supports product demos, tutorials, and editing recorded footage, with editable project files and local rendering on Windows, macOS, and Linux. The free plan exports watermarked 720p videos. A paid licence adds up to 4K and watermark-free exports; third-party AI services use your own accounts and keys.',
    category: 'AI Video', logo: '#4f46e5', logoInitials: 'CA', rating: null,
    pricing: 'Free watermarked 720p · Paid lifetime licence · Optional paid update renewals', pricingType: 'freemium',
    websiteUrl: 'https://coanimator.com/', affiliateUrl: 'https://coanimator.com/', featured: true,
    pros: ['Editable project files and local rendering', 'Connects to supported agents including Claude Code and Codex', 'Unmetered local exports with templates and plugins'],
    cons: ['Requires a desktop setup and your own AI agent', 'Free exports are watermarked and limited to 720p', 'AI services and later update renewals can cost extra'],
    alternatives: ['solice', 'pictory', 'runway'],
  },
  {
    slug: 'astrea', name: 'Astrea',
    tagline: 'Turn product ideas and reference images into AI advertising videos',
    description: 'Astrea helps creators and marketing teams generate product advertising videos from ideas and reference images. Users guide the creative direction with prompts and existing assets, then generate and download clips for campaigns. Its paid plans support 720p and 1080p generation through monthly subscriptions or one-time credit packs. Free access is advertised, but the public pricing page does not specify a free credit allowance.',
    category: 'AI Video', logo: '#b4000b', logoInitials: 'A', logoUrl: '/tool-logos/astrea.png', rating: null,
    pricing: 'Free access advertised · Plans from $19.90/mo · Credit packs from $9.90', pricingType: 'freemium',
    websiteUrl: 'https://astrea.studio/', affiliateUrl: 'https://astrea.studio/', featured: true,
    pros: ['Prompt and reference-image inputs', '720p and 1080p generation on paid plans', 'Subscription and one-time credit options'],
    cons: ['Generation consumes credits', 'Public pricing does not specify the free allowance', 'Generated ads need review for product accuracy'],
    alternatives: ['solice', 'pictory', 'runway'],
  },
  {
    slug: 'sistava', name: 'Sistava',
    tagline: 'Delegate defined business workflows to AI employees in a shared workspace',
    description: 'Sistava is an AI workforce platform for founders and teams. Users choose an available AI employee or define a role, supply business context, connect supported tools, and delegate work across sales, marketing, support, research, and operations. Teams retain responsibility for permissions, review, and consequential decisions. A free tier is advertised, with paid plans starting at $25 per month; credits and employee capacity vary by plan.',
    category: 'AI Agents', logo: '#4966ef', logoInitials: 'S', logoUrl: '/tool-logos/sistava-icon.png', rating: null,
    pricing: 'Free tier · Paid plans from $25/mo · Credit limits apply', pricingType: 'freemium',
    websiteUrl: 'https://sistava.com/', affiliateUrl: 'https://sistava.com/', featured: true,
    pros: ['Available employee roles and custom workflows', 'Shared context for business tasks', 'Supported app connections and plan-based employee capacity'],
    cons: ['Tasks consume credits based on model and complexity', 'Integration availability and controls vary', 'Work requires human oversight and appropriate tool permissions'],
    alternatives: ['mrrlin', 'orkas', 'lindy'],
  },
  {
    slug: 'mrrlin', name: 'Mrrlin',
    tagline: 'Coordinate AI agents from a business goal to reviewed deliverables',
    description: 'Mrrlin is an AI execution workspace for founders and small teams. It organizes goals into tasks, coordinates agents, preserves project context, and uses review and retry steps before handing work back to people. Its workspace includes progress tracking and human approvals for sensitive actions such as sending and publishing. Access and pricing should be confirmed with the team; connected model subscriptions may be required.',
    category: 'AI Agents', logo: '#7c3aed', logoInitials: 'M', rating: null,
    pricing: 'Contact for pricing · Connected model subscriptions may be required', pricingType: 'paid',
    websiteUrl: 'https://mrrlin.com/', affiliateUrl: 'https://mrrlin.com/', featured: true,
    pros: ['Shared task progress and project context', 'Multi-agent coordination with review and retries', 'Human approval checkpoints for sensitive actions'],
    cons: ['Public site does not specify a standard subscription price', 'Requires configuring the agents and tools used for execution', 'Generated deliverables still need review'],
    alternatives: ['pragor', 'orkas', 'n8n'],
  },
  {
    slug: 'modelrush', name: 'ModelRush',
    tagline: 'Access hosted text, image, video, and voice models through APIs',
    description: 'ModelRush provides hosted AI APIs and a browser playground for developers and product teams. Chat uses an OpenAI-compatible interface, while image, video, and voice capabilities have documented endpoints. The platform exposes model pricing, regional availability, and request tracking. The team describes paid, usage-based prepaid credits; confirm current billing in the dashboard because the public site also describes an evaluation phase. Some catalog models are age-restricted.',
    category: 'Developer Tools', logo: '#2563eb', logoInitials: 'MR', rating: null,
    pricing: 'Paid usage-based credits · Confirm current billing and model rates', pricingType: 'paid',
    websiteUrl: 'https://modelrush.ai/', affiliateUrl: 'https://modelrush.ai/', featured: true,
    pros: ['Text, image, video, and audio model access', 'OpenAI-compatible chat interface', 'Model-level pricing, regional routing, and request tracking'],
    cons: ['Generation costs and availability vary by model and region', 'Public evaluation language differs from submitted billing details', 'Some models are age-restricted'],
    alternatives: ['openai-api', 'hugging-face'],
  },
  {
    slug: 'removebgtools', name: 'RemoveBGTools',
    tagline: 'Preview a background-editing toolkit with AI removal still in development',
    description: 'RemoveBGTools is a preview-stage background-editing website for product photos, profiles, and social visuals. Its current version offers image upload and preview flows. The official FAQ says the AI background-removal engine is planned for a future release, so automated cutouts and finished background removal are not currently confirmed features. The planned toolkit covers transparent images, white backgrounds, background changes, and blur effects.',
    category: 'AI Image', logo: '#0d9488', logoInitials: 'BG', rating: null,
    pricing: 'Free preview · AI background removal not yet available', pricingType: 'free',
    websiteUrl: 'https://www.removebgtools.online/', affiliateUrl: 'https://www.removebgtools.online/', featured: true,
    pros: ['Focused upload and image-preview workflow', 'Mobile-friendly preview interface', 'Planned tools cover product, profile, and social images'],
    cons: ['Preview stage: AI background-removal engine is not yet available', 'Completed automatic cutouts are not a confirmed current capability', 'Future processing availability and pricing are unannounced'],
    alternatives: ['sharpniq', 'blur-background'],
  },
  {
    slug: 'reelfluent', name: 'ReelFluent',
    tagline: 'Practice English with short dramas, bilingual stories, and AI tutoring',
    description: 'ReelFluent turns short dramas, stories, video links, and ebooks into English learning activities. Learners can use bilingual subtitles, tap-to-translate, phrase saving, and shadowing practice. The free tier includes early content; VIP unlocks the full library, AI Tutor, and Smart Review.',
    category: 'Education', logo: '#f97316', logoInitials: 'RF', rating: null,
    pricing: 'Free starter content · VIP for full library and premium tools', pricingType: 'freemium',
    websiteUrl: 'https://www.reelfluent.app/', affiliateUrl: 'https://www.reelfluent.app/', featured: true,
    pros: ['Combines listening, reading, and speaking practice', 'Bilingual subtitles and contextual translation', 'Short lessons and saved phrases for later review'],
    cons: ['Currently focuses on English learning', 'Full library, AI Tutor, and Smart Review require VIP'],
    alternatives: [],
  },
  {
    slug: 'aicoolies', name: 'aicoolies',
    tagline: 'Explore an AI developer-tool catalog with comparisons and reusable data',
    description: 'aicoolies is a developer-tool discovery catalog with reviews, comparisons, curated stacks, and evidence labels. Its public dataset, API, and MCP server help developers and agents explore the catalog. It is a resource for choosing tools, rather than a coding agent.',
    category: 'Developer Tools', logo: '#0f766e', logoInitials: 'AC', rating: null,
    pricing: 'Free public catalog and API', pricingType: 'free',
    websiteUrl: 'https://aicoolies.com/', affiliateUrl: 'https://aicoolies.com/', featured: true,
    pros: ['Comparisons and curated developer stacks', 'Public API and MCP access without a token', 'Review evidence labels and source-check dates'],
    cons: ['Review evidence varies by entry', 'Catalog scores are the publisher’s assessments'],
    alternatives: [],
  },
  {
    slug: 'nursevi', name: 'Nursevi',
    tagline: 'Organize nursing case materials into editable care-plan drafts',
    description: 'Nursevi helps nursing students and nurses connect case cues, priorities, goals, interventions, rationales, sources, and evaluation in an editable workspace. It supports reviewing gaps and revisions before export. Generated plans require verification against case context, approved references, and local requirements; they do not replace professional judgment.',
    category: 'Education', logo: '#0891b2', logoInitials: 'N', rating: null,
    pricing: 'Subscription pricing varies · Free checklist available', pricingType: 'paid',
    websiteUrl: 'https://nursevi.soliceapp.ai/', affiliateUrl: 'https://nursevi.soliceapp.ai/', featured: true,
    pros: ['Links plan elements with supporting evidence', 'Supports assignment and local-workflow review', 'Free checklist requires no patient information'],
    cons: ['AI proposals require professional or instructor review', 'iPhone app listed as awaiting App Review; web workspace available', 'No bundled proprietary nursing-reference catalogs'],
    alternatives: [],
  },
  {
    slug: 'pragor', name: 'Pragor',
    tagline: 'Coordinate AI agents and people on a shared operations board',
    description: 'Pragor brings agent tasks, messages, approvals, memory, and audit records into one shared board. Teams can connect agents built with different frameworks through REST or MCP, track handoffs, and require human approval for selected actions. The public beta is advertised as free.',
    category: 'AI Agents', logo: '#4338ca', logoInitials: 'P', rating: null,
    pricing: 'Free during public beta', pricingType: 'free',
    websiteUrl: 'https://pragor.net/', affiliateUrl: 'https://pragor.net/', featured: true,
    pros: ['REST and MCP connections for existing agents', 'Shared tasks, memory, and audit trail', 'Human approval controls'],
    cons: ['Requires configuring and connecting agents', 'Free access is tied to the beta period'],
    alternatives: ['n8n', 'langchain'],
  },
  {
    slug: 'saycraft', name: 'SayCraft',
    tagline: 'Turn product conversations into live web-app prototypes',
    description: 'SayCraft builds a web-app preview while a person or team discusses a product idea. Its workspace combines transcription, reasoning, code, and preview, with meeting replay and follow-up refinement. Free includes live preview and replay; permanent deployment access requires Pro, and source download requires Max.',
    category: 'AI Coding', logo: '#db2777', logoInitials: 'SC', rating: null,
    pricing: 'Free live preview and replay · Pro deployment · Max source download', pricingType: 'freemium',
    websiteUrl: 'https://saycraft.ai/', affiliateUrl: 'https://saycraft.ai/', featured: true,
    pros: ['Live prototype feedback during discussion', 'Supports solo meetings and uploaded recordings', 'Meeting replay preserves the build context'],
    cons: ['Permanent deploy links require Pro', 'Source downloads require Max', 'Generated apps need testing before production use'],
    alternatives: ['replit', 'v0', 'cursor'],
  },
  {
    slug: 'solice', name: 'Solice',
    tagline: 'Create reviewable videos from websites, scripts, and source materials',
    description: 'Solice is a video-creation app for turning websites, scripts, source materials, and voice into product introductions, explainers, tutorials, and channel videos. It offers reusable styles, scene planning, and scene-by-scene refinement. Its public pricing page currently labels plan checkout as coming soon.',
    category: 'AI Video', logo: '#ea580c', logoInitials: 'S', rating: null,
    pricing: 'Paid plans announced · Checkout coming soon', pricingType: 'paid',
    websiteUrl: 'https://soliceapp.ai/', affiliateUrl: 'https://soliceapp.ai/', featured: true,
    pros: ['Website and script inputs', 'Reusable visual templates and personal styles', 'Scene review before export'],
    cons: ['Plan checkout currently marked coming soon', 'Mac download requires macOS 14 or later', 'Generation is governed by plan credit limits'],
    alternatives: ['pictory', 'descript', 'synthesia'],
  },
  {
    slug: 'orkas', name: 'Orkas',
    tagline: 'Direct a desktop team of specialist AI agents through chat',
    description: 'Orkas uses a Commander agent to plan work and coordinate specialists for research, writing, slides, images, video, and app building. Its open-source desktop client supports local workflows with your own provider keys, while the official release offers optional managed models and hosted services.',
    category: 'AI Agents', logo: '#2563eb', logoInitials: 'O', rating: null,
    pricing: 'Free desktop client · Provider usage or managed-model plans extra', pricingType: 'freemium',
    websiteUrl: 'https://orkas.ai/', affiliateUrl: 'https://orkas.ai/', featured: true,
    pros: ['Coordinates multiple specialist agents from one chat', 'Open-source desktop client', 'Supports bringing your own model provider'],
    cons: ['Model usage can incur provider or managed-service costs', 'Requires desktop installation', 'Generated work still needs review'],
    alternatives: ['pragor', 'lindy', 'n8n'],
  },
  {
    slug: 'sharpniq', name: 'Sharpniq',
    tagline: 'Sharpen photos locally in your browser or with optional cloud processing',
    description: 'Sharpniq offers image unblurring with a free browser mode that processes images on the device without sign-in. Optional Cloud Unblur uploads an image for server-side processing and uses credits. Users can compare results and download a PNG; quality depends on the source image and blur.',
    category: 'AI Image', logo: '#7c3aed', logoInitials: 'SH', rating: null,
    pricing: 'Free browser processing · Cloud Unblur uses credits', pricingType: 'freemium',
    websiteUrl: 'https://unblurimage.me/', affiliateUrl: 'https://unblurimage.me/', featured: true,
    pros: ['Free local processing without sign-in', 'Before-and-after comparison and PNG export', 'Optional cloud mode for larger images'],
    cons: ['Browser mode limited to 4MP; cloud mode to 12MP', 'Cloud processing requires sign-in and credits', 'Results vary with blur and source quality'],
    alternatives: ['leonardo-ai', 'blur-background'],
  },
  {
    slug: 'screenpipe', name: 'Screenpipe',
    tagline: 'Search local screen and audio history and share context with AI tools',
    description: 'Screenpipe captures screen context and audio on your computer so you can search past work, recall conversations, and give approved AI tools relevant context. Its local API and MCP server support integrations with assistants and workflows. Raw history stays local by default; cloud-connected features depend on configuration. A free plan provides limited history on one device, with paid plans for fuller history, sync, and team workflows.',
    category: 'Productivity', logo: '#334155', logoInitials: 'SP', rating: null,
    pricing: 'Free limited plan · Paid personal and team plans', pricingType: 'freemium',
    websiteUrl: 'https://screenpipe.com/', affiliateUrl: 'https://screenpipe.com/', featured: false,
    pros: ['Searchable screen and audio history', 'Local API and MCP integration', 'Controls for excluding sensitive apps and windows'],
    cons: ['Recording requires careful privacy and permission settings', 'Capture uses local storage and system resources', 'History and sync capabilities vary by plan'],
    alternatives: ['notion', 'chatgpt'],
  },
  {
    slug: 'cuta', name: 'Cuta',
    tagline: 'Create images, videos, characters and audio in one AI workspace',
    description: 'Cuta brings image generation, video creation, character workflows, and audio tools into a shared creative workspace. Creators and marketing teams can develop storyboards, guide shots with text, and generate assets using supported models. Its pricing page specifies one-time registration credits for free access and paid plans with monthly credit allowances. Model choice, duration, resolution, and other settings affect usage costs.',
    category: 'AI Video', logo: '#7c3aed', logoInitials: 'Cu', rating: null,
    pricing: 'Free registration credits · Paid credit-based plans', pricingType: 'freemium',
    websiteUrl: 'https://cuta.app/', affiliateUrl: 'https://cuta.app/', featured: false,
    pros: ['Image, video and audio creation in one workspace', 'Character and storyboard workflows', 'Credit estimates before generation'],
    cons: ['Generations consume model-dependent credits', 'Free pricing allowance is one-time, not recurring', 'Generated assets need quality and rights review'],
    alternatives: ['runway', 'magic-hour', 'pictory'],
  },
  {
    slug: 'ai-tattoo-generator', name: 'AI Tattoo Generator',
    tagline: 'Explore tattoo concepts with style, placement and ink choices',
    description: 'AI Tattoo Generator turns a written idea into a downloadable tattoo concept. Users choose a style, body placement, and ink preference, then generate a reference to discuss with a tattoo artist. Free accounts can create up to three designs per day while shared daily capacity remains. Designs are starting points for professional refinement, not finished tattoo stencils or predictions of healed results.',
    category: 'AI Image', logo: '#b45309', logoInitials: 'AT', rating: null,
    pricing: 'Free account · Up to 3 designs daily, subject to shared capacity', pricingType: 'free',
    websiteUrl: 'https://aitattoogenerator.com/', affiliateUrl: 'https://aitattoogenerator.com/', featured: false,
    pros: ['Style, placement and ink controls', 'Downloadable visual references', 'Free daily generation allowance'],
    cons: ['Sign-in required for generation', 'Shared daily capacity can limit availability', 'A tattoo artist must refine the concept for actual use'],
    alternatives: ['leonardo-ai', 'midjourney'],
  },
  {
    "slug": "currawong-web",
    "name": "Currawong Web",
    "tagline": "Check Chinese suppliers with sourced and dated company records",
    "description": "Currawong Web helps importers and ecommerce buyers research Chinese suppliers before placing orders or making payments. Users search by company name, shop link, or company code, compare candidate matches with a business licence, and select a paid report. Reports summarize returned company records, source dates, gaps, and follow-up questions. Automated checks use a licensed business-information platform; additional human verification is available by arrangement. A search match alone does not confirm supplier identity or reliability.",
    "category": "Business",
    "logo": "#166534",
    "logoInitials": "CW",
    "logoUrl": "https://currawongweb.com/assets/currawong-logo.png",
    "rating": null,
    "pricing": "Free supplier search · Reports from US$26.55 · Optional checks from US$4.90",
    "pricingType": "freemium",
    "websiteUrl": "https://currawongweb.com/",
    "affiliateUrl": "https://currawongweb.com/",
    "featured": false,
    "pros": [
      "Free search by company name, shop link, or company code",
      "Reports include sources, dates, and gaps",
      "Optional human verification"
    ],
    "cons": [
      "Detailed reports and additional checks cost extra",
      "Record availability and source delays affect results",
      "Search matches do not guarantee supplier reliability"
    ],
    "alternatives": []
  },
]
