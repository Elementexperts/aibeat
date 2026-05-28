import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AIBeat.dev privacy policy — how we collect, use, and protect your information. GDPR and CCPA compliant.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 border-x border-border min-h-screen">
      <div className="max-w-2xl mx-auto">

        <div className="font-mono text-[11px] text-ink-4 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <span className="text-ink">Privacy Policy</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">Privacy Policy</h1>
        <p className="font-mono text-xs text-ink-4 mb-8">Last updated: May 28, 2026</p>

        <div className="article-body">

          <p>AIBeat.dev ("we", "us", or "our") operates the website at aibeat.dev. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read it carefully. By using the site you agree to the practices described here.</p>

          <h2>Information We Collect</h2>
          <p><strong>Information you provide directly:</strong> When you subscribe to our newsletter, submit a tool listing, or contact us, we collect your email address and any other information you choose to provide. We do not require account creation to browse the site.</p>
          <p><strong>Information collected automatically:</strong> When you visit AIBeat.dev, we automatically collect certain information about your device and browsing activity, including: IP address, browser type and version, operating system, referring URLs, pages visited, time and date of visit, and time spent on pages. This data is collected through cookies and analytics tools described below.</p>
          <p><strong>Information from third parties:</strong> We may receive information about you from third-party services if you interact with them in connection with our site (for example, if you click an affiliate link).</p>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Deliver and improve the AIBeat.dev website and content</li>
            <li>Send newsletters and editorial updates to subscribers who have opted in</li>
            <li>Analyze site usage to understand what content is valuable to our readers</li>
            <li>Monitor and prevent fraudulent activity</li>
            <li>Comply with legal obligations</li>
            <li>Communicate with you in response to inquiries or submissions</li>
          </ul>
          <p>We do not sell your personal information to third parties. We do not share your email address with advertisers or affiliate partners.</p>

          <h2>Cookies and Analytics</h2>
          <p><strong>Google Analytics 4 (GA4):</strong> We use Google Analytics to understand how visitors use our site. GA4 collects data including page views, session duration, device type, and approximate geographic location. This data is aggregated and anonymized — we cannot identify individual users from it. Google's use of this data is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</p>
          <p>You can opt out of Google Analytics tracking by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a> or by enabling "Do Not Track" in your browser settings.</p>
          <p><strong>Essential cookies:</strong> We use cookies that are strictly necessary for the site to function. These cannot be disabled without affecting site functionality.</p>
          <p><strong>Performance cookies:</strong> Analytics cookies (Google Analytics) help us improve the site by measuring usage patterns. You can opt out as described above.</p>

          <h2>Advertising (Google AdSense)</h2>
          <p>AIBeat.dev uses Google AdSense to display advertisements. Google AdSense uses cookies to serve ads based on your prior visits to this website and other sites. Google's use of advertising cookies enables it and its partners to serve ads based on your visits to our site and other sites on the internet.</p>
          <p>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. You can also opt out through the Network Advertising Initiative at <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer">optout.networkadvertising.org</a>.</p>

          <h2>Affiliate Disclosure</h2>
          <p>AIBeat.dev participates in affiliate programs. When you click certain links to tools and services and make a purchase or sign up, we may earn a commission at no additional cost to you. Affiliate relationships never influence our editorial content — we do not accept payment for reviews, rankings, or editorial coverage. Our editorial methodology is described on our <Link href="/about">About page</Link>.</p>
          <p>Affiliate links are clearly associated with the tools they describe. We do not insert hidden affiliate tracking or redirect organic links through affiliate parameters without disclosure.</p>

          <h2>Third-Party Links</h2>
          <p>Our website contains links to third-party websites, tools, and services. These external sites have their own privacy policies and we are not responsible for their content or privacy practices. We encourage you to review the privacy policy of any third-party site you visit through links on AIBeat.dev.</p>

          <h2>Your Rights</h2>
          <p><strong>GDPR rights (EEA/UK residents):</strong> If you are located in the European Economic Area or United Kingdom, you have the following rights under the General Data Protection Regulation:</p>
          <ul>
            <li><strong>Right of access:</strong> You may request a copy of the personal data we hold about you.</li>
            <li><strong>Right to rectification:</strong> You may request correction of inaccurate personal data.</li>
            <li><strong>Right to erasure:</strong> You may request deletion of your personal data ("right to be forgotten").</li>
            <li><strong>Right to restrict processing:</strong> You may request that we limit how we use your data.</li>
            <li><strong>Right to data portability:</strong> You may request your data in a machine-readable format.</li>
            <li><strong>Right to object:</strong> You may object to processing of your data for direct marketing purposes.</li>
          </ul>
          <p><strong>CCPA rights (California residents):</strong> California residents have the right to: know what personal information is collected, used, shared, or sold; opt out of the sale of personal information (we do not sell personal information); request deletion of personal information; and not be discriminated against for exercising these rights.</p>
          <p>To exercise any of these rights, contact us at <a href="mailto:privacy@aibeat.dev">privacy@aibeat.dev</a>. We will respond within 30 days (GDPR) or 45 days (CCPA).</p>

          <h2>Data Retention</h2>
          <p>We retain newsletter subscriber email addresses for as long as the subscription is active, plus a reasonable period after unsubscription for legal compliance. Analytics data (Google Analytics) is retained according to Google's standard retention policies. You may request deletion of your data at any time by contacting us at <a href="mailto:privacy@aibeat.dev">privacy@aibeat.dev</a>.</p>

          <h2>Children's Privacy</h2>
          <p>AIBeat.dev is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us at <a href="mailto:privacy@aibeat.dev">privacy@aibeat.dev</a> and we will promptly delete it.</p>

          <h2>Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of the site after changes constitutes acceptance of the revised policy.</p>

          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, your data, or your rights, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@aibeat.dev">privacy@aibeat.dev</a></li>
            <li><strong>General inquiries:</strong> <a href="mailto:info@aibeat.dev">info@aibeat.dev</a></li>
            <li><strong>Website:</strong> <Link href="/">aibeat.dev</Link></li>
          </ul>

        </div>
      </div>
    </div>
  )
}
