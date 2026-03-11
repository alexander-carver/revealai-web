import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Reveal AI",
  description: "Terms of Service for Reveal AI - People Search. Read our terms and conditions.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: March 11, 2025</p>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed mb-8">
            Welcome to <strong>Reveal AI – People Search</strong> ("Reveal AI," "we," "our," or "us"). By downloading, accessing, or using our app, you agree to these Terms of Service ("Terms"). If you do not agree, please do not use the app.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>You must be at least <strong>13 years old</strong> to use Reveal AI.</li>
              <li>If you are under 18, you may only use the app with the consent of a parent or legal guardian.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Subscriptions & Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Reveal AI offers <strong>weekly and yearly subscription plans</strong> ($6.99/week and $39.99/year).</li>
              <li>Subscriptions are billed through <strong>Stripe</strong> and Apple's App Store and managed via your account settings.</li>
              <li><strong>Free trials</strong> (if offered) will automatically convert to paid subscriptions unless canceled at least 24 hours before the trial period ends.</li>
              <li><strong>Refunds and cancellations</strong> are handled according to Stripe and Apple policies. We do not provide separate refunds.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Use Reveal AI for any illegal, abusive, or fraudulent activity.</li>
              <li>Attempt to reverse-engineer, copy, or resell the app or its content.</li>
              <li>Harass, defame, or otherwise harm others through the app.</li>
              <li>Use automated tools (bots, scrapers, etc.) to access or misuse the service.</li>
              <li>Use information obtained through Reveal AI to stalk, harass, or harm individuals.</li>
            </ul>
            <p className="text-gray-600 mt-4">Violation of these rules may result in suspension or termination of your account.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Content & Accuracy</h2>
            <p className="text-gray-600 leading-relaxed">
              Reveal AI provides AI-powered results and tools that aggregate information from public sources and third-party data providers. While we aim to deliver useful and accurate information, we <strong>do not guarantee the accuracy, completeness, or reliability</strong> of any content. You are responsible for how you use the information provided and should verify important information independently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Premium Features</h2>
            <p className="text-gray-600 mb-4">Some features require a paid subscription ("Pro" or "Premium"), including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Username Search</li>
              <li>Exposure Score</li>
              <li>Unlimited searches and scans</li>
              <li>Advanced research tools</li>
            </ul>
            <p className="text-gray-600 mt-4">Free users have access to limited features. Premium features are clearly marked in the app.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Disclaimer of Warranties</h2>
            <p className="text-gray-600 leading-relaxed">
              Reveal AI is provided <strong>"as is" and "as available."</strong> We make no warranties or guarantees about uninterrupted service, error-free results, or suitability for any particular purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the fullest extent permitted by law, Reveal AI and its owner (Alexander Carver) shall not be liable for any indirect, incidental, special, or consequential damages, including loss of data, profits, or business opportunities, arising out of your use of the app or reliance on information obtained through the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We may suspend or terminate your access to the app if you violate these Terms or use the app in a way that could harm us or other users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms are governed by the laws of the <strong>State of Texas, USA</strong>, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to These Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms from time to time. The "Last Updated" date above will reflect the latest version. Continued use of the app after changes means you accept the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions or concerns about these Terms, contact us at:<br />
              📧 <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a>
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
