import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Reveal AI",
  description: "Privacy Policy for Reveal AI - People Search. Learn how we protect your data and privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Effective: March 11, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              RevealAI helps users find and verify <strong>public information</strong> about people by summarizing and linking to reputable sources. We do not sell personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Usage & Diagnostics:</strong> App interactions, crash/performance data, feature usage patterns.</li>
              <li><strong>Identifiers:</strong> Device or instance identifiers used for analytics and paywall/subscriptions.</li>
              <li><strong>Optional Contact Info:</strong> If you email us or create an account, we may store your email for support.</li>
              <li><strong>Device Tokens:</strong> If you enable push notifications for alerts, we store device tokens for Apple Push Notification Service (APNs).</li>
              <li><strong>Alert Subscriptions:</strong> If you enable monitoring features, we store your subscription preferences.</li>
              <li><strong>Search & Scan History:</strong> We may store your search queries and scan results locally on your device and, if you're signed in, on our servers to provide history and continuity across devices.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To operate the app, improve reliability, measure feature usage, process in-app purchases/subscriptions, send push notifications for alerts you've subscribed to, and provide support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sources & Third Parties</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              RevealAI surfaces links and short excerpts from <strong>public web pages</strong> and third-party data providers. We attribute sources and send users to the original site. Infrastructure and analytics may involve third-party processors:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Apple:</strong> App Store, in-app purchases, push notifications (APNs)</li>
              <li><strong>Supabase:</strong> Backend infrastructure, authentication, database storage</li>
              <li><strong>Enformion:</strong> People search, records search, vehicle search data</li>
              <li><strong>OpenAI:</strong> AI-powered research and summarization features</li>
              <li><strong>Have I Been Pwned (HIBP):</strong> Dark web breach detection</li>
              <li><strong>Superwall:</strong> Subscription management and paywall presentation</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              These processors handle data under their own policies. We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features That Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>People Search:</strong> Queries may be processed by Enformion to return public records</li>
              <li><strong>Dark Web Scan:</strong> Email addresses are checked against HIBP's breach database</li>
              <li><strong>Exposure Monitoring:</strong> If enabled, we monitor for new exposures and send alerts</li>
              <li><strong>Data Broker Removal:</strong> If you use this feature, we may process removal requests on your behalf</li>
              <li><strong>Spam Blocker:</strong> Phone numbers you block are stored locally on your device</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain data only as long as necessary for app functionality and legal requirements, then delete or anonymize it. Search history and scan results are retained to provide continuity, but you can clear this data at any time through the app settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Choices</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>You can request deletion of support emails we hold about you by contacting us at <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a>.</li>
              <li>You can disable push notifications in your device settings.</li>
              <li>You can clear search and scan history within the app.</li>
              <li>You can unsubscribe from monitoring alerts in the app settings.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children</h2>
            <p className="text-gray-600 leading-relaxed">
              RevealAI is not directed to children under 13. If you believe a child provided us contact info, contact <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a> to remove it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We use industry-standard safeguards (e.g., HTTPS/TLS). No method of transmission or storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Alexander Carver</strong><br />
              Email: <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to this Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this policy and will change the "Effective" date above accordingly.
            </p>
          </section>
        </div>

        {/* Back to home */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} RevealAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
