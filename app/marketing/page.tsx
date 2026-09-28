import type { Metadata } from 'next'
import './marketing.css'

export const metadata: Metadata = {
  title: 'AIBeat Marketing — Done-For-You Growth',
  description: 'Marketing for AI startups: discovery listings, social content, go-to-market strategy, and outreach. Explore Basic, Pro, and Growth plans.',
  alternates: { canonical: '/marketing' },
  openGraph: { title: 'AIBeat Marketing — Done-For-You Growth', description: 'You build the product. We help it get discovered.', url: '/marketing' },
  twitter: { title: 'AIBeat Marketing — Done-For-You Growth', description: 'You build the product. We help it get discovered.' },
}

export default function MarketingPage() {
  return (
    <div className="marketing-page">

      <section>
        <div className="hero">
          <span className="hero-label">Done-For-You Marketing for AI Startups</span>
          <h1>Your AI tool deserves customers,<br /><em>not just visitors.</em></h1>
          <p className="hero-sub">
            We put your product in front of 100,000 monthly visitors and 300+ buyer-intent subscribers who are actively searching for AI tools to buy.
          </p>
          <p className="hero-qualifier">
            <strong>No ads required. No cold spam.</strong> Built on an audience that already exists.
          </p>
          <div className="hero-btns">
            <a href="#pricing" className="btn-primary">Get Listed and Start Growing</a>
            <a href="#how-it-works" className="btn-ghost">See how it works</a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">100K+</span>
              <span className="stat-label">Monthly visitors</span>
            </div>
            <div className="stat">
              <span className="stat-num">300+</span>
              <span className="stat-label">Buyer-intent subscribers</span>
            </div>
            <div className="stat">
              <span className="stat-num">8+</span>
              <span className="stat-label">Discovery portals</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="section pain-section">
        <div className="container">
          <span className="section-label">The real problem</span>
          <h2>You built something great.<br /><em>Nobody knows it exists.</em></h2>
          <p className="lead">The AI tools that grow do not have better products. They have better distribution. Most founders launch, post once, and wait for something to happen.</p>

          <div className="pain-grid">
            <div className="pain-card">
              <h3>Invisible after launch week</h3>
              <p>The Product Hunt bump fades. Traffic drops. You are back to zero wondering what went wrong.</p>
            </div>
            <div className="pain-card">
              <h3>Social media producing nothing</h3>
              <p>Posting consistently but getting 12 likes and zero signups. The algorithm does not care about your features.</p>
            </div>
            <div className="pain-card">
              <h3>No GTM playbook</h3>
              <p>You know you need marketing but not where to start, what to prioritize, or how to get the first 100 customers.</p>
            </div>
            <div className="pain-card">
              <h3>No time to run it yourself</h3>
              <p>You are shipping, supporting users, handling operations. Marketing is the thing that never gets done.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="quote-strip">
        <blockquote>&quot;What if your marketing ran while you built?&quot;</blockquote>
        <cite>We handle visibility, content, outreach, and positioning. You handle the product.</cite>
      </div>

      <section className="section" id="how-it-works">
        <div className="container">
          <span className="section-label">How it works</span>
          <h2>From listed<br />to customers.</h2>
          <p className="lead">We run a full-stack marketing operation for your AI startup so you do not have to hire a team or figure it out alone.</p>

          <div className="steps">
            <div className="step">
              <div className="step-left">
                <div className="step-num">01</div>
                <div className="step-line"></div>
              </div>
              <div className="step-body">
                <h3>You get listed everywhere buyers look</h3>
                <p>We list your product on AIBeat.dev and up to 7 additional AI discovery portals. Buyers browsing for tools find you first, not your competition.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-left">
                <div className="step-num">02</div>
                <div className="step-line"></div>
              </div>
              <div className="step-body">
                <h3>Your social presence goes live across 4 channels</h3>
                <p>Facebook, Instagram, Twitter, and LinkedIn, set up and managed with content built to attract your ideal customer, not just followers.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-left">
                <div className="step-num">03</div>
                <div className="step-line"></div>
              </div>
              <div className="step-body">
                <h3>You get a custom GTM strategy</h3>
                <p>A concrete go-to-market plan built for your product and ICP, designed to get your first 100 paying customers, not just signups.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-left">
                <div className="step-num">04</div>
                <div className="step-line"></div>
              </div>
              <div className="step-body">
                <h3>We scale the system with you</h3>
                <p>Email sequences, founder-led LinkedIn content, SEO, AEO, GEO for AI search visibility, cold outreach, and sales training. All done for you as you grow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="section pricing-section" id="pricing">
        <div className="container-wide">
          <span className="section-label">Plans</span>
          <h2>Pick the level that matches<br />where you are.</h2>
          <p className="lead">Every plan starts with real distribution. Upgrade when you are ready to scale harder.</p>

          <div className="plan-grid">

            <div className="plan">
              <span className="plan-name">Basic</span>
              <div className="plan-headline">Get discovered. Build your foundation.</div>
              <div>
                <span className="plan-amount">$850</span>
                <span className="plan-period">first month</span>
              </div>
              <div className="plan-renewal">then $500/mo</div>
              <hr className="plan-rule" />
              <ul className="feature-list">
                <li>Listed on AIBeat.dev (100K monthly visitors)</li>
                <li>Listed on 7+ AI discovery portals</li>
                <li>Social media setup across 4 channels: Facebook, Instagram, Twitter, LinkedIn</li>
                <li>Active social marketing across all 4 channels</li>
                <li>Custom GTM strategy to land your first 100 customers</li>
              </ul>
              <a href="#contact" className="plan-cta outline">Start with Basic</a>
            </div>

            <div className="plan featured">
              <span className="plan-badge">Most Popular</span>
              <span className="plan-name">Pro</span>
              <div className="plan-headline">Get visible to buyers searching for AI tools right now.</div>
              <div>
                <span className="plan-amount">$1,200</span>
                <span className="plan-period">first month</span>
              </div>
              <div className="plan-renewal">then $850/mo</div>
              <hr className="plan-rule" />
              <ul className="feature-list">
                <li>Everything in Basic</li>
                <li>Email marketing to 300+ buyer-intent subscribers</li>
                <li>Founder-led LinkedIn content, 3 posts per week</li>
                <li>LinkedIn outreach, done with you</li>
                <li>Social media outreach, done with you</li>
                <li>SEO to rank in Google for your category</li>
                <li>AEO to show up in AI-generated answers</li>
                <li>GEO to appear in Perplexity, ChatGPT Search, and Google AI Overviews</li>
              </ul>
              <a href="#contact" className="plan-cta white">Start with Pro</a>
            </div>

            <div className="plan">
              <span className="plan-name">Growth</span>
              <div className="plan-headline">Full-stack outbound. Revenue, not just reach.</div>
              <div>
                <span className="plan-amount">$1,850</span>
                <span className="plan-period">first month</span>
              </div>
              <div className="plan-renewal">then $1,000/mo</div>
              <hr className="plan-rule" />
              <ul className="feature-list">
                <li>Everything in Pro</li>
                <li>Done-for-you outbound, we reach out on your behalf</li>
                <li>Cold email campaigns, written and sent for you</li>
                <li>LinkedIn social selling, DMs and connection sequences</li>
                <li>Sales call training so you close what we bring in</li>
              </ul>
              <a href="#contact" className="plan-cta dark">Start with Growth</a>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="section">
        <div className="container">
          <span className="section-label">Real talk</span>
          <h2>If you are thinking this,<br />you are not alone.</h2>
          <p className="lead">The honest answer to every doubt that keeps founders from getting started.</p>

          <div className="obj-list">
            <div className="obj-card">
              <div className="obj-q">We are too early for marketing.</div>
              <p className="obj-a">The biggest mistake early-stage AI startups make is building in silence and waiting until the product is ready to market. Distribution is a product decision. The sooner you start building visibility, the less you pay per customer as you scale. Every week you wait is a week your competitors are not waiting.</p>
            </div>
            <div className="obj-card">
              <div className="obj-q">$850 per month is expensive for a startup.</div>
              <p className="obj-a">Basic starts at $850 for the first month, then $500 per month. Whether it makes sense depends on your margins, customer lifetime value, and conversion rate. We scope the work with you before you commit.</p>
            </div>
            <div className="obj-card">
              <div className="obj-q">We have tried marketing before and it did not work.</div>
              <p className="obj-a">Most AI startup marketing fails because it targets the wrong people with the wrong message on the wrong channels. The difference here is that we start from an audience already on AIBeat.dev specifically to find and buy AI tools. We are not running cold traffic to a cold audience. We are connecting your product to people actively looking for it right now.</p>
            </div>
            <div className="obj-card">
              <div className="obj-q">We do not have time to manage a marketing partner.</div>
              <p className="obj-a">That is exactly why we built Done-For-You. One onboarding call of 30 to 60 minutes gives us what we need to run independently. We handle the writing, posting, listing, outreach, and optimization. You review and approve. Most clients spend under two hours per month on their end.</p>
            </div>
            <div className="obj-card">
              <div className="obj-q">How is this different from listing on Product Hunt?</div>
              <p className="obj-a">Product Hunt gives you one day of visibility. We give you ongoing discovery across 8 or more platforms, a social presence that compounds, email reach to 300+ buyers, and a strategy to convert that attention into paying customers. A launch is a moment. This is a marketing system.</p>
            </div>
            <div className="obj-card">
              <div className="obj-q">Can you guarantee results?</div>
              <p className="obj-a">We do not make vanity promises. We agree on the listings, content, and outreach included in your plan before work begins. Audience size is not a guarantee of views, leads, or sales. Outcomes depend on your product-market fit, but we give you the best possible distribution foundation in the AI tools space.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="section" id="faq">
        <div className="container">
          <span className="section-label">FAQ</span>
          <h2>Quick answers.</h2>
          <p className="lead">If something is still unclear, just reach out directly.</p>

          <div className="faq-list">
            <details className="faq-item"><summary className="faq-q">
              How quickly will my product get listed?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">Your listing on AIBeat.dev and partner portals typically goes live within 3 to 5 business days of onboarding. Social media setup is completed in the first week.</div></details>
            <details className="faq-item"><summary className="faq-q">
              What do you need from me to get started?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">A 30 to 60 minute onboarding call to understand your product, target customer, and positioning. After that, we handle execution. You will get weekly or bi-weekly updates and a direct channel to review content before it goes live.</div></details>
            <details className="faq-item"><summary className="faq-q">
              Can I upgrade plans after I start?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">Yes. You can upgrade at any time. Downgrades are available at the end of any billing cycle. We will prorate and transition you smoothly.</div></details>
            <details className="faq-item"><summary className="faq-q">
              What is AEO and GEO? Why does my AI startup need them?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">AEO (Answer Engine Optimization) means your product shows up when people ask AI assistants questions. GEO (Generative Engine Optimization) ensures AI search tools like Perplexity, ChatGPT Search, and Google AI Overviews can find and recommend your product. As more buyers use AI to discover tools, these are not optional. They are the new SEO.</div></details>
            <details className="faq-item"><summary className="faq-q">
              What does Founder-led LinkedIn content mean on the Pro plan?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">We ghostwrite 3 LinkedIn posts per week in your voice, on topics that position you as an authority in your space and drive awareness for your product. You review, approve, and post, or we manage the account directly. It is the most effective B2B distribution channel right now, and most founders do not have time to do it consistently.</div></details>
            <details className="faq-item"><summary className="faq-q">
              Is there a minimum contract length?
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">We ask for a minimum 2-month commitment to give campaigns enough runway to show real results. After that, it is month-to-month. Marketing is not instant, but 60 days is enough time to know whether it is working.</div></details>
            <details className="faq-item"><summary className="faq-q">
              Who is this for? We are very early stage.
              <span className="faq-marker" aria-hidden="true">+</span>
            </summary><div className="faq-a">We work best with AI startups that have a live product or early access, a defined ICP, and at least a basic pricing model. You do not need 10K users or Series A funding. If you are pre-product, reach out and we will be honest about whether now is the right time.</div></details>
          </div>
        </div>
      </section>

      <div className="cta-dark" id="contact">
        <div className="cta-dark-inner">
          <span className="section-label">Ready to grow</span>
          <h2>Stop building in silence.<br />Start getting found.</h2>
          <p>Your first 100 customers are out there. Let us put your product in front of them.</p>
          <a href="mailto:hello@aibeat.dev?subject=Done-For-You%20Marketing%20Inquiry" className="btn-primary">Request a Free Strategy Call</a>
          <p className="cta-note">No commitment. 30 minutes. We will tell you exactly which plan makes sense for where you are.</p>
        </div>
      </div>

    </div>
  )
}
