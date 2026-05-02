import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — POS Pro',
  description: 'Terms of Service for POS Pro — Pakistan\'s cloud POS platform.',
}

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          LEGAL
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed text-[15px]">

        <section>
          <p>
            Welcome to <strong>POS Pro</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an account or using our services, you (&ldquo;User&rdquo;, &ldquo;you&rdquo;) agree to these Terms of Service. Please read them carefully.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">1. Acceptance of Terms</h2>
          <p>
            By signing up, accessing, or using POS Pro, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">2. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You must provide accurate, current, and complete information during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your password.</li>
            <li>You must be at least 18 years old or operate the account on behalf of a registered business.</li>
            <li>One user may operate multiple stores by creating separate accounts; sharing logins is prohibited.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">3. Subscription &amp; Payment</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>POS Pro offers a free 7-day trial. After the trial ends, you must subscribe to continue using the service.</li>
            <li>Subscription fees are payable in advance via bank transfer, JazzCash, EasyPaisa, or other approved methods.</li>
            <li>Subscription is activated only after payment proof is approved by our admin team.</li>
            <li>Plans may be billed monthly, quarterly, semi-annually, or annually as selected at checkout.</li>
            <li>We reserve the right to revise pricing with 30 days&apos; notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">4. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Use POS Pro for any illegal, fraudulent, or unauthorized purpose.</li>
            <li>Resell, sublicense, or redistribute the service without written permission.</li>
            <li>Reverse-engineer, decompile, or attempt to extract source code.</li>
            <li>Upload viruses, malware, or any harmful code.</li>
            <li>Interfere with or disrupt the service or servers.</li>
            <li>Use the platform to violate FBR tax obligations or other Pakistani laws.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">5. Your Data</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You retain ownership of all business data (products, customers, sales, etc.) entered into the system.</li>
            <li>We act as a custodian and process the data on your behalf.</li>
            <li>You are responsible for ensuring the legality of the data you upload.</li>
            <li>You may export your data at any time via the reports/export functions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">6. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may schedule maintenance with prior notice. We are not liable for downtime caused by third-party providers, internet outages, or events beyond our reasonable control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">7. Suspension &amp; Termination</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You may cancel your subscription at any time. Service continues until the end of the paid period.</li>
            <li>We may suspend or terminate accounts that violate these Terms, with or without notice.</li>
            <li>Upon termination, your data will be retained for 30 days, after which it may be permanently deleted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">8. Intellectual Property</h2>
          <p>
            All software, design, logos, and content of POS Pro are owned by us or our licensors. You receive a non-exclusive, non-transferable license to use the service during your active subscription.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, POS Pro&apos;s total liability for any claim related to the service shall not exceed the amount paid by you in the 3 months preceding the claim. We are not liable for indirect, incidental, or consequential damages, including loss of profits or data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be resolved in the courts of Karachi, Sindh.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">12. Contact Us</h2>
          <p>
            For any questions about these Terms, please contact us:
          </p>
          <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-amber-700" />
              <a href="mailto:legal@pospro.pk" className="text-amber-700 hover:underline font-medium">legal@pospro.pk</a>
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-sm">
        <Link href="/" className="text-amber-600 hover:text-amber-700 hover:underline">← Back to Home</Link>
        <Link href="/privacy" className="text-amber-600 hover:text-amber-700 hover:underline">Privacy Policy →</Link>
      </div>
    </article>
  )
}
