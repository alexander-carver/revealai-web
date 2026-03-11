import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";
import { ChevronDown, ChevronUp, Mail, HelpCircle, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Support & FAQ | Reveal AI",
  description: "Support and FAQ for Reveal AI - People Search. Get help and find answers to common questions.",
};

function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  return (
    <details className="group border border-gray-200 rounded-lg bg-white overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:hidden" />
        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 hidden group-open:block" />
      </summary>
      <div className="px-4 pb-4 text-gray-600 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How can we help?
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions or contact our support team.
          </p>
          <a 
            href="mailto:realrevealaiofficial@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Contact Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                Need help? Email us at <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline font-medium">realrevealaiofficial@gmail.com</a>
              </p>
              <p className="text-sm text-gray-500">
                Developer: Alexander Carver
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="What is Reveal AI?"
              answer="Reveal AI is a powerful AI-driven people search assistant. It helps you explore information more intelligently, ask deep questions, and uncover insights faster than traditional search. Features include people search, records search, dark web scanning, exposure monitoring, and privacy tools."
            />

            <FAQItem 
              question="How do subscriptions work?"
              answer={<>We offer <strong>Weekly</strong> ($6.99/week) and <strong>Yearly</strong> ($39.99/year) subscription plans. Payments are processed through Stripe and Apple's App Store. Subscriptions automatically renew unless canceled at least 24 hours before the renewal date. You can manage or cancel your subscription anytime in your account settings.</>}
            />

            <FAQItem 
              question="Do you offer a free trial?"
              answer="Yes, Reveal AI offers a 7-day free trial depending on the subscription plan. Free trials automatically convert into a paid subscription unless canceled before the trial ends."
            />

            <FAQItem 
              question="Can I get a refund?"
              answer={<>Refunds are handled directly by <strong>Stripe</strong> and <strong>Apple</strong> according to their policies. To request a refund for Apple purchases, go to your Apple ID account settings or visit Apple's support page. For Stripe purchases, contact us at <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a>.</>}
            />

            <FAQItem 
              question="What happens if I cancel my subscription?"
              answer="You will continue to have access to all premium features until the end of your current billing cycle. After that, your account will revert to the free version with limited features."
            />

            <FAQItem 
              question="What features are available in the free version?"
              answer="Free users can access basic people search functionality and limited features. Premium features like Username Search, Exposure Score, unlimited searches, and advanced research tools require a subscription."
            />

            <FAQItem 
              question="What tools and features does Reveal AI offer?"
              answer={
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li><strong>People Search:</strong> Search by name, phone, email, or address</li>
                  <li><strong>Records Search:</strong> Criminal, civil, bankruptcy, and eviction records</li>
                  <li><strong>Vehicle Search:</strong> Vehicle ownership information</li>
                  <li><strong>Username Search:</strong> Find social media profiles (Premium)</li>
                  <li><strong>Dark Web Scan:</strong> Check if your email has been compromised</li>
                  <li><strong>Exposure Score:</strong> Monitor your online exposure (Premium)</li>
                  <li><strong>Spam Blocker:</strong> Block unwanted calls</li>
                  <li><strong>Remove Data Brokers:</strong> Opt-out of data broker sites</li>
                  <li><strong>Unclaimed Money:</strong> Search for unclaimed funds</li>
                  <li><strong>Alert Monitoring:</strong> Get notified about dark web breaches and exposure changes</li>
                </ul>
              }
            />

            <FAQItem 
              question="Is Reveal AI available worldwide?"
              answer="Yes! Reveal AI can be downloaded and used globally, though some features may be restricted in certain regions."
            />

            <FAQItem 
              question="Is there an age requirement?"
              answer="You must be at least 13 years old to use Reveal AI. Users under 18 should have permission from a parent or guardian."
            />

            <FAQItem 
              question="How accurate are the results?"
              answer="Reveal AI uses advanced AI technology and aggregates information from public sources and third-party data providers to provide intelligent results, but we cannot guarantee 100% accuracy. Always verify important information independently."
            />

            <FAQItem 
              question="How do I report a source or incorrect information?"
              answer={<>If you find incorrect information or want to report a source, please contact us at <a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline">realrevealaiofficial@gmail.com</a> with details about the issue.</>}
            />

            <FAQItem 
              question="How do I contact support?"
              answer={<>For any questions, billing issues, or feedback, contact us at:<br /><a href="mailto:realrevealaiofficial@gmail.com" className="text-red-600 hover:underline font-medium">realrevealaiofficial@gmail.com</a></>}
            />
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback & Suggestions</h2>
          <p className="text-gray-600 mb-4">
            We'd love to hear from you! Your feedback helps us make <strong>Reveal AI – People Search</strong> smarter, more useful, and more enjoyable.
          </p>
          <div className="space-y-2 text-gray-600">
            <p><strong>💡 Share Your Ideas:</strong> Have a feature request or improvement idea? Let us know — we're always listening.</p>
            <p><strong>🛠 Report an Issue:</strong> If you run into a bug or something doesn't feel right, please include details about what happened so we can fix it quickly.</p>
          </div>
          <div className="mt-4">
            <a 
              href="mailto:realrevealaiofficial@gmail.com"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <Mail className="w-4 h-4" />
              Send feedback to realrevealaiofficial@gmail.com
            </a>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} RevealAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
