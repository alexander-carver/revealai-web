"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import { ArrowRight, CheckCircle2, Mail, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import {
  getSearchProduct,
  type SearchProductConfig,
  type SearchProductId,
} from "@/lib/search-products";

const COMPARISON_ORDER: SearchProductId[] = [
  "people",
  "social",
  "phone",
  "followers",
  "records",
  "vehicle",
];

const TESTIMONIALS: Array<{
  name: string;
  location: string;
  useCase: string;
  quote: string;
  imageSrc?: string;
  imageAlt?: string;
  widthClassName: string;
}> = [
  {
    name: "Mia R.",
    location: "Scottsdale, AZ",
    useCase: "Dating safety",
    quote:
      "I used RevealAI before meeting someone from an app and the Social search gave me a much clearer picture than manually checking profiles myself.",
    imageSrc: "/reviews/custom/review-person-01.png",
    imageAlt: "Review profile photo for Mia",
    widthClassName: "w-[320px] md:w-[360px]",
  },
  {
    name: "Chloe P.",
    location: "Nashville, TN",
    useCase: "Profile cross-check",
    quote:
      "The Detailed Report flow is the one I keep coming back to. I can start broad, get the key context fast, and decide if I need to go deeper.",
    imageSrc: "/reviews/custom/review-person-02.png",
    imageAlt: "Review profile photo for Chloe",
    widthClassName: "w-[340px] md:w-[380px]",
  },
  {
    name: "Lena C.",
    location: "San Diego, CA",
    useCase: "Marketplace check",
    quote:
      "Before meeting someone from Facebook Marketplace I ran a quick detailed report and it gave me enough context to feel a lot more comfortable about the meetup.",
    imageSrc: "/reviews/custom/review-person-03.png",
    imageAlt: "Review profile photo for Lena",
    widthClassName: "w-[330px] md:w-[370px]",
  },
  {
    name: "Adrian V.",
    location: "Los Angeles, CA",
    useCase: "Unknown caller check",
    quote:
      "The Phone search has become part of my routine. If a number looks weird, I can check it in seconds instead of wondering whether I should respond or block it.",
    imageSrc: "/reviews/custom/review-person-04.png",
    imageAlt: "Review profile photo for Adrian",
    widthClassName: "w-[340px] md:w-[380px]",
  },
  {
    name: "Hannah L.",
    location: "Chicago, IL",
    useCase: "Social lookup",
    quote:
      "Social helped me find public profile clues fast without jumping between tabs for twenty minutes. It made the whole trust check feel way cleaner.",
    imageSrc: "/reviews/custom/review-person-05.png",
    imageAlt: "Review profile photo for Hannah",
    widthClassName: "w-[320px] md:w-[350px]",
  },
  {
    name: "Caleb J.",
    location: "Tempe, AZ",
    useCase: "Vehicle lookup",
    quote:
      "Vehicle Lookup helped me catch a mismatch between what the seller said and what the car details actually suggested. That alone saved me hours.",
    imageSrc: "/reviews/custom/review-person-06.png",
    imageAlt: "Review profile photo for Caleb",
    widthClassName: "w-[350px] md:w-[390px]",
  },
  {
    name: "Melissa D.",
    location: "Dallas, TX",
    useCase: "Records search",
    quote:
      "I needed a cleaner records-first workflow for a higher-stakes situation, and RevealAI gave me one. It helped me focus on the part of the search that actually mattered.",
    imageSrc: "/reviews/custom/review-person-07.png",
    imageAlt: "Review profile photo for Melissa",
    widthClassName: "w-[340px] md:w-[380px]",
  },
  {
    name: "Andrew C.",
    location: "Raleigh, NC",
    useCase: "General due diligence",
    quote:
      "What I like most is that the page makes it obvious which search to start with. I can pick the right tool, run it fast, and stay in the same flow.",
    imageSrc: "/reviews/custom/review-person-08.png",
    imageAlt: "Review profile photo for Andrew",
    widthClassName: "w-[330px] md:w-[370px]",
  },
  {
    name: "Sofia N.",
    location: "Irvine, CA",
    useCase: "Reconnect search",
    quote:
      "I had almost no context beyond a name and city. RevealAI helped me narrow things down quickly and gave me enough confidence to know I had the right person.",
    imageSrc: "/reviews/custom/review-person-09.png",
    imageAlt: "Review profile photo for Sofia",
    widthClassName: "w-[340px] md:w-[380px]",
  },
  {
    name: "Tyler B.",
    location: "Charleston, SC",
    useCase: "Followers scan",
    quote:
      "Followers Search is surprisingly useful. The public follow patterns told me a lot faster than the profile itself ever could.",
    imageSrc: "/reviews/custom/review-person-10.png",
    imageAlt: "Review profile photo for Tyler",
    widthClassName: "w-[320px] md:w-[360px]",
  },
  {
    name: "Ava S.",
    location: "Orlando, FL",
    useCase: "Identity verification",
    quote:
      "Detailed Report gave me the wider context I wanted before I shared more personal information. It felt like the smartest place to start.",
    imageSrc: "/reviews/custom/review-person-11.png",
    imageAlt: "Review profile photo for Ava",
    widthClassName: "w-[320px] md:w-[355px]",
  },
  {
    name: "Jason W.",
    location: "Tampa, FL",
    useCase: "Meetup verification",
    quote:
      "I like that RevealAI helps me move from a quick suspicion to something more concrete. I do not need every tool every time, but it is nice knowing they are all there.",
    imageSrc: "/reviews/custom/review-person-12.png",
    imageAlt: "Review profile photo for Jason",
    widthClassName: "w-[340px] md:w-[380px]",
  },
];

const TESTIMONIAL_ROWS = [
  TESTIMONIALS.filter((_, index) => index % 2 === 0),
  TESTIMONIALS.filter((_, index) => index % 2 === 1),
];

const TRUST_SECTIONS = [
  {
    body: "RevealAI aggregates and organizes information from public records, open-web sources, commercial data providers, and other third-party datasets to help users research people, phone numbers, vehicles, filings, and other public-facing clues more efficiently. Coverage, freshness, and match quality can vary by jurisdiction, source availability, input accuracy, and the type of search being run. Not every report will contain every category of information, and no single result should be treated as a perfect or complete account of a person, profile, number, or vehicle.",
  },
  {
    body: "RevealAI is designed as an informational research and verification tool. It is not a consumer reporting agency, does not furnish consumer reports, and is not intended for use in employment decisions, tenant screening, credit eligibility, insurance underwriting, education admissions, or any other purpose regulated by the Fair Credit Reporting Act or similar state and local laws. If a decision carries legal, financial, housing, safety, or other material consequences, the underlying information should be independently reviewed and verified through the appropriate official channels.",
  },
  {
    title: "Source And Match Limitations",
    body: "Search outputs may reflect probabilistic matching, inferred links, public references, and source-level inconsistencies. Names can be shared by multiple people, phone numbers can change hands, records can be delayed, and social profiles can be incomplete or misleading. RevealAI helps organize those signals into a cleaner starting point, but responsible use still requires judgment, context, and follow-up where accuracy matters. We encourage users to treat results as a research aid rather than a final determination.",
  },
  {
    title: "Good-Faith And Lawful Use",
    body: "Users are responsible for complying with all applicable laws, platform rules, and privacy obligations when using RevealAI. The service is intended for personal verification, general research, and informational due diligence, not for harassment, stalking, discrimination, or any attempt to misuse personal data. Any action taken after reviewing results remains the sole responsibility of the user, and higher-stakes decisions should always include independent verification from official or primary sources.",
  },
  {
    title: "Support And Corrections",
    body: "Support questions, correction requests, and source concerns can be sent to realrevealaiofficial@gmail.com. If you believe information is outdated, misleading, or requires review, contacting support with specific details is the fastest way to help us investigate. For broader privacy rights and deletion requests related to account or support information, users should review the Privacy Policy and Terms before reaching out.",
  },
  {
    title: "AI-Generated Materials",
    body: "Certain materials on this website, including text, imagery, and other media, may be generated or enhanced using artificial intelligence technologies. No representation or warranty is made regarding the completeness, timeliness, or reliability of AI-generated illustrative content, and example visuals or testimonials displayed on the site should not be interpreted as legal, financial, or investigative advice.",
  },
];

function PromptImageSlot({
  label,
  prompt,
  referencePrompt,
  color,
  icon: Icon,
  imageSrc,
  imageAlt,
  tall = false,
}: {
  label: string;
  prompt: string;
  referencePrompt?: string;
  color: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  imageSrc?: string;
  imageAlt?: string;
  tall?: boolean;
}) {
  if (imageSrc) {
    return (
      <div
        className={`relative overflow-hidden rounded-[2rem] ${
          tall ? "aspect-[0.8/1]" : "aspect-square"
        }`}
        style={{
          boxShadow: "0 28px 60px -42px rgba(15, 23, 42, 0.24)",
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt ?? label}
          fill
          className="object-cover"
          sizes={tall ? "(max-width: 640px) 100vw, 360px" : "(max-width: 1024px) 100vw, 420px"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-[2rem] ${
          tall ? "aspect-[0.8/1]" : "aspect-square"
        }`}
        style={{
          background: `linear-gradient(180deg, ${color}14 0%, rgba(255,255,255,0.98) 100%)`,
          boxShadow: "0 28px 60px -42px rgba(15, 23, 42, 0.24)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top right, ${color}24 0%, transparent 56%)`,
          }}
        />
        <div
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.86)",
            color,
          }}
        >
          {label}
        </div>
        <div
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm"
          style={{ color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-gray-900">Image placeholder</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Swap this slot with your final product image when it&apos;s ready.
          </p>
        </div>
      </div>
      <div className="rounded-[1.25rem] bg-gray-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Primary generation prompt
        </p>
        <p className="mt-2 text-xs leading-5 text-gray-600">{prompt}</p>
      </div>
      {referencePrompt ? (
        <div className="rounded-[1.25rem] bg-gray-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Helpful reference image prompt
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-600">{referencePrompt}</p>
        </div>
      ) : null}
    </div>
  );
}

function TestimonialAvatar({
  imageSrc,
  imageAlt,
  placeholderLabel = "Photo",
}: {
  imageSrc?: string;
  imageAlt?: string;
  placeholderLabel?: string;
}) {
  if (imageSrc) {
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-md">
        <Image
          src={imageSrc}
          alt={imageAlt ?? "Review profile image placeholder"}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 ring-2 ring-white shadow-md">
      {placeholderLabel}
    </div>
  );
}

function getShowcaseGeneratedImages(productId: SearchProductId) {
  if (productId === "people") {
    return [
      "/home-showcase/generated/people-1.png",
      "/home-showcase/generated/people-2-v2.png",
      "/home-showcase/generated/people-3.png",
    ];
  }

  if (productId === "phone") {
    return [
      "/home-showcase/generated/phone-1.png",
      "/home-showcase/generated/phone-2-v2.png",
      "/home-showcase/generated/phone-3-v2.png",
    ];
  }

  if (productId === "vehicle") {
    return [
      "/home-showcase/generated/vehicle-1.png",
      "/home-showcase/generated/vehicle-2-v2.png",
      "/home-showcase/generated/vehicle-3.png",
    ];
  }

  return [
    `/home-showcase/generated/${productId}-1.png`,
    `/home-showcase/generated/${productId}-2.png`,
    `/home-showcase/generated/${productId}-3.png`,
  ];
}

function TestimonialCard({
  testimonial,
  mobile = false,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  mobile?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.8rem] bg-white ${
        mobile ? "w-[252px] p-5" : `${testimonial.widthClassName} p-6`
      }`}
      style={{
        boxShadow: "0 24px 60px -42px rgba(15, 23, 42, 0.22)",
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <TestimonialAvatar
              imageSrc={testimonial.imageSrc}
              imageAlt={testimonial.imageAlt}
            />
            <div>
              <p className="font-semibold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.location}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                key={starIndex}
                className="h-4 w-4 fill-emerald-500 text-emerald-500"
              />
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-gray-600">
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            {testimonial.useCase}
          </span>
        </div>
      </div>
    </article>
  );
}

function TestimonialMarqueeRow({
  testimonials,
  reverse = false,
  mobile = false,
}: {
  testimonials: (typeof TESTIMONIALS)[number][];
  reverse?: boolean;
  mobile?: boolean;
}) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`home-testimonial-track flex w-max ${
          reverse ? "home-testimonial-track-reverse" : ""
        }`}
      >
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            className={`flex ${mobile ? "gap-4 pr-4" : "gap-5 pr-5"}`}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${copyIndex}-${testimonial.name}-${index}-${mobile ? "mobile" : "desktop"}`}
                testimonial={testimonial}
                mobile={mobile}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileProductStoryCard({
  product,
  onOpenProduct,
  isTransparent = false,
}: {
  product: SearchProductConfig;
  onOpenProduct?: (productId: SearchProductId) => void;
  isTransparent?: boolean;
}) {
  const Icon = product.icon;
  const generatedImages = getShowcaseGeneratedImages(product.id);

  return (
    <ScrollReveal
      className={isTransparent ? "" : "rounded-[2rem] border border-gray-200 bg-white p-3"}
      distance={10}
    >
      <article
        className={`overflow-hidden ${isTransparent ? "py-4" : "rounded-[1.75rem] border p-4"}`}
        style={isTransparent ? {} : {
          borderColor: `${product.theme.primary}20`,
          background: `linear-gradient(180deg, ${product.theme.primary}10 0%, rgba(255,255,255,0.98) 34%, #ffffff 100%)`,
          boxShadow: `0 30px 80px -60px ${product.theme.shadow}`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
              {product.homeShowcase.eyebrow}
            </p>
            <h3 className="mt-3 text-[1.95rem] font-semibold leading-[1.02] tracking-[-0.04em] text-gray-900">
              {product.homeShowcase.titlePrefix}{" "}
              <span style={{ color: product.theme.primary }}>
                {product.homeShowcase.titleAccent}
              </span>{" "}
              {product.homeShowcase.titleSuffix}
            </h3>
          </div>
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border bg-white/90"
            style={{
              borderColor: product.theme.softBorder,
              color: product.theme.primary,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {generatedImages.slice(0, 2).map((imageSrc, index) => (
            <div
              key={imageSrc}
              className={`relative overflow-hidden rounded-[1.45rem] ${
                index === 0 ? "aspect-[0.78/1]" : "aspect-[0.9/1]"
              }`}
            >
              <Image
                src={imageSrc}
                alt={`${product.homeShowcase.displayLabel} mobile showcase ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 50vw, 260px"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[1.45rem] border border-white/80 bg-white/86 p-4 backdrop-blur-sm">
          <p className="text-lg font-semibold leading-tight text-gray-900">
            {product.homeShowcase.supportTitle}
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {product.homeShowcase.supportBody}
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-white/80 bg-white">
          <div className="relative aspect-[1.08/1] overflow-hidden">
            <Image
              src={generatedImages[2]}
              alt={`${product.homeShowcase.displayLabel} benefits showcase`}
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, 360px"
            />
          </div>
          <div className="p-4">
            <p className="text-xl font-semibold leading-tight text-gray-900">
              {product.homeShowcase.benefitsTitle}
            </p>
            <ul className="mt-4 space-y-2.5">
              {product.homeShowcase.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-[18px] w-[18px] flex-shrink-0"
                    style={{ color: product.theme.primary }}
                  />
                  <span className="text-sm leading-6 text-gray-600">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-5 w-full rounded-full py-6 text-white"
              style={{
                backgroundColor: product.theme.primary,
                boxShadow: `0 22px 48px -28px ${product.theme.shadow}`,
              }}
              onClick={() => {
                if (onOpenProduct) {
                  onOpenProduct(product.id);
                } else {
                  document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Search Using {product.label}
            </Button>
          </div>
        </div>
      </article>
    </ScrollReveal>
  );
}

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function HomeOtherProductsDropdown({
  onOpenProduct,
  activeProductId,
}: {
  onOpenProduct: (productId: SearchProductId) => void;
  activeProductId?: SearchProductId;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleProductIds = COMPARISON_ORDER.filter(
    (productId) => productId !== activeProductId
  );
  const comparisonProducts = visibleProductIds.map((productId) =>
    getSearchProduct(productId)
  );
  const desktopShowcaseProducts = visibleProductIds.map((productId) =>
    getSearchProduct(productId)
  );

  return (
    <>
      <div className="container mx-auto px-4 flex justify-center mb-8 -mt-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
        >
          Explore Other Searches
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${isOpen ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <section className="container mx-auto px-4 pb-20 pt-6 md:hidden">
          <ScrollReveal className="mx-auto max-w-sm text-center" distance={10}>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
              Search Tools
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-gray-900">
              Explore each RevealAI search in a cleaner mobile flow.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              We kept the page narrow, visual, and easy to scroll so each search
              type feels like its own focused story instead of a dense desktop
              grid squeezed onto a phone.
            </p>
          </ScrollReveal>

          <div className="mt-8 space-y-6">
            {comparisonProducts.map((product) => (
              <MobileProductStoryCard
                key={product.id}
                product={product}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </div>
        </section>

      <section className="hidden container mx-auto px-4 pb-24 md:block md:pb-28">
        <div className="space-y-20 md:space-y-24">
          {desktopShowcaseProducts.map((product) => {
            const [primaryImage, secondaryImage, supportingImage] =
              product.homeShowcase.imagePrompts;
            const Icon = product.icon;
            const generatedImages = getShowcaseGeneratedImages(product.id);

            return (
              <article key={product.id} className="mx-auto max-w-5xl">
                <div
                  className="relative overflow-hidden rounded-[2.5rem] px-6 py-8 md:px-8 md:py-10 lg:px-10"
                  style={{
                    background: `linear-gradient(180deg, ${product.theme.primary}12 0%, rgba(255,255,255,0.98) 38%, rgba(255,255,255,0.98) 100%)`,
                    border: `1px solid ${product.theme.primary}18`,
                    boxShadow: `0 36px 100px -78px ${product.theme.shadow}`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at top right, ${product.theme.primary}16 0%, transparent 32%), radial-gradient(circle at bottom left, ${product.theme.primary}10 0%, transparent 28%)`,
                    }}
                  />

                  <div className="relative grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12">
                  <ScrollReveal className="max-w-[25rem] space-y-6" distance={14}>
                    <PromptImageSlot
                      label={primaryImage.label}
                      prompt={primaryImage.prompt}
                      referencePrompt={primaryImage.referencePrompt}
                      color={product.theme.primary}
                      icon={Icon}
                      imageSrc={generatedImages[0]}
                      imageAlt={`${product.homeShowcase.displayLabel} primary showcase image`}
                    />

                    <div className="px-2">
                      <h3 className="text-[1.9rem] font-semibold leading-tight text-gray-900">
                        {product.homeShowcase.benefitsTitle}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {product.homeShowcase.benefits.map((benefit, benefitIndex) => (
                          <ScrollReveal
                            key={benefit}
                            as="li"
                            className="flex items-start gap-3"
                            delayMs={80 + benefitIndex * 38}
                            distance={8}
                            threshold={0.15}
                          >
                            <CheckCircle2
                              className="mt-0.5 h-5 w-5 flex-shrink-0"
                              style={{ color: product.theme.primary }}
                            />
                            <span className="text-sm leading-6 text-gray-600">
                              {benefit}
                            </span>
                          </ScrollReveal>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>

                  <div>
                    <ScrollReveal delayMs={40} distance={10}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                        {product.homeShowcase.eyebrow}
                      </p>
                      <h2 className="mt-3 max-w-[12ch] text-4xl font-bold tracking-[-0.04em] text-gray-900 md:text-[3.45rem] md:leading-[1.02]">
                        {product.homeShowcase.titlePrefix}{" "}
                        <span style={{ color: product.theme.primary }}>
                          {product.homeShowcase.titleAccent}
                        </span>{" "}
                        {product.homeShowcase.titleSuffix}
                      </h2>
                    </ScrollReveal>

                    <ScrollReveal
                      className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
                      delayMs={95}
                      distance={10}
                    >
                      <PromptImageSlot
                        label={secondaryImage.label}
                        prompt={secondaryImage.prompt}
                        referencePrompt={secondaryImage.referencePrompt}
                        color={product.theme.primary}
                        icon={Icon}
                        imageSrc={generatedImages[1]}
                        imageAlt={`${product.homeShowcase.displayLabel} lifestyle showcase image`}
                        tall
                      />
                      <PromptImageSlot
                        label={supportingImage.label}
                        prompt={supportingImage.prompt}
                        referencePrompt={supportingImage.referencePrompt}
                        color={product.theme.primary}
                        icon={Icon}
                        imageSrc={generatedImages[2]}
                        imageAlt={`${product.homeShowcase.displayLabel} supporting showcase image`}
                        tall
                      />
                    </ScrollReveal>

                    <ScrollReveal className="mt-8 max-w-md" delayMs={145} distance={9}>
                      <h3 className="text-[2rem] font-semibold leading-tight text-gray-900">
                        {product.homeShowcase.supportTitle}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-gray-600">
                        {product.homeShowcase.supportBody}
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="mt-7 gap-2 rounded-full px-7 py-6 text-white"
                        style={{
                          backgroundColor: product.theme.primary,
                          boxShadow: `0 22px 44px -24px ${product.theme.shadow}`,
                        }}
                        onClick={() => onOpenProduct(product.id)}
                      >
                        {product.homeShowcase.ctaLabel}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </ScrollReveal>
                  </div>
                </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      </div>
    </>
  );
}

export function HomeTestimonials() {
  return (
    <>
      <section className="container mx-auto px-4 pb-20 md:hidden">
        <ScrollReveal className="mx-auto max-w-sm text-center" distance={10}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
            Trusted By Users
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-gray-900">
            Search stories that feel real, not generic.
          </h2>
        </ScrollReveal>

        <div className="mt-8 space-y-4">
          <TestimonialMarqueeRow testimonials={TESTIMONIAL_ROWS[0]} mobile />
          <TestimonialMarqueeRow
            testimonials={TESTIMONIAL_ROWS[1]}
            mobile
            reverse
          />
        </div>
      </section>

      <section className="hidden container mx-auto px-4 pb-24 md:block md:pb-28">
        <ScrollReveal className="mx-auto max-w-3xl text-center" distance={10}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
            Those Who Chose RevealAI
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-gray-900 md:text-5xl">
            There&apos;s a reason people keep{" "}
            <span className="text-red-600">coming back to us.</span>
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            A wider mix of reviews, real profile-photo slots, and search stories
            that keep moving across the page instead of sitting still.
          </p>
        </ScrollReveal>

        <div className="mt-12 space-y-5">
          <ScrollReveal delayMs={70} distance={10}>
            <TestimonialMarqueeRow testimonials={TESTIMONIAL_ROWS[0]} />
          </ScrollReveal>
          <ScrollReveal delayMs={120} distance={10}>
            <TestimonialMarqueeRow
              testimonials={TESTIMONIAL_ROWS[1]}
              reverse
            />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

export function HomeTrustSection() {
  return (
    <section className="container mx-auto px-4 pb-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal
          className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
          distance={10}
        >
          <Logo size="md" />

          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <a
              href="mailto:realrevealaiofficial@gmail.com"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <Mail className="h-4 w-4" />
              realrevealaiofficial@gmail.com
            </a>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <Shield className="h-4 w-4" />
              Support Center
            </Link>
            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-8 w-full space-y-6 text-sm leading-8 text-gray-600">
          {TRUST_SECTIONS.map((section, index) => (
            <ScrollReveal
              key={`${section.title ?? "body"}-${section.body.slice(0, 24)}`}
              delayMs={index * 28}
              distance={8}
              threshold={0.12}
            >
              <p>{section.body}</p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal
          className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400"
          delayMs={80}
          distance={6}
        >
          <span>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</span>
          <Link href="/terms" className="transition hover:text-gray-600">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="transition hover:text-gray-600">
            Privacy Policy
          </Link>
          <Link href="/support" className="transition hover:text-gray-600">
            Support
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function ActiveProductShowcase({
  activeProductId,
}: {
  activeProductId: SearchProductId;
}) {
  const product = getSearchProduct(activeProductId);
  const [primaryImage, secondaryImage, supportingImage] = product.homeShowcase.imagePrompts;
  const Icon = product.icon;
  const generatedImages = getShowcaseGeneratedImages(product.id);

  return (
    <>
      <section className="container mx-auto px-4 pb-12 pt-6 md:hidden">
        <MobileProductStoryCard product={product} isTransparent />
      </section>

      <section className="hidden container mx-auto px-4 pb-16 md:block md:pb-20">
        <article className="mx-auto max-w-5xl">
          <div className="relative px-6 py-8 md:px-8 md:py-10 lg:px-10">
            <div className="relative grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12">
              <ScrollReveal className="max-w-[25rem] space-y-6" distance={14}>
                <PromptImageSlot
                  label={primaryImage.label}
                  prompt={primaryImage.prompt}
                  referencePrompt={primaryImage.referencePrompt}
                  color={product.theme.primary}
                  icon={Icon}
                  imageSrc={generatedImages[0]}
                  imageAlt={`${product.homeShowcase.displayLabel} primary showcase image`}
                />

                <div className="px-2">
                  <h3 className="text-[1.9rem] font-semibold leading-tight text-gray-900">
                    {product.homeShowcase.benefitsTitle}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {product.homeShowcase.benefits.map((benefit, benefitIndex) => (
                      <ScrollReveal
                        key={benefit}
                        as="li"
                        className="flex items-start gap-3"
                        delayMs={80 + benefitIndex * 38}
                        distance={8}
                        threshold={0.15}
                      >
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 flex-shrink-0"
                          style={{ color: product.theme.primary }}
                        />
                        <span className="text-sm leading-6 text-gray-600">
                          {benefit}
                        </span>
                      </ScrollReveal>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>

              <div>
                <ScrollReveal delayMs={40} distance={10}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                    {product.homeShowcase.eyebrow}
                  </p>
                  <h2 className="mt-3 max-w-[12ch] text-4xl font-bold tracking-[-0.04em] text-gray-900 md:text-[3.45rem] md:leading-[1.02]">
                    {product.homeShowcase.titlePrefix}{" "}
                    <span style={{ color: product.theme.primary }}>
                      {product.homeShowcase.titleAccent}
                    </span>{" "}
                    {product.homeShowcase.titleSuffix}
                  </h2>
                </ScrollReveal>

                <ScrollReveal
                  className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
                  delayMs={95}
                  distance={10}
                >
                  <PromptImageSlot
                    label={secondaryImage.label}
                    prompt={secondaryImage.prompt}
                    referencePrompt={secondaryImage.referencePrompt}
                    color={product.theme.primary}
                    icon={Icon}
                    imageSrc={generatedImages[1]}
                    imageAlt={`${product.homeShowcase.displayLabel} lifestyle showcase image`}
                    tall
                  />
                  <PromptImageSlot
                    label={supportingImage.label}
                    prompt={supportingImage.prompt}
                    referencePrompt={supportingImage.referencePrompt}
                    color={product.theme.primary}
                    icon={Icon}
                    imageSrc={generatedImages[2]}
                    imageAlt={`${product.homeShowcase.displayLabel} supporting showcase image`}
                    tall
                  />
                </ScrollReveal>

                <ScrollReveal className="mt-8 max-w-md" delayMs={145} distance={9}>
                  <h3 className="text-[2rem] font-semibold leading-tight text-gray-900">
                    {product.homeShowcase.supportTitle}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-gray-600">
                    {product.homeShowcase.supportBody}
                  </p>
                  
                  <Button
                    type="button"
                    size="lg"
                    className="mt-7 gap-2 rounded-full px-7 py-6 text-white"
                    style={{
                      backgroundColor: product.theme.primary,
                      boxShadow: `0 22px 44px -24px ${product.theme.shadow}`,
                    }}
                    onClick={() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Search Using {product.label}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
