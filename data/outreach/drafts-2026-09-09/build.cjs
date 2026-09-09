const fs = require('fs');
const path = require('path');
const rows = `phaserr.com|hello@phaserr.com|BetaList|Phaserr|Your AI-assisted training-block builder gives strength coaches a concrete alternative to managing athlete programs in spreadsheets. A coaching-workflow feature could show that transition clearly.
proofavo.com|support@proofavo.com|BetaList|Proofavo|Your account-free client review flow and version-specific approval records offer a practical story for small studios managing design feedback.|fit
stashkit.co|hello@stashkit.com|BetaList|Stashkit|Being able to change a printed QR code's destination gives Stashkit a clear use case for businesses updating campaigns without reprinting their materials.|fit
checktheleak.com|contact@checktheleak.com|BetaList|CheckTheLeak||unknown
bylio.io|hello@bylio.io|BetaList|Bylio|Bylio's expert interviews turn internal knowledge into articles and case studies while keeping human review in the publishing process. That would make a useful content-workflow story.
veault.com|contact@veault.com|BetaList|Veault|Veault's focus on organizing a digital legacy offers a thoughtful product story. I would be interested in exploring whether that story fits AIBeat's startup coverage.|fit
almostkiss.com|hello@almostkiss.com|BetaList|AlmostKiss||unknown
spreeflo.com|contact@spreeflo.com|BetaList|Spreeflo|Spreeflo's focus on agentic marketing automation for founders gives us a practical angle to explore: how a founder puts marketing agents to work.
upskaill.ai|info@upskaill.ai|BetaList|Upskaill||unknown
trustity.co|support@trustity.co|BetaList|Trustity|GenGuard's focus on sensitive information being pasted into GenAI tools is a timely angle for AIBeat. A feature could explain where those controls sit in an everyday AI workflow.
murmell.com|hello@murmell.com|Product Hunt|Murmell|Bringing AI coding agents and teammates into one shared canvas gives Murmell a clear demonstration story. I would be interested in showing readers how that shared workspace operates.
happyshrimp.ai|feedback@contact.happyshrimp.ai|Product Hunt|Happy Shrimp|Happy Shrimp's prompt-to-song experience offers a straightforward creative workflow to demonstrate, from a musical idea to generated audio.
cosmicjs.com|support@cosmicjs.com|Product Hunt|Cosmic|Cosmic combines a managed headless CMS with AI agents for content work. A feature could focus on how editors and developers share that workflow across sites and brands.
trustedrouter.com|help@trustedrouter.com|Product Hunt|TrustedRouter|TrustedRouter's emphasis on model access and verifiable privacy would give an AIBeat feature a focused infrastructure angle: how teams evaluate the privacy of their model routing.
aymanhamed.com|ayman3000@gmail.com|Product Hunt|aymanhamed.com||unknown
nodeterm.dev|support@nodeterm.dev|Product Hunt|nodeterm|Running coding agents on a canvas gives nodeterm a visual story for developers exploring AI-assisted work. A short demo could make the workflow easy to understand.
todoless.ch|support@todoless.ch|BetaList|Todoless||unknown
nuros.app|support@nuros.app|BetaList|Nuros|Nuros brings AI study notes, flashcards, and quizzes into exam preparation. A feature could follow one study topic through those formats to show students how the workflow fits together.
renderit.now|support@renderit.now|BetaList|Renderit||unknown
rankorra.com|info@rankorra.com|BetaList|Rankora|Rankora's combined SEO and GEO positioning gives us an angle for readers thinking about discovery across search engines and AI answers.
tapestry.house|hello@kokoro.cool|BetaList|Tapestry||unknown
pooplegame.com|contact@pooplegame.com|BetaList|Poople|Poople's daily word-ladder format offers a compact product story. I would be interested in the thinking behind the game and whether its creation has an angle for AIBeat's startup coverage.|fit
ghostreply.lol|support@ghostreply.lol|Product Hunt|GhostReply|GhostReply brings AI auto-replies to iMessage on Mac. A feature could explore a specific messaging workflow and the choices users have when setting it up.
dynamicmockups.com|luka@dynamicmockups.com|Product Hunt|Dynamic Mockups|Dynamic Mockups' focus on producing realistic mockups at scale gives us a clear creative-production angle. A demo could show how a design becomes a set of product visuals.
dyson.com|questions.us@dyson.com|Product Hunt|Dyson|I am reaching out about potential AIBeat coverage of Dyson's work in robotics or AI-enabled products. Could you route this note to your press or partnerships team?|route
touchyapp.com|team@touchyapp.com|Product Hunt|Touchy|Touchy's focus on helping people put their phones down offers an interesting digital-habits story. I would like to explore whether the product or the story behind it fits AIBeat's coverage.|fit
meetlive.cc|admin@meetlive.cc|BetaList|MeetLive|MeetLive combines live meeting transcription with AI summaries. A feature could show how a conversation becomes a useful record for someone who needs to revisit it later.
seltlox.com|support@seltlox.com|BetaList|Seltlox||unknown
airtxt.ai|hi@airtxt.ai|BetaList|airtxt|airtxt brings voice dictation and meeting notes together on iPhone. Turning spoken thoughts into usable text gives us a practical workflow to demonstrate for AIBeat readers.
omi.me|help@omi.me|Product Hunt|Omi|Omi's wearable AI notetaker gives us a concrete hardware angle for AIBeat. A feature could explore how wearable note-taking fits into a user's day.
causal.so|contact@causal.so|Product Hunt|Causal|Causal's AI canvas for creative projects offers a visual way to explain how people organize AI-assisted work. A project walkthrough could make that workflow tangible.
nex.ai|contact@nex.ai|Product Hunt|Nex|Nex's prompt-driven approach to complex go-to-market plays gives us a focused automation story. A feature could walk through one play and show how it is set up.
photo2video.ai|support@josephworks.app|BetaList|Photo2Video AI|Photo2Video AI's image-animation workflow gives readers a simple before-and-after story: starting with a still image and turning it into a video.
donocap.com|franck@donocap.com|BetaList|NoCaps|NoCaps' habit-building focus offers a concrete product story around repeat use. I would be interested in exploring the approach behind it and its fit for AIBeat's startup coverage.|fit
signal-studio.app|hello@signal-studio.app|BetaList|Signal Studio|Signal Studio's AI banner generation offers a focused creative workflow for a product demo, from a campaign idea to a banner.
springbrand.ai|contact@springbrand.ai|BetaList|SpringBrand|SpringBrand's AI-assisted service marketplace gives us an angle beyond standalone tools: how AI fits into finding and delivering services.
inline.chat|hey@inline.chat|Product Hunt|Inline|Inline's focus on multiplayer work raises an interesting collaboration angle. I would be interested in which team workflow you would want readers to understand first.|fit
vimoxshah.github.io|vmoksh.shah179@gmail.com|Product Hunt|Vimox Shah|Your work in AI infrastructure could make an interesting builder story for AIBeat. I would be interested in which project you are currently looking to introduce to a wider audience.|personal
snitchforslack.com|hello@snitchforslack.com|Product Hunt|Snitch|Snitch's automatically built Slack org chart addresses a concrete team-discovery problem. A feature could show how someone uses it to understand who does what.|fit
getorlo.app|hello@getorlo.app|BetaList|Orlo|Orlo's AI document reminders for UK households offer a practical everyday-AI story. A feature could follow a household document through to the reminder it creates.
klarluft.com|contact@klarluft.com|Product Hunt|Klarluft|I would be interested in a software project or AI-related client workflow your team can share publicly. That could give us a concrete starting point for an AIBeat feature.|fit
experientiallabs.ai|silen@experientiallabs.ai|Product Hunt|Experiential Labs|Your open-source AI gateway offers a useful infrastructure story for AIBeat. A feature could explain the workflow it supports and where developers can try it themselves.
polydraft.ai|support@polydraft.ai|BetaList|PolyDraft|PolyDraft connects website building with ongoing SEO and AI visibility. A feature could follow the workflow beyond launch to show how a site is maintained for discovery.
siliform.ai|anukool@siliform.ai|BetaList|SiliForm|SiliForm's focus on flagging fake and AI-written form responses offers an interesting angle on collecting usable feedback. A feature could explain how users review those flags.
motiofy.ai|support@motiofy.ai|BetaList|Motiofy|Motiofy's image-to-video workflow gives us a visual way to introduce the product. A short demo could show the path from a still image to a finished clip.
nodlume.dev|support@quokkaquery.com|BetaList|Nodlume|Nodlume's visual application planning for React offers a developer-workflow story. A feature could show how a team maps an application before implementation.|fit
sticks.camera|support@sticks.camera|BetaList|Sticks|Sticks' audio-led AI cricket coaching brings AI into a specific sporting workflow. A feature could show how a player uses the coaching during practice.
sistava.com|contact@sista.ai|BetaList|Sistava|Sistava's AI employee offering gives us an automation angle for business owners. I would be interested in demonstrating one clearly defined role and the tasks it handles.
getardelia.com|lynch39083@gmail.com|BetaList|Ardelia|Ardelia's positioning around an AI-run company offers a founder-focused automation story. A feature could examine one business workflow and where the founder stays involved.
alphasuite.bio|AvennaXLtd@outlook.com|BetaList|AlphaSuite|AlphaSuite's protein-analysis positioning could make a focused science-software story. I would be interested in the workflow you most want researchers to understand.|fit
vocalrefresh.com|info@vocalrefresh.com|BetaList|Vocal Refresh|Vocal Refresh's focus on women returning to singing gives the product a clearly defined audience. I would be interested in whether there is a technology or founder story that fits AIBeat's coverage.|fit`;
const templatePath = path.resolve('lib/gmail-outreach-drafts.ts');
const template = fs.readFileSync(templatePath, 'utf8').match(/const plainText = `([\s\S]*?)`/)[1].replace(/\r\n/g, '\n');
const overrides = { 'bylio.io':'https://www.bylio.io/', 'trustity.co':'https://www.trustity.co/', 'cosmicjs.com':'https://www.cosmicjs.com/', 'happyshrimp.ai':'https://www.happyshrimp.ai/', 'airtxt.ai':'https://www.airtxt.ai/' };
const drafts = rows.split('\n').map((line, i) => {
  const [website, email, source, product, providedOpening, flag = ''] = line.split('|');
  const opening = providedOpening || `${product} came up on our ${source} outreach list, and I wanted to ask whether you are exploring additional visibility. I would be interested in a short overview of the product and the use case you would most like potential users to understand.`;
  const name = website === 'vimoxshah.github.io' ? 'Vimox' : website === 'aymanhamed.com' ? 'Ayman' : 'there';
  let body = template.replaceAll('${name}', name).replaceAll('${opening}', opening).replaceAll('${toolName}', product);
  if (['fit', 'unknown', 'personal', 'route'].includes(flag)) {
    body = body.replace(`For ${product}, the available visibility paths include`, `If ${product} is a fit for our coverage, we can discuss visibility paths such as`);
  }
  const notes = [];
  if (flag === 'unknown') notes.push('Product details could not be verified from the accessible website. Neutral opening; request an overview before assessing feature fit.');
  if (flag === 'fit') notes.push('AIBeat audience/category fit needs review; the draft does not describe this as an AI product.');
  if (flag === 'personal') notes.push('Personal portfolio: identify the specific project before selecting a feature package.');
  if (flag === 'route') notes.push('General customer-service inbox: route to press/partnerships; no specific Product Hunt launch verified.');
  const emailDomain = email.split('@')[1].toLowerCase();
  if (!(emailDomain === website || emailDomain.endsWith('.' + website))) notes.push('Supplied email domain differs from website; address retained exactly, apart from whitespace cleanup. Confirm ownership before sending.');
  return {id:i+1, website, to:email.trim(), source, product, subject:flag==='route' ? 'Dyson: AIBeat media and feature inquiry' : `${product}: possible AIBeat Spotlight feature`, body, research_source: flag==='unknown' ? null : (overrides[website] || `https://${website}/`), notes, status:'local draft; not sent'};
});
if(drafts.length !== 51 || new Set(drafts.map(d=>d.to.toLowerCase())).size !== 51) throw Error('Lead count or uniqueness mismatch');
for(const d of drafts) {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to) || /\$\{|\{\{/.test(d.body)) throw Error('Invalid draft '+d.id);
}
fs.mkdirSync(path.join(__dirname, 'individual'), {recursive:true});
fs.writeFileSync(path.join(__dirname, 'drafts.json'), JSON.stringify({prepared:'2026-09-09',template:'lib/gmail-outreach-drafts.ts',note:'Audience figures and offer terms are retained from the existing AIBeat template, not independently audited. Listing origins are supplied by the user, not independently verified.',drafts},null,2)+'\n');
const intro = '# AIBeat individual outreach drafts\n\n51 local drafts, prepared September 9, 2026. Nothing sent or added to Gmail/Kit.\n\nBased on the latest available Gmail Spotlight template in `lib/gmail-outreach-drafts.ts`. Its audience figures (100,000–150,000 monthly impressions, about 1,000 subscribers, 10–15 tool listings weekly) and Spotlight terms are retained as supplied business copy, not independently audited. Product openings use the linked public websites where available. BetaList/Product Hunt origins come from the supplied list; no recent-launch claim is made. Research links and review notes are not part of the email body.\n\n';
fs.writeFileSync(path.join(__dirname, 'outreach-drafts.md'), intro + drafts.map(d=>`## ${d.id}. ${d.product}\n\n**To:** ${d.to}\n\n**Subject:** ${d.subject}\n\n${d.body}\n\n${d.research_source ? `Research: [${d.product} website](${d.research_source})` : 'Research: Website details unavailable; neutral draft.'}${d.notes.length?'\n\nReview notes: '+d.notes.join(' '):''}\n\n---\n`).join('\n'));
for(const d of drafts) fs.writeFileSync(path.join(__dirname,'individual',`${String(d.id).padStart(2,'0')}-${d.website}.txt`), `To: ${d.to}\nSubject: ${d.subject}\n\n${d.body}\n`);
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
fs.writeFileSync(path.join(__dirname,'outreach-drafts.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIBeat — 51 outreach drafts</title><style>body{font:16px/1.6 system-ui;background:#f5f6f8;color:#17202a;max-width:940px;margin:40px auto;padding:0 20px}article{background:white;border:1px solid #dce0e5;padding:28px;border-radius:12px;margin:24px 0}h1,h2{line-height:1.2}pre{white-space:pre-wrap;font:inherit}aside{background:#fff5df;padding:12px;margin-top:20px;font-size:14px}a{color:#1656b5}.meta{color:#536170}button{padding:8px 14px;cursor:pointer}input{width:100%;padding:12px;box-sizing:border-box;font:inherit}</style><h1>AIBeat outreach drafts</h1><p>51 individual drafts · September 9, 2026 · Not sent</p><p class="meta">Uses the existing AIBeat Spotlight template. Audience metrics and offer terms are retained from that template, not independently audited. Review notes and source links are excluded from copied email text.</p><input id="filter" placeholder="Find a company or email" aria-label="Filter drafts">${drafts.map(d=>`<article data-search="${esc((d.product+' '+d.website+' '+d.to).toLowerCase())}"><h2>${d.id}. ${esc(d.product)}</h2><p class="meta">To: ${esc(d.to)} · ${esc(d.source)}</p><p><strong>Subject:</strong> ${esc(d.subject)}</p><button onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent).then(()=>{this.textContent='Copied'})">Copy email body</button><pre>${esc(d.body)}</pre>${d.research_source?`<a href="${esc(d.research_source)}">Product research source</a>`:''}${d.notes.length?`<aside>${esc(d.notes.join(' '))}</aside>`:''}</article>`).join('')}<script>document.getElementById('filter').addEventListener('input',e=>{for(const a of document.querySelectorAll('article'))a.hidden=!a.dataset.search.includes(e.target.value.toLowerCase())})</script></html>`);
console.log(JSON.stringify({count:drafts.length,individualFiles:fs.readdirSync(path.join(__dirname,'individual')).length,neutralDrafts:drafts.filter(d=>!d.research_source).length,output:path.join(__dirname,'outreach-drafts.html')},null,2));
