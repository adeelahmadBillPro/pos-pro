import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Mail, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — POS Pro',
  description: 'Privacy Policy for POS Pro — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 text-teal-700 bg-teal-50 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          PRIVACY
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed text-[15px]">

        <section>
          <p>
            At <strong>POS Pro</strong>, your privacy is important. This Policy explains what data we collect, how we use it, and your rights. By using our service, you agree to the practices described here.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">1. Information We Collect</h2>

          <h3 className="font-semibold text-slate-800 mt-4 mb-1">a) Information you provide</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Name, email, phone number, store name (during registration)</li>
            <li>Payment proof screenshots and transaction references</li>
            <li>Business data you upload: products, customers, orders, inventory</li>
            <li>Profile photo (if you upload one)</li>
          </ul>

          <h3 className="font-semibold text-slate-800 mt-4 mb-1">b) Information collected automatically</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>IP address, browser type, device info (for security)</li>
            <li>Login times, page views, feature usage (for service improvement)</li>
            <li>Audit logs of actions performed in your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Provide and maintain the POS Pro service</li>
            <li>Process subscriptions and verify payments</li>
            <li>Send important account, billing, and security notifications</li>
            <li>Provide customer support when you contact us</li>
            <li>Improve our product (only aggregated, anonymized analytics)</li>
            <li>Comply with legal obligations and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">3. We Do NOT</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Sell your data to advertisers</li>
            <li>Share your business data with other stores or competitors</li>
            <li>Read your customer lists, sales, or financial data unless required for support (with your permission)</li>
            <li>Track you across other websites</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">4. Data Storage &amp; Security</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Data is stored on secure cloud servers with industry-standard encryption.</li>
            <li>Passwords are hashed using bcrypt (we never store plain-text passwords).</li>
            <li>Access to your data is restricted to authorized personnel only.</li>
            <li>Daily automated backups protect against accidental loss.</li>
            <li>SSL/TLS encryption protects data in transit.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">5. Third-Party Services</h2>
          <p>We use the following trusted services:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Cloudinary</strong> — for image storage (product photos, payment proofs)</li>
            <li><strong>Email providers</strong> — for transactional emails (welcome, password reset)</li>
            <li><strong>Hosting provider</strong> — for serving the application</li>
          </ul>
          <p className="mt-2">These providers have their own privacy policies and only access data necessary to provide their service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Access</strong> — view all data we hold about you (most is visible in your dashboard)</li>
            <li><strong>Edit</strong> — update your profile, store info, and business data anytime</li>
            <li><strong>Export</strong> — download your business data via the export functions</li>
            <li><strong>Delete</strong> — request account deletion by emailing privacy@pospro.pk</li>
            <li><strong>Object</strong> — opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">7. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Active accounts: data retained as long as the account is active.</li>
            <li>Cancelled accounts: data retained for 30 days, then permanently deleted.</li>
            <li>Audit logs: retained for 1 year for security and compliance.</li>
            <li>Tax/financial records: retained per Pakistan tax law (typically 6 years).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">8. Cookies</h2>
          <p>
            We use only essential cookies (for authentication and session management). We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">9. Children&apos;s Privacy</h2>
          <p>
            POS Pro is intended for businesses and is not directed to children under 18. We do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">10. International Users</h2>
          <p>
            POS Pro is operated from Pakistan. If you access our service from outside Pakistan, your data may be transferred to and processed in Pakistan, where our servers are located.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">11. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy occasionally. Material changes will be announced via email and in-app notification. The &ldquo;last updated&rdquo; date at the top reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">12. Contact for Privacy Concerns</h2>
          <div className="mt-3 p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-teal-700" />
              <a href="mailto:privacy@pospro.pk" className="text-teal-700 hover:underline font-medium">privacy@pospro.pk</a>
            </p>
            <p className="flex items-start gap-2 text-sm">
              <Lock className="w-4 h-4 text-teal-700 mt-0.5" />
              <span>For data export, deletion, or any privacy concern, email us. We respond within 5 business days.</span>
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-sm">
        <Link href="/terms" className="text-amber-600 hover:text-amber-700 hover:underline">← Terms of Service</Link>
        <Link href="/refund" className="text-amber-600 hover:text-amber-700 hover:underline">Refund Policy →</Link>
      </div>
    </article>
  )
}
