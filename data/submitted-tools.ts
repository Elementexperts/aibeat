import type { Tool } from '@/lib/data'

// Editorial additions reviewed against submissions and official sites.
// See docs/submission-review-2026-09-07.md and docs/submission-review-2026-09-09.md.
// No hands-on score has been assigned.
export const SUBMITTED_TOOLS: Tool[] = [
{
  "slug": "ai-object-remover",
  "name": "AI Object Remover",
  "tagline": "Brush away unwanted objects, people and text from photos",
  "description": "AI Object Remover is a browser-based photo cleanup tool for removing selected distractions from still images. Upload a JPG, PNG or WebP, brush over the area to edit, and download a PNG at the working-image dimensions. Guests can make two edits per network IP every 24 hours; signed-in users can use credits after that allowance. Images above 4 MP are resized, and complex backgrounds or large subjects may need further editing. Use images you own or have permission to edit.",
  "category": "Image",
  "pricing": "Two free edits per network IP every 24 hours; sign in to use credits after the allowance",
  "pricingType": "freemium",
  "websiteUrl": "https://aiobjectremover.art/",
  "pros": [
    "Guest editing without signup",
    "Brush-based selection and PNG downloads",
    "Supports JPG, PNG and WebP"
  ],
  "cons": [
    "Working images limited to 4 MP",
    "No video or full-background removal",
    "Selected edit areas are processed by an external service"
  ],
  "logo": "#6366f1",
  "logoInitials": "AO",
  "logoUrl": "/tool-logos/ai-object-remover.png",
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://aiobjectremover.art/",
  "alternatives": []
},
{
  "slug": "edform",
  "name": "Edform",
  "tagline": "Create quizzes, interactive worksheets and AI teaching materials",
  "description": "Edform combines quizzes, interactive worksheets, lessons and classroom games with AI tools for teachers. Teachers can turn PDFs into activities, assign homework, run live sessions and review automatically graded answers. Classroom utilities include timers and name pickers, while AI tools help draft lesson plans, quizzes and rubrics. Basic includes the teaching features and 15 one-time AI points. Pro adds a monthly AI allowance, with school plans available for teams. Teachers should review generated materials and grading before relying on them.",
  "category": "Education",
  "pricing": "Free Basic with 15 one-time AI points; Pro $3 per teacher/month with 300 AI points/month; school plans from five seats",
  "pricingType": "freemium",
  "websiteUrl": "https://edform.com/?utm_source=aibeat&utm_medium=directory&utm_campaign=listing",
  "pros": [
    "Quizzes, worksheets and live games in one platform",
    "Automatic grading and student reports",
    "Free classroom tools with optional paid AI allowance"
  ],
  "cons": [
    "Free AI points do not replenish",
    "Unused Pro AI points do not roll over",
    "AI-generated content needs teacher review"
  ],
  "logo": "#6366f1",
  "logoInitials": "E",
  "logoUrl": "/tool-logos/edform.png",
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://edform.com/?utm_source=aibeat&utm_medium=directory&utm_campaign=listing",
  "alternatives": []
},
{
  "slug": "christmas-pajama-dance",
  "name": "Christmas Pajama Dance",
  "tagline": "Create solo or duet holiday dance videos from portraits",
  "description": "Christmas Pajama Dance turns one portrait into a solo holiday clip or two separate portraits into a duet. Its browser studio provides photo-layout previews, video settings and optional matching pajamas, alongside free guides to the dance and photo-framing workflow. Rendering uses purchased credits and sends the photos to a video service. The studio requests original instrumental audio rather than automatically supplying the TikTok trend song. Use photos of consenting adults and check facial consistency and movement before sharing.",
  "category": "AI Video",
  "pricing": "Free guides and photo-layout previews; video rendering requires purchased credits, with the default 15-second 480p clip quoted at 20 credits",
  "pricingType": "paid",
  "websiteUrl": "https://christmasdanceai.video/",
  "pros": [
    "Solo and two-portrait duet modes",
    "Photo-layout previews before rendering",
    "Resolution and aspect-ratio options"
  ],
  "cons": [
    "Video rendering is not free",
    "Trend-song licensing is separate",
    "Delivery links expire; download finished clips promptly"
  ],
  "logo": "#6366f1",
  "logoInitials": "CP",
  "logoUrl": "/tool-logos/christmas-pajama-dance.png",
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://christmasdanceai.video/",
  "alternatives": []
},
{
  "slug": "audjust-ai-song-cover-generator",
  "name": "Audjust AI Song Cover Generator",
  "tagline": "Restyle authorized recordings with a new genre and arrangement",
  "description": "Audjust AI Song Cover Generator creates a new style version from uploaded audio and a description of the desired genre, instruments and mood. It aims to follow the source melodic direction while rebuilding the arrangement, rather than automatically cloning a named singer. The workflow accepts common audio formats up to eight minutes and 50 MB, with sign-in and credits required for generation. It sits within the wider Audjust audio workspace. Users must own or have permission to transform the source recording; output and retained melody can vary.",
  "category": "Audio",
  "pricing": "30 credits per cover generation; credit packs from $19.99 for 200 credits, with subscription options available",
  "pricingType": "paid",
  "websiteUrl": "https://audjust.ai/ai-song-cover-generator",
  "pros": [
    "Audio upload plus detailed style prompts",
    "Supports MP3, WAV, M4A, AAC, OGG and FLAC",
    "Part of a broader audio creation workspace"
  ],
  "cons": [
    "Sign-in and credits required for generation",
    "Source limited to eight minutes and 50 MB",
    "Does not clear third-party music rights"
  ],
  "logo": "#6366f1",
  "logoInitials": "AA",
  "logoUrl": "/tool-logos/audjust-ai-song-cover-generator.png",
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://audjust.ai/ai-song-cover-generator",
  "alternatives": []
},
{
  "slug": "faceswapjoy",
  "name": "FaceSwapJoy",
  "tagline": "Swap one face in photos and preview short video swaps",
  "description": "FaceSwapJoy offers single-face editing for photos and short videos in a browser. Try the built-in examples, or sign in to use your own files with credits. Video users can preview a selected 0.5-to-3-second range before purchasing a separate full-clip swap; source clips must be 1 to 15 seconds. Photo exports are JPG, while video exports are MP4. Use consenting adults and authorized images. Photo jobs require consent for fal.ai processing; results can vary with head angle, lighting and motion.",
  "category": "AI Video",
  "pricing": "Free samples; eligible new accounts receive three starter credits while available; photos cost 1 credit, video previews 3 and full swaps 12; paid credit packs available",
  "pricingType": "freemium",
  "websiteUrl": "https://faceswapjoy.com/",
  "pros": [
    "Built-in examples before using personal files",
    "Short video previews before full export",
    "Original-versus-result comparison controls"
  ],
  "cons": [
    "One visible face at a time",
    "Own-file generation requires sign-in and credits",
    "Results expire after 24 hours; cloud-provider retention also applies"
  ],
  "logo": "#6366f1",
  "logoInitials": "F",
  "logoUrl": "/tool-logos/faceswapjoy.png",
  "rating": null,
  "featured": false,
  "affiliateUrl": "https://faceswapjoy.com/",
  "alternatives": []
},
{
  "slug": "citation-rocket",
  "name": "Citation Rocket",
  "tagline": "Audit website readiness and brand mentions in AI answers",
  "description": "Citation Rocket checks public website content and crawler access, then runs on-demand brand-visibility questions across supported AI models. Reports include competitor mentions, prioritized fixes and generated website support files such as schema and llms.txt. The paid audit workflow uses your own OpenRouter key, with model usage billed separately. Agency licensing adds branded reports. Results describe sampled answers and site checks rather than guaranteeing citations, rankings or traffic.",
  "category": "Marketing",
  "logo": "#6366f1",
  "logoInitials": "CR",
  "logoUrl": "/tool-logos/citation-rocket.png",
  "rating": null,
  "pricing": "Free comparison; one-time paid licenses with separate OpenRouter usage charges; standard advertised tiers $99 Lifetime and $149 Agency",
  "pricingType": "freemium",
  "websiteUrl": "https://www.citationrocket.com/",
  "affiliateUrl": "https://www.citationrocket.com/",
  "featured": false,
  "pros": [
    "Crawler checks and prioritized website fixes",
    "On-demand brand comparisons and exportable reports"
  ],
  "cons": [
    "Own OpenRouter key and usage charges required for AI audits",
    "Recommendations cannot guarantee AI citations"
  ],
  "alternatives": []
},
{
  "slug": "vocal-separator",
  "name": "Vocal Separator",
  "tagline": "Separate recordings into vocals, backing tracks or four stems",
  "description": "Vocal Separator splits audio into vocals and instrumental tracks, with a four-stem option for vocals, drums, bass and other sound. Preview and download WAV results for recordings you own or are permitted to process. Limited free cloud jobs and an on-device separation option are available; paid minute packs add batch handling and larger files. Local processing depends on device resources, while cloud results have download windows. Separation quality varies with the recording.",
  "category": "Audio",
  "logo": "#6366f1",
  "logoInitials": "VS",
  "logoUrl": "/tool-logos/vocal-separator.png",
  "rating": null,
  "pricing": "Up to 2 free cloud jobs/browser/UTC day; local option available; $9.99 one-time pack for 90 minutes",
  "pricingType": "freemium",
  "websiteUrl": "https://vocalseparator.com/",
  "affiliateUrl": "https://vocalseparator.com/",
  "featured": false,
  "pros": [
    "Two-track and four-stem WAV output",
    "Local processing option alongside cloud separation"
  ],
  "cons": [
    "Free cloud files limited to 10 minutes and 100 MB",
    "Free cloud downloads expire after 55 minutes"
  ],
  "alternatives": []
},
{
  "slug": "anywear-studio",
  "name": "Anywear Studio",
  "tagline": "Preview clothing in motion with a camera-based fitting room",
  "description": "Anywear Studio combines a garment image and your camera feed to preview an outfit in a live browser fitting room. Compatible phones and desktop browsers can use the website, while a desktop Chrome extension places the room beside a shopping page. Eligible new accounts receive three introductory Passes once. Sessions and garment changes use Pass allowances. The output is a visual styling preview, not a body measurement, size recommendation or guarantee that clothing will fit.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "AS",
  "logoUrl": "/tool-logos/anywear-studio.png",
  "rating": null,
  "pricing": "3 introductory Passes for eligible accounts; subscriptions from $9.99/month plus one-time options",
  "pricingType": "freemium",
  "websiteUrl": "https://anywear.studio/",
  "affiliateUrl": "https://anywear.studio/",
  "featured": false,
  "pros": [
    "Browser fitting room and desktop Chrome extension",
    "Visual outfit exploration while moving"
  ],
  "cons": [
    "Preview does not measure fit or recommend a size",
    "Rooms last up to 30 seconds; each garment change uses a Pass"
  ],
  "alternatives": []
},
{
  "slug": "ai-photo-editor",
  "name": "AI Photo Editor",
  "tagline": "Edit photos with prompts for removal, restoration and expansion",
  "description": "AI Photo Editor is a browser workspace for changing images with text instructions. Upload a photo to remove an object or background, adjust a portrait, restore an older image or extend the canvas. A limited guest experience allows edits without signing in; paid credits and subscriptions expand usage and model access. Review generated edges, faces and fine details before publishing, and edit only images you have permission to use.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "AP",
  "logoUrl": "/tool-logos/ai-photo-editor.png",
  "rating": null,
  "pricing": "Limited free guest editing; paid credit packs and subscriptions available",
  "pricingType": "freemium",
  "websiteUrl": "https://aiphoto-editor.org/",
  "affiliateUrl": "https://aiphoto-editor.org/",
  "featured": false,
  "pros": [
    "Prompt-based editing with several specialized tools",
    "Limited guest access without registration"
  ],
  "cons": [
    "Free usage is limited",
    "Generated edits may alter details you intended to preserve"
  ],
  "alternatives": []
},
{
  "slug": "refract",
  "name": "Refract",
  "tagline": "Adapt and schedule social posts across connected networks",
  "description": "Refract turns a source note into network-specific social posts for review and scheduling. It combines a composer, calendar and media studio with plan-dependent team approvals, plus API and MCP access for supported workflows. Users connect social accounts and review adapted copy before publication. Network availability, account limits, AI credits and X posting allowances vary; check the current platform list rather than assuming every advertised integration is live.",
  "category": "Marketing",
  "logo": "#6366f1",
  "logoInitials": "R",
  "logoUrl": "/tool-logos/refract.png",
  "rating": null,
  "pricing": "14-day trial without a card; paid plans, with Creator advertised at $120/year",
  "pricingType": "paid",
  "websiteUrl": "https://refract.social?ref=aibeat",
  "affiliateUrl": "https://refract.social?ref=aibeat",
  "featured": false,
  "pros": [
    "Network-specific drafts and scheduling calendar",
    "Media studio and API/MCP integration"
  ],
  "cons": [
    "AI usage and connected-account allowances depend on plan",
    "Some networks are marked coming soon; team approvals are plan-dependent"
  ],
  "alternatives": []
},
{
  "slug": "everygen-ai",
  "name": "EveryGen AI",
  "tagline": "Generate videos from text or images with visible credit estimates",
  "description": "EveryGen AI provides a browser workbench for text-to-video and image-to-video generation across multiple third-party models. Users can develop an idea, choose supported reference and output settings, and inspect the credit quote before generating. A small free Inspiration allowance covers planning replies and one image; full video generation is paid separately. Output resolution, sound, duration and credit use vary by model. Download completed results within the stated retention window.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "EA",
  "logoUrl": "/tool-logos/everygen-ai.png",
  "rating": null,
  "pricing": "Free Inspiration trial: 3 replies and 1 image; video generation requires paid credits or plans",
  "pricingType": "freemium",
  "websiteUrl": "https://everygenai.live/",
  "affiliateUrl": "https://everygenai.live/",
  "featured": false,
  "pros": [
    "Several model choices in one workbench",
    "Generation credit quote before submission"
  ],
  "cons": [
    "Free trial does not include full video generation",
    "Model capabilities, costs and download retention vary"
  ],
  "alternatives": []
},
{
  "slug": "christmas-dancely",
  "name": "Christmas Dancely",
  "tagline": "Create a personalized two-person holiday dance video",
  "description": "Christmas Dancely uses two authorized photos to create a two-person Christmas pajama dance video. Choose among three dance references, select a festive room or the original setting, and render at 480p or 720p. One-time credit packs fund generation without a subscription. The showcased creator clips are dance references rather than evidence of personalized generated results. Check likeness and motion in the output before sharing.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "CD",
  "logoUrl": "/tool-logos/christmas-dancely.png",
  "rating": null,
  "pricing": "One-time packs from $3.99 for 10 credits; 480p uses 10 credits and 720p uses 20",
  "pricingType": "paid",
  "websiteUrl": "https://christmasdancely.com/",
  "affiliateUrl": "https://christmasdancely.com/",
  "featured": false,
  "pros": [
    "Two-person photo input with scene choices",
    "One-time packs and two output resolutions"
  ],
  "cons": [
    "Limited to preset dance references",
    "Creator reference clips are not generated customer results"
  ],
  "alternatives": []
},
{
  "slug": "focus-100",
  "name": "Focus 100",
  "tagline": "Turn selected messages into tasks, due dates and reply drafts",
  "description": "Focus 100 helps convert requests in messages into tasks, reminders and suggested replies. On Android it uses permission-based access to selected notifications and other enabled sources; the iPhone and desktop web version accepts pasted or imported messages. Reply drafts await approval, while optional Android sending can act on an explicit request. Tasks are stored on the device, but message content is sent to servers and AI providers for processing. Review permissions and privacy settings before connecting sensitive communications.",
  "category": "Productivity",
  "logo": "#6366f1",
  "logoInitials": "F1",
  "logoUrl": "/tool-logos/focus-100.png",
  "rating": null,
  "pricing": "Free; no required account or ads according to the developer",
  "pricingType": "free",
  "websiteUrl": "https://focus100.app/get?ref=s-aibeat",
  "affiliateUrl": "https://focus100.app/get?ref=s-aibeat",
  "featured": false,
  "pros": [
    "Tasks and due dates derived from selected messages",
    "Android app and browser-based workflow"
  ],
  "cons": [
    "Notification access is Android-specific and misses messages without notifications",
    "AI processing sends message content off-device"
  ],
  "alternatives": []
},
{
  "slug": "open-atelier",
  "name": "Open Atelier",
  "tagline": "Improve fiction with craft checks, lessons and optional AI coaching",
  "description": "Open Atelier helps fiction writers examine chapters for habits such as dialogue-tag adverbs, filter words, tense changes and backstory dumps. Findings connect to lessons and exercises. Its Human only mode uses rules rather than a language model; optional Coach and Co-write modes provide feedback or suggestions that the writer chooses to accept. Import and export tools and a text-source record support manuscript work. The source record documents activity but is not proof of authorship.",
  "category": "Writing",
  "logo": "#6366f1",
  "logoInitials": "OA",
  "logoUrl": "/tool-logos/open-atelier.png",
  "rating": null,
  "pricing": "Free writing tools and 3 Coach reads/month; Atelier $21/month or $189/year",
  "pricingType": "freemium",
  "websiteUrl": "https://openatelier.co/",
  "affiliateUrl": "https://openatelier.co/",
  "featured": false,
  "pros": [
    "Rule-based checks linked to lessons and practice",
    "Optional AI modes with writer-controlled acceptance"
  ],
  "cons": [
    "AI coaching and co-writing have usage limits",
    "Rule-based findings still require editorial judgment"
  ],
  "alternatives": []
},
{
  "slug": "rapsong-ai",
  "name": "RapSong AI",
  "tagline": "Create a short solo or duet rap video from adult portraits",
  "description": "RapSong AI turns a topic and authorized adult portraits into a twelve-second vertical rap video with vocals. Choose solo or duo mode, select one of four stages and review the four-line verse before rendering. Output is a 720p MP4 rather than a full song or standalone audio track. Videos use prepaid credits, with no subscription or free tier; even lyric preview requires a sufficient credit balance. Subjects must be consenting adults, and the service excludes public figures.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "RA",
  "logoUrl": "/tool-logos/rapsong-ai.png",
  "rating": null,
  "pricing": "10 credits per video; one-time packs from $6.99 plus applicable tax; no free tier",
  "pricingType": "paid",
  "websiteUrl": "https://rapsongai.com/",
  "affiliateUrl": "https://rapsongai.com/",
  "featured": false,
  "pros": [
    "Solo and duo portrait inputs",
    "Verse preview and four stage choices"
  ],
  "cons": [
    "Fixed twelve-second video format",
    "Paid credit balance required before lyric preview"
  ],
  "alternatives": []
},
{
  "slug": "video-transcriber",
  "name": "Video Transcriber",
  "tagline": "Turn recorded speech into editable transcripts and subtitles",
  "description": "Video Transcriber converts supported audio and video uploads or accessible public links into searchable transcripts. Users can review text, work with speaker labels where supported and export text or subtitle files for editing, research and publishing. The workspace also offers AI notes and summaries. Free usage has monthly, daily-file and per-file limits; paid plans expand capacity. Available exports and source access vary, and transcripts should be checked against the recording before publication.",
  "category": "Audio",
  "logo": "#6366f1",
  "logoInitials": "VT",
  "logoUrl": "/tool-logos/video-transcriber.png",
  "rating": null,
  "pricing": "Free 90 minutes/month, up to 1 file/day and 30 minutes/file; paid plans and minute packs available",
  "pricingType": "freemium",
  "websiteUrl": "https://videotranscriber.pro/",
  "affiliateUrl": "https://videotranscriber.pro/",
  "featured": true,
  "pros": [
    "Transcript review and subtitle export in one workspace",
    "File uploads and supported public video links"
  ],
  "cons": [
    "Free tier has file and monthly usage limits",
    "Restricted links and noisy recordings can limit results"
  ],
  "alternatives": []
},
{
  "slug": "ai-haircut",
  "name": "AI Haircut",
  "tagline": "Preview hairstyles and hair colors on your own photo",
  "description": "AI Haircut generates hairstyle previews from an uploaded portrait. Browse cuts, bangs, braids and colors, select up to five looks for one photo, and download results to discuss with a stylist. Each successful preview uses a purchased try-on; no account or subscription is required. The previews are illustrative rather than a prediction of a salon result. Uploaded photos are processed by an AI provider, whose retention rules may differ from the site’s stated thirty-day upload retention.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "AH",
  "logoUrl": "/tool-logos/ai-haircut.png",
  "rating": null,
  "pricing": "One-time packs: $4.99 for 1 try-on, $9.99 for 3, $14.99 for 5 or $24.99 for 10; valid for 365 days",
  "pricingType": "paid",
  "websiteUrl": "https://aihaircut.net/",
  "affiliateUrl": "https://aihaircut.net/",
  "featured": false,
  "pros": [
    "Compare several hairstyles from one portrait",
    "One-time packs without account or subscription"
  ],
  "cons": [
    "Personal-photo generation requires paid try-ons",
    "Results vary with the photo and are not a guaranteed salon outcome"
  ],
  "alternatives": []
},
{
  "slug": "comicory",
  "name": "Comicory",
  "tagline": "Develop written stories into editable comic pages",
  "description": "Comicory turns stories into editable panel scripts and illustrated comic pages. Users set character and location references, choose page layouts and styles, revise dialogue, and regenerate panels or repaint a selected area. It supports continuing a story with the same cast and exporting comic pages in several reading and print formats. New accounts receive ten one-time credits without a card. Higher resolutions and other capabilities depend on the plan or credit pack. Reference images help continuity but do not eliminate visual inconsistencies.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "C",
  "logoUrl": "/tool-logos/comicory.png",
  "rating": null,
  "pricing": "10 one-time starter credits; credit packs from $4.99 and monthly plans from $9.99; check current offers",
  "pricingType": "freemium",
  "websiteUrl": "https://www.comicory.com/",
  "affiliateUrl": "https://www.comicory.com/",
  "featured": false,
  "pros": [
    "Editable scripts, speech bubbles and panel layouts",
    "Character references and targeted panel corrections"
  ],
  "cons": [
    "Higher-resolution generation uses more credits and may require a higher plan",
    "Characters, text and visual continuity still need review"
  ],
  "alternatives": []
},
{
  "slug": "rap-blaze",
  "name": "Rap Blaze",
  "tagline": "Create short rap and trend videos from photos",
  "description": "Rap Blaze turns portrait photos into vertical rap videos, duets and template-based trend clips. Users select a scene, upload an image and choose output settings. Original rap videos include generated sound, while some trend remakes export silently for adding music in the destination app. One limited, watermarked original-rap preview is available per account; downloadable full videos use one-time credit packs. Use photos with permission and review likeness and lip sync before sharing.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "RB",
  "logoUrl": "/tool-logos/rap-blaze.png",
  "rating": null,
  "pricing": "Limited free original-rap preview; one-time credit packs from $6.99; no subscription",
  "pricingType": "freemium",
  "websiteUrl": "https://rapblaze.com/?utm_source=aibeat.dev",
  "affiliateUrl": "https://rapblaze.com/?utm_source=aibeat.dev",
  "featured": false,
  "pros": [
    "Photo-based rap and trend templates",
    "One-time credit purchases without subscription"
  ],
  "cons": [
    "Free preview is limited and not downloadable",
    "Some trend outputs require adding sound separately"
  ],
  "alternatives": []
},
{
  "slug": "voice-ai-canva",
  "name": "Voice AI for Canva",
  "tagline": "Add text-to-speech narration to Canva designs",
  "description": "Voice AI converts scripts into voiceovers inside Canva for videos, presentations and other designs. The app offers a large multilingual voice catalog and speed controls on supported voices. Its website provides prerecorded samples; audio generation takes place in the Canva app. A limited free allowance is described in the submission, while the published paid plans start at $10.99 per month. Voice availability, usage allowances and commercial rights depend on the selected plan.",
  "category": "Audio",
  "logo": "#6366f1",
  "logoInitials": "VA",
  "logoUrl": "/tool-logos/voice-ai-canva.png",
  "rating": null,
  "pricing": "Limited free Canva app allowance; paid plans from $10.99/month",
  "pricingType": "freemium",
  "websiteUrl": "https://www.voicesai.app/",
  "affiliateUrl": "https://www.voicesai.app/",
  "featured": false,
  "pros": [
    "Voiceover generation within Canva",
    "Multilingual voice selection and supported speed controls"
  ],
  "cons": [
    "Website offers samples rather than audio generation",
    "Character allowances and voice features vary by plan"
  ],
  "alternatives": []
},
{
  "slug": "menuforma",
  "name": "MenuForma",
  "tagline": "Import restaurant menus and share them through QR codes",
  "description": "MenuForma uses AI to extract dishes, prices and descriptions from a PDF, photo or website into an editable restaurant menu. Restaurants can share QR codes, manage enabled ordering channels and translate menus on eligible plans. The free plan covers one restaurant and one primary language with limited AI credits. Paid plans add multilingual menus and advanced ordering options. Imported prices, translations and allergen information need restaurant review before publication.",
  "category": "Business",
  "logo": "#6366f1",
  "logoInitials": "M",
  "logoUrl": "/tool-logos/menuforma.png",
  "rating": null,
  "pricing": "Free plan with limited AI credits; Regular from $9.99/month and Pro from $49.99/month",
  "pricingType": "freemium",
  "websiteUrl": "https://menuforma.com/",
  "affiliateUrl": "https://menuforma.com/",
  "featured": false,
  "pros": [
    "Menu import from PDF, photos or websites",
    "QR menus with plan-dependent ordering and translation"
  ],
  "cons": [
    "Free plan is limited to one restaurant and primary language",
    "Advanced ordering, payments and translations depend on plan"
  ],
  "alternatives": []
},
{
  "slug": "imagesvg-for-chatgpt",
  "name": "ImageSVG for ChatGPT",
  "tagline": "Convert raster logos and icons into editable SVG in ChatGPT",
  "description": "ImageSVG provides a ChatGPT MCP integration for converting PNG, JPEG and WebP images into SVG through an interactive panel. It is best suited to logos, icons and flat illustrations. Users connect their ImageSVG account, adjust conversion settings and download the result. The integration shares the website allowance of up to three free conversions per UTC day and fifteen per month. Custom connections must be permitted by the ChatGPT account or workspace; small text and fine detail need inspection.",
  "category": "Design",
  "logo": "#6366f1",
  "logoInitials": "If",
  "logoUrl": "/tool-logos/imagesvg-for-chatgpt.png",
  "rating": null,
  "pricing": "Up to 3 free conversions per UTC day and 15 per month; paid website passes available",
  "pricingType": "freemium",
  "websiteUrl": "https://imagesvg.com/en/developers",
  "affiliateUrl": "https://imagesvg.com/en/developers",
  "featured": false,
  "pros": [
    "SVG conversion within a ChatGPT panel",
    "Shared website and integration allowance"
  ],
  "cons": [
    "Requires a permitted custom MCP connection",
    "Text becomes vector shapes and fine detail needs review"
  ],
  "alternatives": []
},
{
  "slug": "talescene",
  "name": "TaleScene",
  "tagline": "Turn short stories into storyboards and voiced multi-scene films",
  "description": "TaleScene develops a short written story into a script, storyboard and voiced multi-scene video. It offers visual style choices and aims to retain character appearance across shots. New accounts receive twenty credits without a card, with script and storyboard creation available to try before purchasing video credits. Finished-film generation uses paid credit packs. AIBeat has not independently tested the advertised character consistency; generated scenes, speech and subtitles should be reviewed.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "T",
  "logoUrl": "/tool-logos/talescene.png",
  "rating": null,
  "pricing": "20 signup credits without a card; video credit packs from $19.90",
  "pricingType": "freemium",
  "websiteUrl": "https://www.talescene.com/",
  "affiliateUrl": "https://www.talescene.com/",
  "featured": false,
  "pros": [
    "Story-to-script and storyboard workflow",
    "Multi-scene film generation with style choices"
  ],
  "cons": [
    "Voiced video generation uses paid credits",
    "Character consistency and generated details need review"
  ],
  "alternatives": []
},
{
  "slug": "ai-rap-video-generator",
  "name": "AI Rap Video Generator",
  "tagline": "Turn two portraits into a short lip-synced rap duet",
  "description": "AI Rap Video Generator creates a rap duo from two portraits or one photo containing both subjects. Users select a stage and occasion, then review and edit original lyrics before rendering. The site currently offers a first five-second watermarked clip in a queue without a card. Paid twelve-second videos use credits and remove the watermark. Subjects must agree to appear, and users should check generated lyrics, likeness and lip sync before sharing.",
  "category": "AI Video",
  "logo": "#6366f1",
  "logoInitials": "AR",
  "logoUrl": "/tool-logos/ai-rap-video-generator.png",
  "rating": null,
  "pricing": "First 5-second watermarked clip free; paid 12-second renders use credits",
  "pricingType": "freemium",
  "websiteUrl": "https://www.airapvideogenerator.app/",
  "affiliateUrl": "https://www.airapvideogenerator.app/",
  "featured": false,
  "pros": [
    "Editable lyrics before paid rendering",
    "Two-photo or shared-photo input"
  ],
  "cons": [
    "Free output is shorter, watermarked and queued",
    "Paid output is a fixed short format"
  ],
  "alternatives": []
},
{
  "slug": "nano-banana-2-1",
  "name": "Nano Banana 2.1 by AI Image Editor",
  "tagline": "Generate and edit images with prompts and reference photos",
  "description": "AI Image Editor offers an independent browser interface marketed as Nano Banana 2.1 for text-to-image generation and reference-based editing. Upload photos, describe a local change and choose output settings for product imagery, illustrations or wider compositions. It is a third-party service, not an official Google page. Free signup credits support personal use; paid plans add commercial-use rights and higher-resolution options. Check lettering, faces and fine details before publishing.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "NB",
  "logoUrl": "/tool-logos/nano-banana-2-1.png",
  "rating": null,
  "pricing": "Free signup credits for personal use; paid plans from $9.90/month",
  "pricingType": "freemium",
  "websiteUrl": "https://ai-image-editor.com/nano-banana-2-1",
  "affiliateUrl": "https://ai-image-editor.com/nano-banana-2-1",
  "featured": false,
  "pros": [
    "Prompt-based generation and reference-image editing",
    "Aspect ratio and resolution controls"
  ],
  "cons": [
    "Higher-resolution output and commercial use require a paid plan",
    "Generated details and text need review"
  ],
  "alternatives": []
},
{
  "slug": "datacircle",
  "name": "Datacircle",
  "tagline": "Compare GTM API providers, pricing and benchmark results",
  "description": "Datacircle is a research resource for comparing go-to-market APIs across data enrichment, email verification, social platforms, search and other developer workflows. Browse provider plans, adjust comparison filters and download CSV or JSON data. It publishes its own benchmark methodology and results; AIBeat has not independently reproduced those scores. Datacircle does not sell the APIs itself, so access terms, permissions and usage charges remain with each provider.",
  "category": "Developer Tools",
  "logo": "#6366f1",
  "logoInitials": "D",
  "logoUrl": "/tool-logos/datacircle.png",
  "rating": null,
  "pricing": "Free comparison site and downloadable data; third-party API charges vary",
  "pricingType": "free",
  "websiteUrl": "https://datacircle.dev/",
  "affiliateUrl": "https://datacircle.dev/",
  "featured": false,
  "pros": [
    "Filter API plans and export comparison data",
    "Pricing and methodology are available for review"
  ],
  "cons": [
    "Benchmarks reflect the publisher’s testing conditions",
    "API access and compliance must be checked with each provider"
  ],
  "alternatives": []
},
{
  "slug": "text-to-video",
  "name": "Text to Video",
  "tagline": "Create short AI video clips from written prompts and images",
  "description": "Text to Video is a browser-based creative workspace for generating clips from written prompts, still images and reference material. It brings supported video models together with image, avatar and audio workflows, allowing creators to choose settings for social posts, concept previews or promotional assets. Free starter credits are available, with subscriptions and credit packs for further use. Costs and available outputs depend on the selected model, duration and resolution; review results and usage rights before publishing.",
  "category": "Video",
  "logo": "#6366f1",
  "logoInitials": "TT",
  "logoUrl": "/tool-logos/text-to-video.png",
  "rating": null,
  "pricing": "Free starter credits; paid subscriptions and credit packs",
  "pricingType": "freemium",
  "websiteUrl": "https://texttovideo.com/",
  "affiliateUrl": "https://texttovideo.com/",
  "featured": false,
  "pros": [
    "Text, image and reference-based video workflows",
    "Multiple generation settings in one browser workspace"
  ],
  "cons": [
    "Credit costs vary with model and output settings",
    "Generated motion and likeness need review"
  ],
  "alternatives": []
},
{
  "slug": "homework-helper",
  "name": "Homework Helper by Math AI",
  "tagline": "Work through study questions with text, images and PDFs",
  "description": "Homework Helper by Math AI accepts typed questions or uploaded JPG, PNG, WebP and PDF files and produces step-by-step explanations. Its subject tools cover areas such as mathematics, physics, chemistry and biology. Use it to explore a method, compare an approach or identify a point that needs further study. The pricing page lists three free credits per day and paid plans for more usage. Answers can be incorrect, so verify reasoning and follow your course’s rules for AI assistance.",
  "category": "Education",
  "logo": "#6366f1",
  "logoInitials": "HH",
  "logoUrl": "/tool-logos/homework-helper.png",
  "rating": null,
  "pricing": "Free plan with 3 credits/day; paid plans for additional usage",
  "pricingType": "freemium",
  "websiteUrl": "https://math-gpt.ai/ai-homework-helper",
  "affiliateUrl": "https://math-gpt.ai/ai-homework-helper",
  "featured": false,
  "pros": [
    "Text, image and PDF question input",
    "Step-by-step explanations across study subjects"
  ],
  "cons": [
    "Free daily usage is limited",
    "Answers require independent checking"
  ],
  "alternatives": []
},
{
  "slug": "matterseek",
  "name": "MatterSeek",
  "tagline": "Explore material properties and candidate compositions for R&D",
  "description": "MatterSeek is a beta materials-research platform from Yuyao Technology. It describes workflows for estimating material properties and proposing candidate compositions from target properties, elemental constraints and processing requirements. Researchers can use predictions and visualizations to prioritize experiments rather than treating generated candidates as validated materials. The public site links to a separate sign-in portal for the application. Availability, access terms and pricing should be confirmed directly with the provider; prediction accuracy and industrial performance have not been independently tested by AIBeat.",
  "category": "Research",
  "logo": "#6366f1",
  "logoInitials": "M",
  "logoUrl": "/tool-logos/matterseek.png",
  "rating": null,
  "pricing": "Beta access: contact the provider for availability and pricing",
  "pricingType": "paid",
  "websiteUrl": "https://www.yuyaomatterseek.net/matterseek",
  "affiliateUrl": "https://www.yuyaomatterseek.net/matterseek",
  "featured": false,
  "pros": [
    "Forward property prediction and inverse-design workflows",
    "Element and target-property constraints"
  ],
  "cons": [
    "Experimental validation is required",
    "Beta access and pricing require provider confirmation"
  ],
  "alternatives": []
},
{
  "slug": "rapbooth",
  "name": "RapBooth",
  "tagline": "Turn two consenting adult portraits into an AI rap duet",
  "description": "RapBooth creates short template-based rap videos with generated vocals and music from two portraits. Upload a separate photo for each adult performer, choose a supported quality setting and download the finished MP4. The service requires sign-in and purchased credits; a 480p video uses 10 credits and 720p uses 20. Use portraits with permission and review faces, movement and audio before sharing. The generated performance follows the template rather than providing a recording of the people’s real voices or actions.",
  "category": "Video",
  "logo": "#6366f1",
  "logoInitials": "R",
  "logoUrl": "/tool-logos/rapbooth.png",
  "rating": null,
  "pricing": "One-time packs from $4.99 for 10 credits; 10 credits at 480p or 20 at 720p",
  "pricingType": "paid",
  "websiteUrl": "https://rap-video-ai.app/",
  "affiliateUrl": "https://rap-video-ai.app/",
  "featured": false,
  "pros": [
    "Two-photo duet with generated vocals and music",
    "One-time credit packs without a subscription"
  ],
  "cons": [
    "Paid credits and sign-in are required",
    "Adult portrait consent and output review are needed"
  ],
  "alternatives": []
},
{
  "slug": "pixtexta",
  "name": "PixTexta",
  "tagline": "Replace existing lettering in finished images",
  "description": "PixTexta detects text in a JPG, PNG or WebP and lets you replace a selected word or line while retaining the surrounding image. Preview the result, adjust its appearance and export a PNG at the original canvas size. It is useful for correcting owned product graphics, posters and instructional screenshots when the editable source is unavailable. One guest edit exports with a watermark; new accounts receive three credits. Complex backgrounds or crowded lettering may need additional adjustment.",
  "category": "Image",
  "logo": "#6366f1",
  "logoInitials": "P",
  "logoUrl": "/tool-logos/pixtexta.png",
  "rating": null,
  "pricing": "One free watermarked guest edit; 3 signup credits; packs from $4.90 for 15 credits",
  "pricingType": "freemium",
  "websiteUrl": "https://pixtexta.com/",
  "affiliateUrl": "https://pixtexta.com/",
  "featured": false,
  "pros": [
    "Edit detected text in an existing image",
    "Original-size PNG export and appearance controls"
  ],
  "cons": [
    "Complex lettering and backgrounds can need manual adjustment",
    "Use only for legitimate edits, not misleading records or screenshots"
  ],
  "alternatives": []
},
{
  "slug": "stylesvg",
  "name": "StyleSVG",
  "tagline": "Convert raster artwork into editable vectors for making and print",
  "description": "StyleSVG traces PNG, JPG, WebP and GIF images into editable SVG shapes, with presets for cutting, engraving, print and embroidery. Adjust colors, remove backgrounds and inspect the result before unlocking exports such as SVG, PDF, EPS and DXF. The site offers a daily preview without signup and one free downloadable conversion after signing in. Photos become stylized flat-color artwork rather than exact photographic copies, so review small lettering and machine dimensions before production.",
  "category": "Design",
  "logo": "#6366f1",
  "logoInitials": "ST",
  "logoUrl": "/tool-logos/stylesvg.png",
  "rating": null,
  "pricing": "One free preview/day; one free conversion after signup; $6.99 per additional file or plans from $49/year",
  "pricingType": "freemium",
  "websiteUrl": "https://stylesvg.com/",
  "affiliateUrl": "https://stylesvg.com/",
  "featured": false,
  "pros": [
    "Color controls and machine-oriented presets",
    "Preview before paying; multiple export formats"
  ],
  "cons": [
    "Detailed photos become stylized vector art",
    "Fine details and cutter settings need manual review"
  ],
  "alternatives": []
},
{
  "slug": "denoisa",
  "name": "Denoisa",
  "tagline": "Reduce background noise in recorded audio and video",
  "description": "Denoisa cleans speech recordings and video soundtracks in a browser. Standard processing runs locally, while optional Enhanced processing uploads audio to the service when selected. Preview both modes before choosing; Standard full downloads for files up to five minutes are free. Longer files and Enhanced use credits. It works on recorded files, not live calls, and cannot reliably separate overlapping speakers, repair clipping or eliminate strong room echo. Listen for artifacts before using the result.",
  "category": "Audio",
  "logo": "#6366f1",
  "logoInitials": "DE",
  "logoUrl": "/tool-logos/denoisa.png",
  "rating": null,
  "pricing": "Free previews and Standard files up to 5 minutes; packs from $4.99; optional subscriptions from $16.99/month",
  "pricingType": "freemium",
  "websiteUrl": "https://denoisa.com/",
  "affiliateUrl": "https://denoisa.com/",
  "featured": false,
  "pros": [
    "Local Standard processing with free short-file downloads",
    "Audio and video support with before/after preview"
  ],
  "cons": [
    "Enhanced processing sends audio to servers",
    "Overlapping speech, clipping and strong echo remain limitations"
  ],
  "alternatives": []
},
{
  "slug": "sheru-bhai-ai",
  "name": "Sheru Bhai AI Video Generator",
  "tagline": "Create fictional lion-companion scenes from consenting adult portraits",
  "description": "Sheru Bhai Hub creates short videos or still images from one or two adult portraits and prepared fictional scenes. Choose a human companion beside a suited lion, a couple scene or a stylized lion persona. The site advertises 10-second 720p videos in portrait or landscape format, requesting generated instrumental audio without dialogue. Preview clips illustrate settings and are not submitted as motion references. Use portraits with permission and review faces, anatomy and sound; a lion persona does not promise a literal facial likeness.",
  "category": "Video",
  "logo": "#6366f1",
  "logoInitials": "SH",
  "logoUrl": "/tool-logos/sheru-bhai-ai.png",
  "rating": null,
  "pricing": "One-time packs from $5.99 for 60 credits; videos cost 50 credits and 2K stills cost 5; no subscription",
  "pricingType": "paid",
  "websiteUrl": "https://sherubhaihub.com/",
  "affiliateUrl": "https://sherubhaihub.com/",
  "featured": false,
  "pros": [
    "Fourteen fictional scene templates",
    "Human-companion, couple and stylized lion-persona options"
  ],
  "cons": [
    "Paid generation with variable likeness and motion",
    "Adults only; consent and output review required"
  ],
  "alternatives": []
},
{
  "slug": "seedream-5-5",
  "name": "Seedream 5.5 AI Image Generator",
  "tagline": "Generate and edit images with prompts and multiple references",
  "description": "AI Image Editor offers a third-party image-generation and editing interface marketed as Seedream 5.5. Start from text or combine up to ten reference images, then revise the result with additional instructions. The site advertises transparent PNG output, text rendering, fifteen aspect ratios and resolutions up to 2K. Model identity and fidelity claims have not been independently verified by AIBeat; review generated text, faces and unchanged areas rather than assume perfect consistency. Free outputs are described as personal-use only, with commercial use available after purchasing a plan or credits.",
  "category": "AI Image",
  "pricing": "Free signup credits; paid credit packs and subscriptions; cost varies by resolution and reference count",
  "pricingType": "freemium",
  "websiteUrl": "https://ai-image-editor.com/seedream-5-5",
  "pros": [
    "Text-to-image and multi-reference editing in one interface",
    "Advertised transparent PNG output and multiple aspect ratios"
  ],
  "cons": [
    "Editing consistency and rendered text require review",
    "Commercial use requires a paid purchase under the site terms"
  ],
  "logo": "#7c3aed",
  "logoInitials": "S5",
  "logoUrl": "/tool-logos/seedream-5-5.png",
  "rating": null,
  "affiliateUrl": "https://ai-image-editor.com/seedream-5-5",
  "featured": false,
  "alternatives": []
},
{
  "slug": "tinycommand",
  "name": "TinyCommand",
  "tagline": "Connect forms, tables, workflows and AI steps without code",
  "description": "TinyCommand combines forms, tables, workflows and AI-assisted automation in one workspace. Teams can collect information, call connected apps from dynamic forms, process documents, branch on results and trigger follow-up actions. AI agent steps run inside workflows on every plan, while creating custom agents starts on Professional. Form responses are unlimited, but automation and AI operations consume credits. Configure integration permissions and review automated actions before using workflows with business data.",
  "category": "Productivity",
  "pricing": "Free plan: 1,000 credits/month, one seat and unlimited forms/responses; paid plans from $19/month billed monthly",
  "pricingType": "freemium",
  "websiteUrl": "https://tinycommand.com/",
  "pros": [
    "Forms, structured data and automation in a shared workspace",
    "Free plan includes workflow AI steps and unlimited responses"
  ],
  "cons": [
    "Automation and AI actions consume plan credits",
    "Custom agent creation requires Professional or above"
  ],
  "logo": "#7c3aed",
  "logoInitials": "TC",
  "logoUrl": "/tool-logos/tinycommand.png",
  "rating": null,
  "affiliateUrl": "https://tinycommand.com/",
  "featured": false,
  "alternatives": []
},

{
  "slug": "shadow-lamp-generator",
  "name": "Shadow Lamp Generator",
  "tagline": "Design printable shadow lamps from photos and silhouettes",
  "description": "Shadow Lamp Generator turns an image into a printable projection lamp with wall and 3D previews, downloadable STL parts and assembly notes. Standard image tracing runs on your device; an optional paid AI photo-to-stencil feature sends the selected image to a server and AI provider. Signed-in users receive one free STL download daily. Free and credit-pack downloads are for personal use and gifts; selling printed lamps requires the Pro commercial license. Physical results depend on printing, lighting and assembly.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "SL",
  "logoUrl": "/tool-logos/shadow-lamp-generator.png",
  "rating": null,
  "pricing": "Free design and preview; one free STL download/day with signup; credit packs from $2.99; Pro subscription available",
  "pricingType": "freemium",
  "websiteUrl": "https://shadowlampgenerator.com/",
  "affiliateUrl": "https://shadowlampgenerator.com/",
  "featured": false,
  "pros": [
    "Wall projection and assembled-model previews",
    "STL parts and print notes; optional AI stencil conversion"
  ],
  "cons": [
    "A 3D printer and suitable lighting components are needed",
    "Commercial sales require Pro; AI stencil conversion uses cloud processing"
  ],
  "alternatives": []
},
{
  "slug": "mystylelens",
  "name": "MyStyleLens",
  "tagline": "Explore face geometry and personal styling ideas",
  "description": "MyStyleLens offers browser-based face-shape, symmetry and proportion analysis, plus hairstyle, color and glasses guidance. Basic geometry scans run on-device without an account. Optional AI analysis and paid styling reports require separate permission to send photos for cloud processing. Results are styling suggestions rather than medical assessments or universal attractiveness scores, and camera angle and lighting can affect measurements.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "M",
  "logoUrl": "/tool-logos/mystylelens.png",
  "rating": null,
  "pricing": "Free geometry scans; full report advertised at $16.88 one-time; optional AI features have separate consent and limits",
  "pricingType": "freemium",
  "websiteUrl": "https://mystylelens.com/",
  "affiliateUrl": "https://mystylelens.com/",
  "featured": false,
  "pros": [
    "On-device geometry scans without signup",
    "Face-shape and styling guidance with optional detailed reports"
  ],
  "cons": [
    "Photo conditions can change measurements",
    "Optional AI features process photos externally; suggestions are not guaranteed outcomes"
  ],
  "alternatives": []
},
{
  "slug": "rapvideogo",
  "name": "RapVideoGo",
  "tagline": "Create short rap videos from portraits and editable lyrics",
  "description": "RapVideoGo creates short solo or duet rap videos from one or two reference photos, editable lyrics and scene prompts. Users can adapt templates for greetings, friendly rap battles and celebrations, then choose video settings before spending credits. AI generates the vocals and beat; the studio does not accept uploaded songs or clone a voice from a photo. Use photos of consenting adults. Generated words, assigned parts and likeness may vary, and long lyrics may be truncated by the chosen duration.",
  "category": "Video",
  "logo": "#2563eb",
  "logoInitials": "R",
  "logoUrl": "/tool-logos/rapvideogo.png",
  "rating": null,
  "pricing": "Prepaid generation credits; cost varies by duration and quality; lyric templates are free; no subscription advertised",
  "pricingType": "paid",
  "websiteUrl": "https://rapvideogo.com/",
  "affiliateUrl": "https://rapvideogo.com/",
  "featured": false,
  "pros": [
    "Editable lyrics and solo or duet scenes",
    "Generated vocals and beat without recording a voice"
  ],
  "cons": [
    "Generation uses paid credits",
    "Lyrics, timing and likeness may differ from the requested performance"
  ],
  "alternatives": []
},
{
  "slug": "no-scrubs-ai",
  "name": "No Scrubs AI",
  "tagline": "Turn consenting adult portraits into a short music-video scene",
  "description": "No Scrubs AI is an independent photo-to-video tool for a prepared three-person music-video scene. Upload a lead portrait and up to two supporting portraits; unfilled supporting roles use fictional performers. The site advertises roughly 16-second MP4 output in 4:3 at a 720p generation setting, with an included soundtrack described by the submitter as original licensed music. It is not affiliated with TLC. Generation requires an account, paid credits and consent from every depicted adult; exact likeness, motion and lip sync are not guaranteed.",
  "category": "Video",
  "logo": "#2563eb",
  "logoInitials": "NS",
  "logoUrl": "/tool-logos/no-scrubs-ai.png",
  "rating": null,
  "pricing": "$6.99 for one video, $19.99 for three or $29 for five; one-time credits; no free generation",
  "pricingType": "paid",
  "websiteUrl": "https://noscrubsai.net/",
  "affiliateUrl": "https://noscrubsai.net/",
  "featured": false,
  "pros": [
    "Lead and supporting-role controls for up to three portraits",
    "Prepared scene and included soundtrack"
  ],
  "cons": [
    "Fixed scene format rather than a general video editor",
    "Photos are processed by an external AI provider; generated results vary"
  ],
  "alternatives": []
},
{
  "slug": "i-love-the-smiths-ai",
  "name": "I Love The Smiths AI",
  "tagline": "Cast two portraits in an AI-generated elevator scene",
  "description": "I Love The Smiths AI is an independent fan project that casts two consenting adult portraits as listener and speaker in a short elevator scene inspired by (500) Days of Summer. Preview and swap roles locally for free, then use purchased credits for a 15-second video in landscape or vertical format. The site states that exports use AI-generated dialogue and elevator ambience, not the original film audio or The Smiths recording. Face likeness and dialogue timing can vary; celebrity and public-figure photos are not supported.",
  "category": "Video",
  "logo": "#2563eb",
  "logoInitials": "IL",
  "logoUrl": "/tool-logos/i-love-the-smiths-ai.png",
  "rating": null,
  "pricing": "Free local portrait preview; video generation from $8.90 for 20 credits; 480p uses 20 credits and 720p uses 45",
  "pricingType": "paid",
  "websiteUrl": "https://ilovethesmiths.video/",
  "affiliateUrl": "https://ilovethesmiths.video/",
  "featured": false,
  "pros": [
    "Separate listener and speaker portraits with role swapping",
    "Landscape or vertical framing and two resolution settings"
  ],
  "cons": [
    "Free preview does not include video generation",
    "Independent fan project; rights and likeness permissions remain the user's responsibility"
  ],
  "alternatives": []
},
{
  "slug": "futuro-ai",
  "name": "Futuro AI",
  "tagline": "Custom voice agents for business calls and follow-up",
  "description": "Futuro AI provides configured voice agents for answering business calls, qualifying leads, booking appointments and handling support workflows. Businesses can choose missed-call forwarding, after-hours coverage or broader call handling, with integrations and human-transfer rules tailored to their operations. The service includes setup and management rather than just a generic chatbot. Vendor claims about human indistinguishability, zero hallucinations, certifications and conversion performance have not been independently verified by AIBeat. Review disclosure, escalation and data-handling requirements before deployment.",
  "category": "AI Agents",
  "logo": "#2563eb",
  "logoInitials": "FA",
  "logoUrl": "/tool-logos/futuro-ai.png",
  "rating": null,
  "pricing": "Advertised seven-day trial; small-business plans from $200/month; custom deployments quoted",
  "pricingType": "paid",
  "websiteUrl": "https://www.futurocorp.com/",
  "affiliateUrl": "https://www.futurocorp.com/",
  "featured": true,
  "pros": [
    "Configured phone workflows and human handoff",
    "Calendar and CRM integration options"
  ],
  "cons": [
    "Requires business-specific setup and ongoing monitoring",
    "Performance and compliance claims need independent evaluation"
  ],
  "alternatives": [],
  "listingType": "service"
},
{
  "slug": "delibora",
  "name": "Delibora",
  "tagline": "Stress-test ideas through structured multi-agent discussions",
  "description": "Delibora stages discussions between AI participants with separate briefs and controlled turn-taking. Formats include debates, expert panels, pitch critiques, focus groups and chained workflows, producing transcripts, scorecards or reports depending on the format and plan. Users can inspect the exchange and compare perspectives rather than rely on a single generated answer. Synthetic audiences are simulations, not recruited customers or representative research samples; a model verdict does not establish that an idea is correct or will succeed.",
  "category": "Research",
  "logo": "#2563eb",
  "logoInitials": "D",
  "logoUrl": "/tool-logos/delibora.png",
  "rating": null,
  "pricing": "Paid subscriptions; Basic advertised at $24/month billed annually; formats and model access vary by plan",
  "pricingType": "paid",
  "websiteUrl": "https://delibora.com/",
  "affiliateUrl": "https://delibora.com/",
  "featured": true,
  "pros": [
    "Inspectable transcripts and separate participant briefs",
    "Multiple critique and audience-simulation formats"
  ],
  "cons": [
    "Synthetic opinions do not measure real audiences",
    "Advanced formats and exports depend on plan"
  ],
  "alternatives": []
},
{
  "slug": "saymorph",
  "name": "SayMorph",
  "tagline": "Rewrite English messages in different tones and styles",
  "description": "SayMorph is an English-first tone rewriter for emails, messages and posts. Paste text or import a text file, choose a style, and compare Safe, Balanced and Bold versions. Its meaning-preservation checks aim to retain details such as names and numbers, but rewrites can still add or soften a point, so review the full meaning before sending. The site states that text is sent to DeepSeek for processing and advises against entering confidential or sensitive information.",
  "category": "Writing",
  "logo": "#2563eb",
  "logoInitials": "S",
  "logoUrl": "/tool-logos/saymorph.png",
  "rating": null,
  "pricing": "Free without signup; advertised limit of 10 rewrites/day and 2,000 characters per rewrite",
  "pricingType": "free",
  "websiteUrl": "https://saymorph.com/",
  "affiliateUrl": "https://saymorph.com/",
  "featured": false,
  "pros": [
    "Three rewrite strengths for comparison",
    "No account needed for the free allowance"
  ],
  "cons": [
    "English-first rather than a translation service",
    "Rewrites require factual review and external text processing"
  ],
  "alternatives": []
},
{
  "slug": "you-never-let-her-pay",
  "name": "You Never Let Her Pay",
  "tagline": "Create a personalized dinner-comedy video from a portrait",
  "description": "You Never Let Her Pay is an independent browser studio that turns a consenting adult portrait into the diner in a wallet-and-sponge comedy scene. The site advertises 11-second 480p clips in vertical or landscape format, generated using purchased credits. Its FAQ says generated clips use newly generated audio; reference TikTok sounds must be checked separately in the original platform. Free portrait preview is not free video rendering. Model access, output quality and provider watermark behavior have not been independently verified.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "YN",
  "logoUrl": "/tool-logos/you-never-let-her-pay.png",
  "rating": null,
  "pricing": "Free browser portrait preview; paid video packs from $6.90 for 20 credits; no subscription",
  "pricingType": "paid",
  "websiteUrl": "https://youneverletherpay.video/",
  "affiliateUrl": "https://youneverletherpay.video/",
  "featured": false,
  "pros": [
    "Single-portrait browser workflow",
    "One-time packs and format selection"
  ],
  "cons": [
    "Full video rendering requires payment",
    "Provider watermark behavior remains unverified"
  ],
  "alternatives": []
},
{
  "slug": "ozil-goal-ai",
  "name": "Ozil Goal AI",
  "tagline": "Turn an authorized adult portrait into a football clip",
  "description": "Ozil Goal AI creates personalized football videos from a photo of the user or another consenting adult. Presets include goal scenes and a fake-rabona move, with duration and aspect ratio varying by template. Each verified account is offered one free reference image; full videos require purchased credits and may differ from that preview. The site prohibits public-figure photos and says its presets avoid real players and club branding. It is an independent product, not affiliated with a football player, club or league.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "OG",
  "logoUrl": "/tool-logos/ozil-goal-ai.png",
  "rating": null,
  "pricing": "One free reference image per verified account; video packs from $4.90 at 480p; selected 720p packs from $5.99",
  "pricingType": "paid",
  "websiteUrl": "https://ozilgoalai.io/",
  "affiliateUrl": "https://ozilgoalai.io/",
  "featured": false,
  "pros": [
    "Preset football actions without prompt writing",
    "Reference-image preview before paid video creation"
  ],
  "cons": [
    "Preview does not guarantee an identical final video",
    "Adult consent and photo rights are required"
  ],
  "alternatives": []
},
{
  "slug": "styleqrcode",
  "name": "StyleQRCode",
  "tagline": "Design QR codes with logos, scan checks and optional AI art",
  "description": "StyleQRCode creates styled QR codes for links, contacts, WiFi details and other supported content. Static codes can be made in the browser without signup, with logo, color and export controls plus a scan check. Optional dynamic codes support editable destinations and analytics, and AI QR art uses credits. A static code stores its content directly; dynamic redirects depend on the hosted service. Test the downloaded design with real devices and at its intended print size before distribution.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "S",
  "logoUrl": "/tool-logos/styleqrcode.png",
  "rating": null,
  "pricing": "Free static codes and limited dynamic/AI allowances; paid Pro, lifetime and AI credit options",
  "pricingType": "freemium",
  "websiteUrl": "https://styleqrcode.com/",
  "affiliateUrl": "https://styleqrcode.com/",
  "featured": false,
  "pros": [
    "Logo and visual customization with scan feedback",
    "Static codes without account or watermark"
  ],
  "cons": [
    "Dynamic features depend on the hosting service",
    "Complex art and print conditions can affect scanning"
  ],
  "alternatives": []
},
{
  "slug": "crealo-ai",
  "name": "Crealo AI",
  "tagline": "Create marketing text and visual assets in one workspace",
  "description": "Crealo AI combines AI-assisted writing, image creation and other content workflows for marketers and creators. Users choose a tool or template, describe the intended content, then edit and download results. The site also advertises video, avatar, voice and chatbot capabilities. Availability, usage limits and provider access should be checked in the active plan; AIBeat has not independently verified all advertised models or performance claims. Review facts, branding and asset rights before publishing generated content.",
  "category": "Marketing",
  "logo": "#2563eb",
  "logoInitials": "CA",
  "logoUrl": "/tool-logos/crealo-ai.png",
  "rating": null,
  "pricing": "Advertised free start without a card; paid plans and usage limits apply",
  "pricingType": "freemium",
  "websiteUrl": "https://crealo.ai/",
  "affiliateUrl": "https://crealo.ai/",
  "featured": false,
  "pros": [
    "Writing and visual workflows in one platform",
    "Templates and editing for marketing content"
  ],
  "cons": [
    "Model and feature availability depend on plan",
    "Generated assets require editorial review"
  ],
  "alternatives": []
},
{
  "slug": "images-upscale",
  "name": "Images Upscale",
  "tagline": "Enlarge images 2x or 4x with cloud AI enhancement",
  "description": "Images Upscale enlarges JPG, PNG and WebP images with 2x and 4x options and presets for photos, anime and screenshots. The provider states that it uses Real-ESRGAN on cloud GPUs, accepts files up to 25 MB and supports multiple files or ZIP uploads. Users can compare results and download without a watermark. Guest results are retained for seven days according to the FAQ, while signed-in results remain until deletion. Enhancement can alter fine details and text rather than recover the original information exactly.",
  "category": "AI Image",
  "logo": "#2563eb",
  "logoInitials": "IU",
  "logoUrl": "/tool-logos/images-upscale.png",
  "rating": null,
  "pricing": "Two free daily credits; one-time credit packs from $9.99; no subscription",
  "pricingType": "freemium",
  "websiteUrl": "https://www.images-upscale.com/en/image-upscaler",
  "affiliateUrl": "https://www.images-upscale.com/en/image-upscaler",
  "featured": false,
  "pros": [
    "Batch inputs and before/after comparison",
    "Free daily usage across enhancement modes"
  ],
  "cons": [
    "Files are uploaded for cloud processing",
    "Generated details and text need checking"
  ],
  "alternatives": []
},
{
  "slug": "video-translate",
  "name": "Video Translate",
  "tagline": "Translate and dub uploaded videos in the browser",
  "description": "Video Translate at videotranslators.com translates spoken dialogue and generates a dubbed MP4 using voice synthesis intended to resemble the source voice. Users upload one MP4, MOV or WebM file, explicitly choose source and target languages, and follow the job online. The site advertises 23 languages and uploads up to 500 MB, with background audio mixed back into the result. Review translation, pronunciation and timing before release, and use only footage and voices you are authorized to process. Batch jobs and link imports are not currently advertised as available.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "VT",
  "logoUrl": "/tool-logos/video-translate.png",
  "rating": null,
  "pricing": "One-time 30 starter credits after Google sign-in; paid subscriptions and packs; billed per output second",
  "pricingType": "freemium",
  "websiteUrl": "https://videotranslators.com/",
  "affiliateUrl": "https://videotranslators.com/",
  "featured": false,
  "pros": [
    "Translated speech and downloadable video output",
    "Explicit language selection and job history"
  ],
  "cons": [
    "Cloud upload and account required for generation",
    "Voice rights, translation and timing require review"
  ],
  "alternatives": []
},
{
  "slug": "scientific-figure-ai",
  "name": "Scientific Figure AI",
  "tagline": "Draft scientific diagrams with editable labels and shapes",
  "description": "Scientific Figure AI turns a text brief, sketch or abstract into an illustration, flowchart or graphical abstract. Users review a proposed figure plan, generate the image, then adjust labels, arrows, colors and layout. The provider advertises PNG, JPG, SVG and PowerPoint exports with editable elements. Automated label checks do not establish scientific accuracy: researchers must verify structures, mechanisms and annotations, and follow their journal's disclosure and image policies. Free exports are watermarked; publication licensing depends on plan.",
  "category": "Research",
  "logo": "#2563eb",
  "logoInitials": "SF",
  "logoUrl": "/tool-logos/scientific-figure-ai.png",
  "rating": null,
  "pricing": "Signup and daily-check-in credits; paid subscriptions and packs; free exports watermarked",
  "pricingType": "freemium",
  "websiteUrl": "https://scientificfigureai.com/",
  "affiliateUrl": "https://scientificfigureai.com/",
  "featured": false,
  "pros": [
    "Plan review before generation",
    "Editable annotations and multiple export formats"
  ],
  "cons": [
    "Scientific accuracy requires expert verification",
    "Watermark removal and publication licensing depend on plan"
  ],
  "alternatives": []
},
{
  "slug": "jev-agent",
  "name": "Jev Agent (Jagent)",
  "tagline": "Structured text judgments through a hosted API and MCP server",
  "description": "Jev Agent, branded Jagent at jev-agent.com, is an independent service offering structured text judgments through REST and a hosted MCP endpoint. Its documented tools cover yes/no questions, choices, scoring, version comparison and essay, rubric or resume grading. Results include probabilities or scores rather than generated prose. The hosted service requires its own API key, separate from a TypeSafe first-party key, and states that it is not affiliated with TypeSafe AI. Model judgments can be wrong and should not replace human review in consequential decisions.",
  "category": "Developer Tools",
  "logo": "#2563eb",
  "logoInitials": "JA",
  "logoUrl": "/tool-logos/jev-agent.png",
  "rating": null,
  "pricing": "Free playground/key access advertised; hosted MCP usage billed in credits per input tokens",
  "pricingType": "freemium",
  "websiteUrl": "https://jev-agent.com/",
  "affiliateUrl": "https://jev-agent.com/",
  "featured": false,
  "pros": [
    "REST and hosted MCP integration",
    "Bounded judgments and grading outputs"
  ],
  "cons": [
    "Independent service with separate credentials and billing",
    "Confidence scores do not guarantee correct decisions"
  ],
  "alternatives": []
},
{
  "slug": "look-atlas",
  "name": "Look Atlas",
  "tagline": "Create on-model product images and editorial campaigns",
  "description": "Look Atlas helps apparel, jewelry and accessories brands turn product photos into AI-generated catalog and campaign imagery. Users upload products, select models and styling, and adjust backgrounds and camera direction. Reference images can guide product details, but generated stitching, logos, jewelry and fit still need checking against the real item. The provider offers a free first shoot and paid plans with differing credits, model access and human touch-up allowances. AIBeat has not independently verified fidelity, speed or conversion claims.",
  "category": "AI Image",
  "pricing": "Free first shoot; paid plans from $49/month; submission specifies 15 watermarked 2K trial images",
  "pricingType": "freemium",
  "websiteUrl": "https://lookatlas.com/",
  "pros": [
    "Product-reference and on-model image workflow",
    "Styling controls and plan-dependent human touch-ups"
  ],
  "cons": [
    "Generated product details require manual review",
    "Ongoing generation and advanced features require a paid plan"
  ],
  "logo": "#2563eb",
  "logoInitials": "LA",
  "logoUrl": "/tool-logos/look-atlas.png",
  "rating": null,
  "affiliateUrl": "https://lookatlas.com/",
  "featured": false,
  "alternatives": []
},
{
  "slug": "astrodir",
  "name": "AstroDir",
  "tagline": "Discover traditional and AI-assisted astrology resources",
  "description": "AstroDir is an English and Chinese discovery directory for astrology, tarot, BaZi, I Ching and related cultural resources. It organizes websites, apps, calculators and learning materials using categories and product notes, including an AI-tools section. AstroDir is a resource directory rather than an AI model or a personal-reading service. Browsing is free; promoted listings are a separate offering and linked products set their own prices. Its contents are best approached as cultural exploration, reflection or entertainment, not evidence-based predictions or professional advice.",
  "category": "Lifestyle",
  "pricing": "Free browsing; optional paid listing promotion; linked resources have separate prices",
  "pricingType": "free",
  "websiteUrl": "https://astrodir.com/",
  "pros": [
    "English and Chinese resource discovery",
    "Traditional and AI-assisted tools organized by topic"
  ],
  "cons": [
    "Linked products have separate terms and costs",
    "Directory inclusion does not validate predictive claims"
  ],
  "logo": "#2563eb",
  "logoInitials": "AD",
  "logoUrl": "/tool-logos/astrodir.png",
  "rating": null,
  "affiliateUrl": "https://astrodir.com/",
  "featured": false,
  "alternatives": []
},
{
  "slug": "topview-t1",
  "name": "Topview T1",
  "tagline": "Create AI videos and images in an independent web workspace",
  "description": "Topview T1 at topviewt1.org is an independent browser workspace for creating videos and images from prompts and reference images. The interface offers model selection, generation settings and credit quotes for short creative clips and social visuals. Model names, access and advertised output limits are provider claims and have not been independently verified by AIBeat; this listing does not imply affiliation with a model developer. Commercial-use permissions depend on the purchased plan.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "TT",
  "logoUrl": "/tool-logos/topview-t1.png",
  "rating": null,
  "pricing": "Paid credit plans and packs; a paid trial pack is offered",
  "pricingType": "paid",
  "websiteUrl": "https://topviewt1.org/",
  "affiliateUrl": "https://topviewt1.org/",
  "featured": false,
  "pros": [
    "Prompt and reference-image creation",
    "Credit quotes before generation"
  ],
  "cons": [
    "Generation requires purchased credits",
    "Model availability and commercial-use terms vary"
  ],
  "alternatives": []
},
{
  "slug": "shapeweld",
  "name": "Shapeweld",
  "tagline": "Convert, inspect and repair 3D assets with browser tools",
  "description": "Shapeweld provides browser-accessible converters, viewers and mesh utilities for formats including FBX, GLB, OBJ, STL, VRM and USDZ. It supports tasks such as compression, mesh repair and preparing avatars, with MCP access advertised for AI-agent workflows. These are 3D utilities, not a generative 3D model. Viewers run locally; conversions upload files to its server, with deletion after three days stated by the provider. Format limitations can prevent some textures, rigs or animation from carrying over.",
  "category": "Developer Tools",
  "logo": "#2563eb",
  "logoInitials": "S",
  "logoUrl": "/tool-logos/shapeweld.png",
  "rating": null,
  "pricing": "Free browser tools with no account; upload and format limits apply",
  "pricingType": "free",
  "websiteUrl": "https://shapeweld.com/",
  "affiliateUrl": "https://shapeweld.com/",
  "featured": false,
  "pros": [
    "Multiple conversion and inspection tools",
    "Local viewers and advertised MCP integration"
  ],
  "cons": [
    "Conversions upload files to a server",
    "Not every target format preserves all model features"
  ],
  "alternatives": []
},
{
  "slug": "vocal-remover-ai",
  "name": "Vocal Remover AI",
  "tagline": "Separate audio into vocal and instrumental tracks",
  "description": "Vocal Remover AI at vocalremove.net separates an uploaded recording into vocal and instrumental tracks for preview and download. It accepts common audio formats up to 50 MB or a direct public audio URL, and displays processing-time costs before separation. The site identifies WaveSpeed as its processing provider. It can help with rehearsal, transcription preparation and permitted remix work, but results may contain bleed or artifacts. Users need appropriate rights to use and share source recordings.",
  "category": "AI Audio",
  "logo": "#2563eb",
  "logoInitials": "VR",
  "logoUrl": "/tool-logos/vocal-remover-ai.png",
  "rating": null,
  "pricing": "One-time free trial; monthly plans from $9.99 and one-time packs",
  "pricingType": "freemium",
  "websiteUrl": "https://vocalremove.net/",
  "affiliateUrl": "https://vocalremove.net/",
  "featured": false,
  "pros": [
    "Two-track preview and download",
    "File upload or public audio URL"
  ],
  "cons": [
    "Ongoing processing is paid",
    "Separation quality depends on the source recording"
  ],
  "alternatives": []
},
{
  "slug": "contentrocket",
  "name": "ContentRocket",
  "tagline": "AI-assisted content marketing with human review and approval",
  "description": "ContentRocket is a managed content marketing service from Brixxs that combines AI assistance with human editorial review. Customers provide topics and expertise, review drafts through an app, and approve content before agreed publication. Monthly packages combine blogs, videos and short social clips. It is a delivered service rather than a free self-service generator. Search indexing requests may be included, but rankings, AI citations, traffic and new customers are not guaranteed.",
  "category": "Marketing",
  "logo": "#2563eb",
  "logoInitials": "C",
  "logoUrl": "/tool-logos/contentrocket.png",
  "rating": null,
  "pricing": "Packages from EUR 129/month excluding VAT; monthly cancellation",
  "pricingType": "paid",
  "websiteUrl": "https://contentrocket.io/en/",
  "affiliateUrl": "https://contentrocket.io/en/",
  "featured": false,
  "pros": [
    "Human review and client approval",
    "Coordinated blog, video and short-form content"
  ],
  "cons": [
    "Recurring service cost excluding VAT",
    "Scope and publishing channels depend on the agreement"
  ],
  "alternatives": []
},
{
  "slug": "paevon-ai",
  "name": "Paevon AI",
  "tagline": "Generate images and videos from prompts and references",
  "description": "Paevon AI brings image and video generation into one browser workspace. Users choose an available model, add prompts or references, inspect the credit quote, then preview, download or reuse the inputs of a creation. The provider advertises welcome credits for eligible new accounts and daily check-in credits, with paid subscriptions and packs for additional usage. Free creations are public by default and free exports include a watermark; privacy and watermark controls require eligible paid access. AIBeat has not independently verified the underlying model identities or advertised performance.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "PA",
  "logoUrl": "/tool-logos/paevon-ai.png",
  "rating": null,
  "pricing": "Eligible signup and daily check-in credits; paid subscriptions from $19.99/month and credit packs",
  "pricingType": "freemium",
  "websiteUrl": "https://paevon.com/",
  "affiliateUrl": "https://paevon.com/",
  "featured": false,
  "pros": [
    "Image and video creation in one workspace",
    "Visible credit quotes and reusable inputs"
  ],
  "cons": [
    "Free creations are public and exports watermarked",
    "Model settings and generation costs vary"
  ],
  "alternatives": []
},
{
  "slug": "token-thrift",
  "name": "Token Thrift",
  "tagline": "Compare AI rollout experiences, tool deals and startup credits",
  "description": "Token Thrift is an AI adoption research and community resource with practitioner discussions, source-linked summaries, tool deals and startup credit guides. Its Ask feature uses random handles and model-assisted redaction to reduce identifying details, which is not a guarantee of anonymity. Readers can browse without signup and optionally receive a weekly briefing. The provider checks offers against vendor pages, but eligibility and terms still need confirmation with each vendor. Some links earn affiliate commissions and separate paid resources are offered.",
  "category": "Research",
  "logo": "#2563eb",
  "logoInitials": "TT",
  "logoUrl": "/tool-logos/token-thrift.png",
  "rating": null,
  "pricing": "Free public reading, deals and optional newsletter; paid Startup Credits Kit available",
  "pricingType": "freemium",
  "websiteUrl": "https://tokenthrift.io/",
  "affiliateUrl": "https://tokenthrift.io/",
  "featured": false,
  "pros": [
    "Source-linked AI adoption resources",
    "Deals and startup credit eligibility guides"
  ],
  "cons": [
    "Automated redaction cannot guarantee anonymity",
    "Offer terms change and some links are affiliate links"
  ],
  "alternatives": []
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "seedance-3",
  "name": "Seedance 3.0 (tryseedance3.com)",
  "tagline": "Browser-based video generation from prompts and references",
  "description": "tryseedance3.com is a video-generation website branded Seedance 3.0. Its site advertises text, image, video and audio references, short clips with sound, and prompt-based edits. At review, the embedded generator displayed Seedance 2.5 despite the page branding. Model identity, advertised duration and resolution limits, and any affiliation with the model developer have not been independently verified by AIBeat. Review the active model, credit cost and output before using it in a project.",
  "category": "AI Video",
  "logoInitials": "S3",
  "pricing": "Advertised signup credits; paid plans or packs; commercial-use terms depend on plan",
  "pricingType": "freemium",
  "websiteUrl": "https://tryseedance3.com/",
  "pros": [
    "Prompt and reference-based video workflow",
    "Browser preview and download interface"
  ],
  "cons": [
    "Page branding and embedded model label differ",
    "Advertised capabilities and model access are not independently verified"
  ],
  "logoUrl": "/tool-logos/seedance-3.png",
  "affiliateUrl": "https://tryseedance3.com/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "seedance-2-5",
  "name": "Seedance 2.5 (seedance-2-5.io)",
  "tagline": "Create short videos using prompts and multimedia references",
  "description": "seedance-2-5.io is a browser-based video-generation service marketed under the Seedance 2.5 name. Users enter prompts, add references, choose duration, aspect ratio and resolution, then preview and download results. The provider advertises clips up to 30 seconds, output up to 1080p, synced audio and prompt-based editing. These are vendor claims; AIBeat has not independently verified the underlying model, maximum limits or affiliation with the model developer.",
  "category": "AI Video",
  "logoInitials": "S2",
  "pricing": "Advertised signup credits; paid packs or subscriptions for more usage and commercial-use terms",
  "pricingType": "freemium",
  "websiteUrl": "https://seedance-2-5.io/",
  "pros": [
    "Reference-based video creation interface",
    "Aspect-ratio and resolution controls"
  ],
  "cons": [
    "Credits and plan conditions apply",
    "Model identity and advertised performance are not independently verified"
  ],
  "logoUrl": "/tool-logos/seedance-2-5.png",
  "affiliateUrl": "https://seedance-2-5.io/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "cantian-ai",
  "name": "Cantian AI",
  "tagline": "Explore BaZi, divination and naming traditions with AI",
  "description": "Cantian AI offers AI-assisted BaZi chart interpretations, Liuyao divination, feng shui and naming features through web and mobile experiences. It combines traditional Chinese cultural frameworks with generated readings and reports. AIBeat lists it for cultural exploration, reflection and entertainment, not as an evidence-based prediction or productivity system. Readings should not be treated as factual forecasts or used in place of qualified financial, medical or other professional advice.",
  "category": "Lifestyle",
  "logoInitials": "CA",
  "pricing": "Free basic experience; paid deeper reports and additional AI skills",
  "pricingType": "freemium",
  "websiteUrl": "https://cantian.ai/",
  "pros": [
    "Several traditional reading and naming formats",
    "Web and mobile access with a basic free experience"
  ],
  "cons": [
    "Interpretations are not scientifically established forecasts",
    "Deeper reports and features require payment"
  ],
  "logoUrl": "/tool-logos/cantian-ai.png",
  "affiliateUrl": "https://cantian.ai/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "sandbase",
  "name": "SandBase",
  "tagline": "Connect AI models, data APIs and agent sandboxes through one account",
  "description": "SandBase is a developer platform for accessing AI models, data APIs, agent workflows and code sandboxes through one account and API key. It advertises OpenAI-compatible agent interfaces and E2B-compatible sandboxes, with a shared balance and usage records. Eligible data APIs have a daily free allowance and sandboxes are currently free subject to fair-use limits. Model and API calls use metered pricing; confirm provider availability, compatibility and data handling before integration.",
  "category": "Developer Tools",
  "logoInitials": "SB",
  "pricing": "Starter credits and eligible free API calls; metered model/API usage; sandbox fair-use limits apply",
  "pricingType": "freemium",
  "websiteUrl": "https://www.sandbase.ai",
  "pros": [
    "Unified model, API and sandbox access",
    "Usage-based billing and activity records"
  ],
  "cons": [
    "Compatibility and provider coverage need integration testing",
    "Third-party processing and per-call costs vary"
  ],
  "logoUrl": "/tool-logos/sandbase.png",
  "affiliateUrl": "https://www.sandbase.ai"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "stylelatex",
  "name": "styleLatex",
  "tagline": "Convert documents, images and handwritten notes into editable LaTeX",
  "description": "styleLatex uses AI to convert PDFs, photos, screenshots, handwriting and Word documents into editable LaTeX. The service compiles generated pages with XeLaTeX and attempts repairs from compiler errors, then provides source editing and a PDF preview. Exports include LaTeX, PDF, Word and extracted figures. Free utilities cover tables and several markup conversions; AI page conversion uses credits. Compilation does not establish transcription accuracy, so review equations and layout against the original.",
  "category": "Education",
  "logoInitials": "SL",
  "pricing": "Free format-conversion utilities; AI document/page conversion uses credits",
  "pricingType": "freemium",
  "websiteUrl": "https://stylelatex.com/",
  "pros": [
    "Editable source with compiled preview",
    "Document exports and extracted figures"
  ],
  "cons": [
    "Equations and handwriting require source comparison",
    "Some document elements and complex layouts may not carry over"
  ],
  "logoUrl": "/tool-logos/stylelatex.png",
  "affiliateUrl": "https://stylelatex.com/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "image-to-calendar",
  "name": "Image to Calendar",
  "tagline": "Turn schedule images and PDFs into editable calendar events",
  "description": "Image to Calendar extracts event details from schedule photos, screenshots, flyers and PDFs. Review titles, dates, times, timezones, locations and recurrence before downloading an ICS file for Google Calendar, Apple Calendar or Outlook. It does not connect to your calendar or import events automatically. Uploaded content is sent to external AI processors; extraction can be incomplete or incorrect, so check every event before importing.",
  "category": "Productivity",
  "logoInitials": "IC",
  "pricing": "One guest conversion and two signup credits; one-time packs for additional conversions",
  "pricingType": "freemium",
  "websiteUrl": "https://imagetocalendar.app/",
  "pros": [
    "Editable events before export",
    "Standard ICS output for common calendar apps"
  ],
  "cons": [
    "External AI processing of uploaded schedules",
    "Dates, timezones and repeat rules require review"
  ],
  "logoUrl": "/tool-logos/image-to-calendar.png",
  "affiliateUrl": "https://imagetocalendar.app/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "remove-music-from-video",
  "name": "Remove Music From Video",
  "tagline": "Separate voices from video soundtracks and export cleaned clips",
  "description": "Remove Music From Video separates speech, singing or narration from background audio in MP4, MOV and WebM files up to 500 MB and 30 minutes. The browser extracts audio and later reassembles the clip; audio and selected still frames are uploaded for processing and checks. Compare the result and download a voice-only video or separate tracks. Nonvoice sound effects may also be removed, separation can leave artifacts, and removing music does not grant rights to the footage.",
  "category": "AI Audio",
  "logoInitials": "RM",
  "pricing": "Minute-based credits; paid packs from $4.99 and subscriptions; trial availability is limited",
  "pricingType": "freemium",
  "websiteUrl": "https://removemusicfromvideo.com/?utm_source=aibeat.dev&utm_medium=referral&utm_campaign=directory",
  "pros": [
    "Exports cleaned video and separate audio tracks",
    "Before-and-after playback comparison"
  ],
  "cons": [
    "Removes nonvoice effects as well as music",
    "Audio and still frames leave the device; separation quality varies"
  ],
  "logoUrl": "/tool-logos/remove-music-from-video.png",
  "affiliateUrl": "https://removemusicfromvideo.com/?utm_source=aibeat.dev&utm_medium=referral&utm_campaign=directory"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "image-to-image",
  "name": "Image to Image",
  "tagline": "Edit photos with text instructions and reference images",
  "description": "Image to Image is a prompt-based photo editor for restyling portraits, changing backgrounds and creating product scenes. Upload JPG, PNG or WebP files, add up to three references and choose a processing mode, then compare and download the result or edit it again. The service aims to preserve the subject and composition, but generated details, text and likeness can change. Review outputs against the original before publishing.",
  "category": "AI Image",
  "logoInitials": "II",
  "pricing": "Two signup credits while the daily allowance lasts; paid subscriptions or credit packs",
  "pricingType": "freemium",
  "websiteUrl": "https://imagetoimage.tools/?utm_source=aibeat.dev&utm_medium=referral&utm_campaign=directory",
  "pros": [
    "Prompt templates and multiple reference images",
    "Iterative editing with before-and-after comparison"
  ],
  "cons": [
    "Edits consume credits based on mode",
    "Subject identity, product detail and text may change"
  ],
  "logoUrl": "/tool-logos/image-to-image.png",
  "affiliateUrl": "https://imagetoimage.tools/?utm_source=aibeat.dev&utm_medium=referral&utm_campaign=directory"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "twitch-emote-maker",
  "name": "Twitch Emote Maker",
  "tagline": "Create static and animated emotes with chat-size previews",
  "description": "Twitch Emote Maker, branded Emote Studio, generates static PNG emotes from text or permitted reference images and animates character images into GIFs. Choose a style, inspect previews at 112, 56 and 28 pixels, and download the original plus resized files in a ZIP. It creates files without connecting to Twitch or uploading them. Review transparency, animation, file requirements and content rights; platform acceptance is not guaranteed.",
  "category": "AI Image",
  "logoInitials": "TE",
  "pricing": "30 signup credits for one static emote; GIFs cost 80 credits; packs from $5.99",
  "pricingType": "freemium",
  "websiteUrl": "https://twitchemotemaker.app/",
  "pros": [
    "Static PNG and animated GIF creation",
    "Small-size previews and resized download bundles"
  ],
  "cons": [
    "Animation exceeds the free signup allowance",
    "No automatic upload or guarantee of Twitch approval"
  ],
  "logoUrl": "/tool-logos/twitch-emote-maker.png",
  "affiliateUrl": "https://twitchemotemaker.app/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "pixtale-growth",
  "name": "Pixtale Growth",
  "tagline": "Analyze Instagram and YouTube accounts and research reels",
  "description": "Pixtale Growth provides public-account analytics for Instagram and YouTube, including engagement, top content, audience-quality estimates and reel research. Paid plans add AI explanations, content ideas, competitor comparisons and reports; agency features include client workspaces and white-label exports. Audience scores and recommendations are estimates from available data, not guarantees of follower authenticity or growth.",
  "category": "Marketing",
  "logoInitials": "PG",
  "pricing": "Free limited analytics; paid subscriptions and one-time reports",
  "pricingType": "freemium",
  "websiteUrl": "https://thepixtale.com/",
  "pros": [
    "Instagram and YouTube analysis in one workspace",
    "Reel research and plan-dependent reporting tools"
  ],
  "cons": [
    "Analysis limits and features depend on plan",
    "Audience-quality and growth suggestions require judgment"
  ],
  "logoUrl": "/tool-logos/pixtale-growth.png",
  "affiliateUrl": "https://thepixtale.com/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "image26",
  "name": "Image26",
  "tagline": "Generate and edit images from prompts and reference photos",
  "description": "Image26 is an independent image-generation and photo-editing service for posters, logos, infographics, covers and other visuals. Users enter a brief, upload references or mark an area to edit, with advertised output options up to 4K plus GIF and SVG generation. The site markets GPT Image 2.6 access through third-party platforms; model identity and performance are vendor claims, not independently verified by AIBeat or evidence of OpenAI affiliation.",
  "category": "AI Image",
  "logoInitials": "I",
  "pricing": "New-account trial credits; paid plans or credit packs for continued use",
  "pricingType": "freemium",
  "websiteUrl": "https://image26.ai/",
  "pros": [
    "Prompt and reference-image workflows",
    "Advertised marked-area editing and multiple output formats"
  ],
  "cons": [
    "Generation consumes credits",
    "Model branding and output accuracy are not independently verified"
  ],
  "logoUrl": "/tool-logos/image26.png",
  "affiliateUrl": "https://image26.ai/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "oldroll",
  "name": "OldRoll",
  "tagline": "Edit photos with vintage camera looks and film-inspired effects",
  "description": "OldRoll Web is a browser-based photo editor with retro looks such as film, digicam, Y2K, VHS and instant-print effects. Users adjust light, color and effect strength, crop photographs, add frames or stickers and build collages before downloading. The web editor focuses on styling existing photos and is offered free; it is distinct from the mobile app and does not require an app installation.",
  "category": "Design",
  "logoInitials": "OR",
  "pricing": "Free web editor and available creative assets; mobile app terms may differ",
  "pricingType": "free",
  "websiteUrl": "https://www.oldroll.io/",
  "pros": [
    "Retro filters with manual adjustment controls",
    "Browser editing, frames and collage layouts"
  ],
  "cons": [
    "Focused on editing existing photos rather than generating new images",
    "Filter results depend on the source photo and settings"
  ],
  "logoUrl": "/tool-logos/oldroll.png",
  "affiliateUrl": "https://www.oldroll.io/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "prettyup",
  "name": "PrettyUp",
  "tagline": "Retouch portraits and adjust looks in photos and videos",
  "description": "PrettyUp offers online photo and video editing with face and body adjustments, skin retouching and makeup controls. Additional AI tools change clothing, expressions and portrait lighting. Users can adjust effect strength and preview edits before export. The site offers free web editing and daily AI credits after sign-in; AI usage limits and mobile subscriptions are separate considerations. Review generated details and video consistency before sharing.",
  "category": "Design",
  "logoInitials": "PU",
  "pricing": "Free web editing; sign-in for daily AI credits; mobile paid options vary",
  "pricingType": "freemium",
  "websiteUrl": "https://www.prettyupapp.com/",
  "pros": [
    "Photo and video portrait editing",
    "Adjustable effects with outfit and expression tools"
  ],
  "cons": [
    "AI features require credits and account access",
    "Retouching and generated edits can alter likeness or introduce artifacts"
  ],
  "logoUrl": "/tool-logos/prettyup.png",
  "affiliateUrl": "https://www.prettyupapp.com/"
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "tiny-desk-ai",
  "name": "Tiny Desk AI",
  "tagline": "Turn photos into short AI desk-concert videos",
  "description": "Tiny Desk AI creates 15-second desk-concert videos from one to five photos, with a small band and generated music. Seven templates cover solo performers, duos, groups and cats, with 720p MP4 downloads in vertical or widescreen format. Use permitted photos of consenting adults and label shared output as AI-generated. It is independent of NPR, Tiny Desk Concerts and artists; generated likeness and results can vary.",
  "category": "AI Video",
  "logoInitials": "TD",
  "logoUrl": "/tool-logos/tiny-desk-ai.png",
  "pricing": "Paid one-time credit packs from $9.99; one credit per video",
  "pricingType": "paid",
  "websiteUrl": "https://tinydeskai.co/",
  "affiliateUrl": "https://tinydeskai.co/",
  "pros": [
    "Seven performance templates with generated music",
    "Vertical and widescreen MP4 downloads"
  ],
  "cons": [
    "Fixed 15-second duration and 720p output",
    "Paid generation; photo permissions and likeness limitations apply"
  ]
},
{
  "logo": "#2563eb",
  "rating": null,
  "featured": false,
  "alternatives": [],
  "slug": "askmed",
  "name": "AskMed",
  "tagline": "Explore medical questions with cited sources",
  "description": "AskMed is an educational medical research and reference assistant for healthcare professionals, students and researchers. It provides answers with references to journals, clinical guidelines and official drug labels, with source filters and follow-up questions. The service is available on web and mobile in seven languages. AI answers and citations can contain errors or outdated information; check original sources and apply professional judgment rather than treating output as a clinical decision.",
  "category": "Research",
  "logoInitials": "AM",
  "logoUrl": "/tool-logos/askmed.png",
  "pricing": "Paid subscription; submitted pricing starts at $24.99/month, subject to platform and plan",
  "pricingType": "paid",
  "websiteUrl": "https://getaskmed.com",
  "affiliateUrl": "https://getaskmed.com",
  "pros": [
    "References to journals, guidelines and drug labels",
    "Source filters and follow-up questions"
  ],
  "cons": [
    "Answers and citations require independent verification",
    "Paid subscription; not a substitute for clinical supervision"
  ]
},
{
  "slug": "ai-calculators",
  "name": "AI Calculators",
  "tagline": "Estimate AI costs, token budgets, hardware needs and ROI",
  "description": "AI Calculators is a free collection of browser-based planning tools for AI engineers, founders and business teams. It covers LLM API costs, prompt caching savings, RAG token budgets, VRAM sizing, automation ROI and image, audio and video generation costs. Calculators provide formulas, worked examples and editable rates. Results are estimates rather than provider quotes; check current vendor pricing and workload assumptions before making spending decisions.",
  "category": "Productivity",
  "logo": "#2563eb",
  "logoInitials": "AC",
  "logoUrl": "/tool-logos/ai-calculators.png",
  "rating": null,
  "pricing": "Free browser-based calculators",
  "pricingType": "free",
  "websiteUrl": "https://aicalculators.xyz/",
  "affiliateUrl": "https://aicalculators.xyz/",
  "featured": false,
  "pros": [
    "Editable rates with formulas and worked examples",
    "Covers technical AI budgets and business cost planning"
  ],
  "cons": [
    "Default rates may differ from current provider pricing",
    "Estimates depend on workload and usage assumptions"
  ],
  "alternatives": []
},
{
  "slug": "myenhancer",
  "name": "MyEnhancer",
  "tagline": "Enhance, upscale, restore and colorize photos",
  "description": "MyEnhancer is an online photo toolkit for improving clarity, reducing noise, adjusting lighting and color, upscaling, restoration and colorization. Users compare results with the original and download PNG, JPG or WebP. Eligible single-image Standard tasks can use daily credits; Pro and batch operations require paid credits. Images are sent to external processing services, and generated detail should be checked against the original.",
  "category": "AI Image",
  "logo": "#2563eb",
  "logoInitials": "M",
  "logoUrl": "/tool-logos/myenhancer.png",
  "rating": null,
  "pricing": "Daily credits for eligible Standard tasks; paid credits for Pro and batches",
  "pricingType": "freemium",
  "websiteUrl": "https://myenhancer.com",
  "affiliateUrl": "https://myenhancer.com",
  "featured": false,
  "pros": [
    "Before-and-after comparison",
    "Multiple photo restoration and enhancement tools"
  ],
  "cons": [
    "AI can alter fine details",
    "External processing and service limits apply"
  ],
  "alternatives": []
},
{
  "slug": "image2-5",
  "name": "Image2.5",
  "tagline": "Generate and edit images with prompts and reference photos",
  "description": "Image2.5 is an independent image creation and editing service. Users describe an image, upload references, combine images or select a region for edits. The site advertises multiple processing modes and high-resolution output. Its advertised model branding is a vendor claim, not an independently verified model identity or OpenAI affiliation.",
  "category": "AI Image",
  "logo": "#2563eb",
  "logoInitials": "I",
  "logoUrl": "/tool-logos/image2-5.png",
  "rating": null,
  "pricing": "New accounts receive trial credits; continued generation uses paid plan credits",
  "pricingType": "freemium",
  "websiteUrl": "https://image2-5.io/",
  "affiliateUrl": "https://image2-5.io/",
  "featured": false,
  "pros": [
    "Prompt-based image creation and editing",
    "Reference blending and selected-area edits"
  ],
  "cons": [
    "Credits and plan limits apply",
    "Model identity and output quality are not independently verified"
  ],
  "alternatives": []
},
{
  "slug": "british-accent-generator",
  "name": "British Accent Generator",
  "tagline": "Create UK English speech with regional voice previews",
  "description": "British Accent Generator is a text-to-speech workspace with a regionally labelled voice library, including RP, Scottish, Welsh and Northern Irish options. Users preview voices, enter a script, generate speech and review the audio before downloading. The site advertises 315 voices; availability and script limits depend on the plan.",
  "category": "AI Audio",
  "logo": "#2563eb",
  "logoInitials": "BA",
  "logoUrl": "/tool-logos/british-accent-generator.png",
  "rating": null,
  "pricing": "Free daily credits with short-script limits; paid plans for higher usage",
  "pricingType": "freemium",
  "websiteUrl": "https://britishaccent.pro/",
  "affiliateUrl": "https://britishaccent.pro/",
  "featured": false,
  "pros": [
    "Regional voice previews",
    "Generate and download speech from scripts"
  ],
  "cons": [
    "Free scripts are limited to 100 characters",
    "Accent quality should be reviewed for the intended use"
  ],
  "alternatives": []
},
{
  "slug": "riffwise",
  "demoUrl": "https://riffwise.app/#demo",
  "demoDescription": "Maker-provided X workflow demo. Music only, without narration; it does not demonstrate the other supported platforms or establish measured performance.",
  "chromeWebStoreUrl": "https://chromewebstore.google.com/detail/riffwise-%E2%80%94-ai-reply-gener/nmnmflphiibhdnnbghffjhclhlehelle?utm_source=aibeat&utm_medium=directory&utm_campaign=riffwise_202611&utm_content=install_button",
  "name": "Riffwise",
  "tagline": "Draft replies from the conversation open in desktop Chrome",
  "description": "Riffwise is a desktop Chrome extension that drafts replies and quote text for supported social platforms and Gmail. It uses relevant conversation context and writing preferences, then lets the user review, edit, insert or copy the draft. It does not automatically post or send messages. An account is required, and selected writing-request context is sent for AI processing.",
  "category": "Productivity",
  "logo": "#2563eb",
  "logoInitials": "R",
  "logoUrl": "/tool-logos/riffwise.png",
  "rating": null,
  "pricing": "Free: 40 successful generations per month; Pro offers higher limits",
  "pricingType": "freemium",
  "websiteUrl": "https://riffwise.app",
  "affiliateUrl": "https://riffwise.app",
  "featured": false,
  "pros": [
    "User reviews every draft before sending",
    "Tone and reply-length preferences"
  ],
  "cons": [
    "Desktop Chrome and an account required",
    "Conversation context is sent for processing"
  ],
  "alternatives": []
},
{
  "slug": "nyan-parlor",
  "name": "Nyan Parlor",
  "tagline": "Explore AI interpretations of Tarot, I Ching and BaZi",
  "description": "Nyan Parlor offers AI interpretations of Tarot cards, I Ching hexagrams and BaZi charts, with follow-up conversation through its Geumeum character. It supports multilingual readings and free introductory content. These readings are for entertainment and personal reflection, not reliable predictions or professional advice.",
  "category": "Other",
  "logo": "#2563eb",
  "logoInitials": "NP",
  "logoUrl": "/tool-logos/nyan-parlor.png",
  "rating": null,
  "pricing": "Free introductory readings and meanings; paid packs for additional access",
  "pricingType": "freemium",
  "websiteUrl": "https://www.tarotoper.com/en",
  "affiliateUrl": "https://www.tarotoper.com/en",
  "featured": false,
  "pros": [
    "Several divination traditions in one interface",
    "Follow-up conversation and multilingual support"
  ],
  "cons": [
    "Interpretations are not factual predictions",
    "Extended access requires paid packs"
  ],
  "alternatives": []
},
{
  "slug": "ai-music-mastering",
  "name": "AI Music Mastering",
  "tagline": "Preview automated mastering for finished mixes and AI-generated songs",
  "description": "AI Music Mastering processes finished audio with eight sound profiles, intensity and EQ controls, and original-versus-mastered comparison. It accepts WAV, MP3, FLAC and AIFF. The vendor explicitly describes preset-based digital signal processing rather than a trained AI mastering model; AI refers to the source music. Membership unlocks downloads and reference-track matching.",
  "category": "AI Audio",
  "logo": "#2563eb",
  "logoInitials": "AM",
  "logoUrl": "/tool-logos/ai-music-mastering.png",
  "rating": null,
  "pricing": "Free previews; membership $9.90/month for downloads and reference matching",
  "pricingType": "freemium",
  "websiteUrl": "https://aimusicmastering.app/",
  "affiliateUrl": "https://aimusicmastering.app/",
  "featured": false,
  "pros": [
    "Free original-versus-mastered preview",
    "Eight profiles with intensity and EQ controls"
  ],
  "cons": [
    "Downloads require membership",
    "Cannot reliably repair severe generation artifacts"
  ],
  "alternatives": []
},
{
  "slug": "book-cover-generator",
  "name": "Book Cover Generator",
  "tagline": "Explore book cover directions from your title, genre and story",
  "description": "Book Cover Generator helps authors develop cover concepts from a title, author name, genre and story summary. Users compare two visual directions, refine typography or composition through written instructions and export front-cover, ebook or audiobook formats. Generated covers still need review for text accuracy, genre fit and publishing specifications.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "BC",
  "logoUrl": "/tool-logos/book-cover-generator.png",
  "rating": null,
  "pricing": "One-time credit packs; no subscription; check current free-credit availability",
  "pricingType": "paid",
  "websiteUrl": "https://bookcovergenerator.net/",
  "affiliateUrl": "https://bookcovergenerator.net/",
  "featured": false,
  "pros": [
    "Story-led cover concepts",
    "Written revisions and multiple export formats"
  ],
  "cons": [
    "Generation consumes credits",
    "Front-cover exports are not complete print wraparound layouts"
  ],
  "alternatives": []
},
{
  "slug": "seamlessify",
  "name": "Seamlessify",
  "tagline": "Create repeating patterns with local seam blending and optional AI generation",
  "description": "Seamlessify turns images into repeating patterns and tileable textures. Its browser workspace supports edge blending, repeat previews, cropping and batch exports in PNG, JPG or ZIP format. Direct image processing runs locally without signup. Optional AI generation uses prompts or reference images and consumes credits. Detailed lettering, faces and geometric edges may still need manual editing.",
  "category": "Design",
  "logo": "#2563eb",
  "logoInitials": "SE",
  "logoUrl": "/tool-logos/seamlessify.png",
  "rating": null,
  "pricing": "Free local stitching; 2 one-time AI credits after email verification; paid AI credit plans",
  "pricingType": "freemium",
  "websiteUrl": "https://seamlessify.com/",
  "affiliateUrl": "https://seamlessify.com/",
  "featured": false,
  "pros": [
    "Local image processing without signup",
    "Repeat previews and adjustable edge blending",
    "Batch export for pattern workflows"
  ],
  "cons": [
    "AI generation requires credits and an account",
    "Complex edges may need manual editing",
    "Generated images are retained for 30 days"
  ],
  "alternatives": []
},
{
  "slug": "inwista",
  "name": "Inwista",
  "tagline": "Create multilingual subtitles and edit video through transcripts",
  "description": "Inwista creates transcripts with speaker labels and subtitles from audio or video files. Users can import cloud files, style captions, translate into more than 70 languages and edit video through transcript text. The workspace also offers summaries, chapters and shared projects. Exports include subtitle files, documents and captioned video, with an Adobe Premiere integration for editing workflows.",
  "category": "Productivity",
  "logo": "#2563eb",
  "logoInitials": "IN",
  "logoUrl": "/tool-logos/inwista.png",
  "rating": null,
  "pricing": "Free plan includes 45 minutes per month; paid subscriptions for additional usage",
  "pricingType": "freemium",
  "websiteUrl": "https://inwista.ai",
  "affiliateUrl": "https://inwista.ai",
  "featured": false,
  "pros": [
    "Speaker labels and multilingual subtitles",
    "Transcript-based video editing",
    "Cloud imports and subtitle export workflows"
  ],
  "cons": [
    "Automatic transcripts and translations need review",
    "Free usage is capped at 45 minutes per month",
    "Advanced usage depends on subscription limits"
  ],
  "alternatives": []
},
{
  "slug": "airapvideo1",
  "name": "AirapVideo1",
  "tagline": "Turn photos and lyrics into short AI rap duets",
  "description": "AirapVideo1 generates short rap performances from uploaded photos, with AI-created vocals and music. Users choose cat, human or robot duet scenes and supply lyrics or let the system write a verse. The public creation form offers 15-second clips, resolution settings and portrait or landscape formats. Generation consumes credits, with costs shown before submission and credits returned for failed renders.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "AI",
  "logoUrl": "/tool-logos/airapvideo1.png",
  "rating": null,
  "pricing": "Credit-based generation; cost depends on selected settings and is shown before generation",
  "pricingType": "paid",
  "websiteUrl": "https://airapvideo1.com",
  "affiliateUrl": "https://airapvideo1.com",
  "featured": false,
  "pros": [
    "Photo-based duet scenes",
    "Custom lyrics or AI-written verses",
    "AI vocals and music in a short video"
  ],
  "cons": [
    "Generation requires credits",
    "Results and lyric delivery can vary",
    "Users need permission for uploaded photos and lyrics"
  ],
  "alternatives": []
},
{
  "slug": "ai-compare-ninja",
  "name": "AI Compare Ninja",
  "tagline": "Compare AI tools, explore prompts and estimate AI costs",
  "description": "AI Compare Ninja is a free research directory for comparing AI tools, vendor-sourced prices and usage limits. It offers side-by-side comparisons, reusable prompts, skill templates and agent guides, plus subscription and API cost calculators. Results are organized by task match or browsing preferences rather than a quality ranking. Prices can vary by region and promotion, so users should confirm current terms with the original provider.",
  "category": "Research",
  "logo": "#2563eb",
  "logoInitials": "AN",
  "logoUrl": "/tool-logos/ai-compare-ninja.png",
  "rating": null,
  "pricing": "Free browsing, prompts, skills and cost calculators; third-party AI services have their own pricing",
  "pricingType": "free",
  "websiteUrl": "https://www.aicompare.ninja/en/",
  "affiliateUrl": "https://www.aicompare.ninja/en/",
  "featured": false,
  "pros": [
    "Vendor sources and check dates for pricing information",
    "Reusable prompts, skills and agent guides",
    "Subscription and API cost estimation"
  ],
  "cons": [
    "Vendor pricing and limits can change",
    "Comparisons are not hands-on quality ratings",
    "Third-party tools may require separate paid accounts"
  ],
  "alternatives": []
},
{
  "slug": "hypemigo",
  "name": "HypeMigo",
  "tagline": "Turn photos into short AI meme, dance and pet videos",
  "description": "HypeMigo lets users choose a trend template, add photos for the required roles and generate a short video without writing a prompt. Its templates include dance, duo, comedy and pet scenes, with portrait or landscape output. Browsing and local drafts are free; generation requires sign-in and 20 eligible credits per video at 480p or 720p. Download the completed MP4 with template-specific audio. Results are newly generated scenes rather than exact reproductions of the reference choreography or music.",
  "category": "AI Video",
  "logo": "#2563eb",
  "logoInitials": "HY",
  "logoUrl": "/tool-logos/hypemigo.png",
  "rating": null,
  "pricing": "Free browsing and local drafts; one-time packs from $8.90; 20 credits per generated video",
  "pricingType": "freemium",
  "websiteUrl": "https://hypemigo.com/",
  "affiliateUrl": "https://hypemigo.com/",
  "featured": false,
  "pros": [
    "Photo-based templates for people and pets",
    "480p or 720p MP4 downloads",
    "One-time packs without automatic renewal"
  ],
  "cons": [
    "Generation requires paid credits and sign-in",
    "Results can differ from reference scenes and audio",
    "Local drafts remain on the current browser and device"
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
