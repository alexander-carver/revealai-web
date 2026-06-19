import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import {
  BASE_URL,
  getSearchExperiencePath,
  getProductThemeStyle,
  type SearchProductConfig,
} from "@/lib/search-products";

interface ProductLandingPageProps {
  product: SearchProductConfig;
}

export function ProductLandingPage({ product }: ProductLandingPageProps) {
  const Icon = product.icon;
  const style = getProductThemeStyle(product.id);
  const canonicalUrl = `${BASE_URL}${product.landingPath}`;
  const searchExperiencePath = getSearchExperiencePath(product.id);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: product.landing.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: product.metadata.landingTitle,
    description: product.metadata.landingDescription,
    url: canonicalUrl,
    about: {
      "@type": "Thing",
      name: product.label,
    },
  };

  return (
    <div
      className="min-h-screen bg-white"
      style={style}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <Link href={searchExperiencePath}>
            <Button
              size="sm"
              className="gap-2 text-white"
              style={{ backgroundColor: "var(--product-primary)" }}
            >
              <Icon className="w-4 h-4" />
              Open {product.label}
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section
          className="py-20 md:py-28"
          style={{
            background:
              "linear-gradient(180deg, var(--product-gradient-from) 0%, var(--product-gradient-to) 100%)",
          }}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
                style={{
                  backgroundColor: "var(--product-soft)",
                  borderColor: "var(--product-soft-border)",
                  color: "var(--product-primary)",
                }}
              >
                <Icon className="w-4 h-4" />
                {product.landing.badge}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {product.landing.titlePrefix}{" "}
                <span style={{ color: "var(--product-primary)" }}>
                  {product.landing.titleAccent}
                </span>{" "}
                {product.landing.titleSuffix}
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed mb-8">
                {product.landing.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={searchExperiencePath}>
                  <Button
                    size="lg"
                    className="gap-2 text-white px-8 py-6 rounded-full"
                    style={{
                      backgroundColor: "var(--product-primary)",
                      boxShadow: "0 18px 45px -22px var(--product-shadow)",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {product.landing.primaryCtaLabel}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                {product.landing.secondaryCtaHref &&
                  product.landing.secondaryCtaLabel && (
                    <Link href={product.landing.secondaryCtaHref}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 px-8 py-6 rounded-full"
                        style={{
                          borderColor: "var(--product-soft-border)",
                          color: "var(--product-primary)",
                        }}
                      >
                        {product.landing.secondaryCtaLabel}
                      </Button>
                    </Link>
                  )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                {product.landing.stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="p-5 border-0"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.82)",
                      boxShadow: "0 18px 40px -26px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: "var(--product-primary)" }}
                    >
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.landing.sectionTitle}
              </h2>
              <p className="text-lg text-gray-500">
                {product.landing.sectionDescription}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.landing.features.map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 border"
                  style={{ borderColor: "var(--product-soft-border)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "var(--product-soft)" }}
                  >
                    <feature.icon
                      className="w-7 h-7"
                      style={{ color: "var(--product-primary)" }}
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16"
          style={{ backgroundColor: "var(--product-surface)" }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.landing.useCasesTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {product.landing.useCases.map((useCase) => (
                <Card
                  key={useCase.title}
                  className="p-6 border-0"
                  style={{
                    backgroundColor: "white",
                    boxShadow: "0 18px 40px -28px rgba(15, 23, 42, 0.18)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "var(--product-soft)" }}
                    >
                      <useCase.icon
                        className="w-6 h-6"
                        style={{ color: "var(--product-primary)" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {useCase.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Questions people ask before they search
              </h2>
            </div>
            <div className="space-y-4">
              {product.landing.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border bg-white p-6"
                  style={{ borderColor: "var(--product-soft-border)" }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-gray-900">
                    <span>{item.question}</span>
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-12"
                      style={{ color: "var(--product-primary)" }}
                    />
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-gray-500">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-20"
          style={{
            background:
              "linear-gradient(135deg, var(--product-primary) 0%, var(--product-primary-hover) 100%)",
          }}
        >
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {product.landing.closingTitle}
            </h2>
            <p className="text-lg text-white/85 leading-relaxed mb-8">
              {product.landing.closingDescription}
            </p>
            <Link href={searchExperiencePath}>
              <Button
                size="lg"
                className="gap-2 rounded-full bg-white px-8 py-6"
                style={{ color: "var(--product-primary)" }}
              >
                {product.landing.primaryCtaLabel}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p className="text-xs max-w-5xl mx-auto mb-6 leading-relaxed">
            <strong>DISCLAIMER:</strong> RevealAI is not a Consumer Reporting Agency as defined by the Fair Credit Reporting Act (FCRA). The information provided by our service cannot be used to make decisions about consumer credit, employment, insurance, tenant screening, or any other purpose requiring FCRA compliance. All records are subject to availability and may not be completely accurate, up-to-date, or comprehensive.
          </p>
          <p>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link href="/blog" className="hover:text-gray-600">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-gray-600">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
