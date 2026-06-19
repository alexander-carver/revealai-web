import type { CSSProperties } from "react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  FileText,
  Flame,
  Globe,
  Heart,
  MapPin,
  Phone,
  Scale,
  Search,
  Shield,
  UserRoundSearch,
  Users,
  Waypoints,
} from "lucide-react";
import { getCanonicalSearchType } from "@/lib/search-routing";

export const BASE_URL = "https://revealai-peoplesearch.com";

export type SearchProductId =
  | "people"
  | "social"
  | "followers"
  | "phone"
  | "vehicle"
  | "records";

export type SearchInputMode = "person" | "phone" | "vin";

interface ProductTheme {
  primary: string;
  primaryHover: string;
  soft: string;
  softBorder: string;
  surface: string;
  surfaceAlt: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
}

interface LoadingStep {
  id: number;
  text: string;
  detail: string;
  completionTime: number;
}

interface LoadingTestimonial {
  title: string;
  quote: string;
}

interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface LandingStat {
  label: string;
  value: string;
}

interface LandingFaq {
  question: string;
  answer: string;
}

interface ProductMetadataConfig {
  landingTitle: string;
  landingDescription: string;
  landingKeywords: string[];
  toolTitle: string;
  toolDescription: string;
  toolKeywords: string[];
  ogTitle: string;
  ogSubtitle: string;
}

interface ProductHomeCopy {
  badge: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix: string;
  subtitle: string;
  ctaLabel: string;
  helperText: string;
}

interface HomeShowcaseImageSlot {
  label: string;
  prompt: string;
  referencePrompt: string;
}

interface ProductHomeShowcaseCopy {
  displayLabel: string;
  eyebrow: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix: string;
  benefitsTitle: string;
  benefits: string[];
  supportTitle: string;
  supportBody: string;
  ctaLabel: string;
  imagePrompts: HomeShowcaseImageSlot[];
}

interface ProductLandingCopy {
  badge: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  stats: LandingStat[];
  sectionTitle: string;
  sectionDescription: string;
  features: LandingFeature[];
  useCasesTitle: string;
  useCases: LandingFeature[];
  faq: LandingFaq[];
  closingTitle: string;
  closingDescription: string;
}

export interface SearchProductConfig {
  id: SearchProductId;
  label: string;
  menuLabel: string;
  icon: LucideIcon;
  inputMode: SearchInputMode;
  analyticsKey: string;
  searchType: string;
  landingPath: string;
  toolPath: string;
  usernameHelperPath?: string;
  theme: ProductTheme;
  home: ProductHomeCopy;
  homeShowcase: ProductHomeShowcaseCopy;
  landing: ProductLandingCopy;
  loading: {
    queryLabel: string;
    steps: LoadingStep[];
    testimonials: LoadingTestimonial[];
  };
  metadata: ProductMetadataConfig;
}

function createOgImageUrl(title: string, subtitle: string) {
  return `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
    subtitle
  )}`;
}

export const SEARCH_PRODUCTS: Record<SearchProductId, SearchProductConfig> = {
  people: {
    id: "people",
    label: "Full Report",
    menuLabel: "People Search",
    icon: Search,
    inputMode: "person",
    analyticsKey: "full_report",
    searchType: "fullreport",
    landingPath: "/people-search",
    toolPath: "/search",
    theme: {
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      soft: "#f8fafc",
      softBorder: "#e5e7eb",
      surface: "#ffffff",
      surfaceAlt: "#f8fafc",
      gradientFrom: "#ffffff",
      gradientTo: "#ffffff",
      shadow: "rgba(15, 23, 42, 0.12)",
    },
    home: {
      badge: "AI-Powered Search",
      titlePrefix: "Search",
      titleAccent: "Anyone",
      titleSuffix: "Instantly",
      subtitle: "People, records, and online context.",
      ctaLabel: "Search Records",
      helperText: "Best for a full identity and background snapshot.",
    },
    homeShowcase: {
      displayLabel: "Full Report Search",
      eyebrow: "Full report search",
      titlePrefix: "A",
      titleAccent: "Full Report Search",
      titleSuffix: "will show you the bigger picture",
      benefitsTitle: "What a Full Report Search can show you",
      benefits: [
        "Identity and location details",
        "Public-record clues in one place",
        "Online profile and web signals",
        "A strong first step when you only have a name",
        "A broader view before you run a more focused search",
      ],
      supportTitle: "Start here when you want the most information",
      supportBody:
        "A Full Report Search is the best first step when one clue is not enough. It helps you see the main facts fast, then decide if you should go deeper with phone, records, or dating app searches.",
      ctaLabel: "Open Full Report Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a people-search product. Show an open silver MacBook Air and a modern smartphone resting beside a neatly printed identity-report packet on a soft off-white and muted red seamless studio backdrop. The laptop screen must show a generic people-search style interface built from clean UI blocks, profile cards, subtle map-pin shapes, and neutral charts only, with no readable text, no logos, no browser chrome, and no distorted screen elements. Composition should feel like high-end editorial product photography, softly lit, realistic proportions, subtle shadow, minimal background, no clutter, no floating impossible objects, no CGI look, no illustration style, and absolutely no strange hardware misconfigurations.",
          referencePrompt:
            "Reference image idea: a luxury editorial studio photo of a silver laptop, a smartphone, and a printed dossier arranged on a pale blush seamless background with soft daylight, minimal composition, premium tech-meets-investigative styling, realistic product proportions, and no readable text.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Photorealistic editorial lifestyle image for a people-search landing page. Show a well-dressed adult seated at a clean white desk in a bright modern home office, carefully reviewing an identity report on an open silver MacBook Air. The laptop should be angled so the front screen is visible with a generic people-search dashboard made of neutral charts and abstract UI blocks only. The exterior lid and back of the laptop must stay plain brushed aluminum with absolutely no interface, no sticker, no reflection of a UI, no printed graphic, no logo, and no second-screen effect. Include one printed report sheet and a pen on the desk. Soft natural window light, believable hardware proportions, premium commercial photography, realistic hands, calm focused expression, and no readable text anywhere.",
          referencePrompt:
            "Reference image idea: candid premium lifestyle photo of a person doing due-diligence research on a laptop in a bright apartment office, soft natural light, minimal desk, grounded trustworthy mood, and polished commercial photography quality.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Ultra-realistic supporting detail image for a people-search product section. Show a close-up of hands using a silver laptop trackpad while a generic identity-report style interface is visible on screen beside a printed profile summary and a pen. The interface should contain only abstract cards, circles, lines, and muted UI blocks with no readable text, no logos, and no distorted screen behavior. Keep every exterior laptop surface plain and realistic with no UI stickers, no ghosted profile image on the lid, and no impossible second display. Soft window light, premium documentary-editorial realism, clean desk styling, accurate anatomy, correct object perspective, and absolutely no fantasy details such as floating screens, duplicated keyboards, or malformed hardware.",
          referencePrompt:
            "Reference image idea: over-the-shoulder premium desk photo showing hands on a laptop with printed background-check paperwork nearby, bright natural light, minimal palette, and realistic investigative workspace styling.",
        },
      ],
    },
    landing: {
      badge: "People Search",
      titlePrefix: "Run a smarter",
      titleAccent: "people search",
      titleSuffix: "before you trust what you see online",
      description:
        "Search names, cities, and states to uncover public records, address history, contact clues, and online presence signals in one RevealAI report.",
      primaryCtaLabel: "Start a Full Report",
      secondaryCtaLabel: "Search Public Records",
      secondaryCtaHref: "/public-records-search",
      stats: [
        { value: "500M+", label: "Public records indexed" },
        { value: "4.9/5", label: "Average user rating" },
        { value: "Fast", label: "Search turnaround" },
      ],
      sectionTitle: "What a RevealAI full report helps uncover",
      sectionDescription:
        "Built for high-intent lookups where you need more than one isolated data point.",
      features: [
        {
          icon: Users,
          title: "Identity and contact context",
          description:
            "Name-level lookup across public records, known aliases, address history, and associated details.",
        },
        {
          icon: Globe,
          title: "Online footprint discovery",
          description:
            "Spot the social profiles, websites, and public mentions tied to the person you searched.",
        },
        {
          icon: Shield,
          title: "Safety-first verification",
          description:
            "Useful before dates, sales meetings, local transactions, tenant screening, and reconnecting with someone new.",
        },
      ],
      useCasesTitle: "Why people start with Full Report",
      useCases: [
        {
          icon: Heart,
          title: "Dating safety checks",
          description:
            "Get a broader read on who you are talking to before moving a conversation offline.",
        },
        {
          icon: UserRoundSearch,
          title: "Reconnect and verify",
          description:
            "Find the right person faster when names are common and context matters.",
        },
        {
          icon: MapPin,
          title: "Local deal confidence",
          description:
            "Use address and identity context before meeting someone from a marketplace or classifieds app.",
        },
      ],
      faq: [
        {
          question: "What does a full report search include?",
          answer:
            "RevealAI blends public-record context, address history, and online presence signals into one search flow so you can verify someone faster.",
        },
        {
          question: "Is this only for criminal background checks?",
          answer:
            "No. Full Report is broader than a records-only search and is designed to give context across identity, contact, and online footprint signals.",
        },
        {
          question: "When should I use Full Report instead of another tool?",
          answer:
            "Use it when you want the widest snapshot first, then drill deeper into phone, records, vehicle, or social-specific searches if needed.",
        },
      ],
      closingTitle: "Start with the broadest picture first",
      closingDescription:
        "Run a RevealAI full report when you need a high-intent lookup that combines people search, public records, and online context.",
    },
    loading: {
      queryLabel: "Building a full report on",
      steps: [
        {
          id: 1,
          text: "Scanning public records...",
          detail: "Names, addresses, filings, and records signals",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Cross-checking identity data...",
          detail: "Matching people, locations, and related records",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Reviewing online presence...",
          detail: "Profiles, mentions, and searchable web context",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Compiling the RevealAI report...",
          detail: "Organizing the most relevant verified details",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing your results...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Useful Before Meeting Anyone",
          quote:
            "I wanted a quick, broad check before meeting someone in person. RevealAI gave me the extra context I needed.",
        },
        {
          title: "Much Faster Than Searching Manually",
          quote:
            "Instead of jumping between sites, I could start with one full report and then decide what to dig into next.",
        },
        {
          title: "Great for Verification",
          quote:
            "The full report helped me confirm I had the right person before I kept going.",
        },
      ],
    },
    metadata: {
      landingTitle: "People Search - Full Reports, Public Records & Online Presence",
      landingDescription:
        "Run a RevealAI people search to find public records, address history, online presence clues, and background context from one high-intent search flow.",
      landingKeywords: [
        "people search",
        "people finder",
        "background report",
        "find anyone",
        "public records search",
        "person search",
        "online presence search",
      ],
      toolTitle: "Full Report Tool - Search People by Name",
      toolDescription:
        "Use RevealAI's full report tool to search by first name, last name, city, and state.",
      toolKeywords: [
        "full report tool",
        "people search tool",
        "search by name",
        "person report",
      ],
      ogTitle: "RevealAI People Search",
      ogSubtitle: "Full reports, public records, and online presence in one search",
    },
  },
  social: {
    id: "social",
    label: "Dating Apps",
    menuLabel: "Dating Apps",
    icon: Flame,
    inputMode: "person",
    analyticsKey: "dating_apps",
    searchType: "social",
    landingPath: "/dating-app-search",
    toolPath: "/social",
    usernameHelperPath: "/?product=social&mode=username#search",
    theme: {
      primary: "#E1306C",
      primaryHover: "#C13584",
      soft: "#FFF1F7",
      softBorder: "#F6C7D8",
      surface: "#FFF8FB",
      surfaceAlt: "#FFF2F8",
      gradientFrom: "#FFF3FA",
      gradientTo: "#FFF2E8",
      shadow: "rgba(225, 48, 108, 0.28)",
    },
    home: {
      badge: "Dating Discovery",
      titlePrefix: "Search",
      titleAccent: "Dating Apps",
      titleSuffix: "and Social Profiles",
      subtitle:
        "Dating apps, public profiles, and online clues.",
      ctaLabel: "Search Dating Apps",
      helperText: "Dating app checks, catfish clues, and public profile discovery.",
    },
    homeShowcase: {
      displayLabel: "Dating App Search",
      eyebrow: "Dating app search",
      titlePrefix: "A",
      titleAccent: "Dating App Search",
      titleSuffix: "will check dating apps and public profiles",
      benefitsTitle: "What a Dating App Search can show you",
      benefits: [
        "Public dating-profile clues",
        "Linked social profiles and web signals",
        "A faster way to check if the story matches",
        "Helpful before dates, meetups, and new conversations",
        "A cleaner starting point than searching app by app",
      ],
      supportTitle: "Check dating apps and public clues in one place",
      supportBody:
        "A Dating App Search helps you see whether someone's public dating and profile footprint lines up with what they told you. It is built for faster trust checks without the manual work.",
      ctaLabel: "Open Dating App Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a dating and social-profile search product. Show a latest-generation Apple iPhone Pro standing upright on a soft blush and cream seamless background with a subtle reflection. The screen should display a generic modern dating-profile style layout with clean image blocks, heart or profile-style icon shapes, and card sections only, with no readable text, no app logos, no browser chrome, and no fake Android styling. The phone must be physically accurate, premium, front-facing, with correct Apple-style proportions, realistic glass reflections, no extra camera holes, no second screen, and no screen on the back. Editorial studio photography, crisp but soft lighting, premium conversion-focused ecommerce quality, no clutter, no weird UI glitches.",
          referencePrompt:
            "Reference image idea: premium beauty-tech campaign photo of a single iPhone on a pale pink seamless backdrop, elegant minimal styling, luxury reflections, believable screen glow, and no readable text or logos.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Ultra-realistic candid lifestyle image for a social verification product. Show a stylish adult seated in a bright cafe or apartment, holding a latest-generation iPhone and reviewing a generic public-profile or dating-profile screen. The moment should feel natural and relevant to trust-checking before a date: alert but composed, not exaggerated. Keep the phone hardware unmistakably premium and Apple-like, with one correct front screen only, no distorted bezels, and no low-quality Android appearance. The on-screen UI should be generic profile cards and image blocks only, with no readable text, no app branding, and no broken interface artifacts. Soft daylight, polished editorial photography, accurate skin and hands, realistic candid posture.",
          referencePrompt:
            "Reference image idea: candid luxury lifestyle photo of a young adult checking a dating-profile style screen on an iPhone in a naturally lit cafe, premium campaign quality, warm neutrals, and believable human expression.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Ultra-realistic supporting close-up for a social search landing page. Show an over-the-shoulder view of a hand holding a latest-generation iPhone with a generic social grid or profile-review interface on screen while the background softly suggests a cafe or city setting. The image should communicate public-profile verification, not generic texting. Screen content must be high-end and believable, made of profile-photo blocks and clean neutral interface shapes only, with no readable text, no logos, and no strange icons. The device must look exactly like a premium modern iPhone with correct edges, camera bump, and front display orientation. Natural light, commercial editorial realism, no warped fingers, no extra hands, no surreal composition.",
          referencePrompt:
            "Reference image idea: premium over-the-shoulder iPhone photo showing a generic social profile grid in a bright real-world setting, shallow depth of field, elegant warm tones, and brand-campaign realism.",
        },
      ],
    },
    landing: {
      badge: "Dating Apps Search",
      titlePrefix: "Find hidden",
      titleAccent: "dating app",
      titleSuffix: "profiles and public social clues faster",
      description:
        "Use RevealAI to search for dating app activity, linked social media profiles, and public online presence signals when you need a sharper dating-safety check.",
      primaryCtaLabel: "Search Dating Apps",
      secondaryCtaLabel: "Search by Username",
      secondaryCtaHref: "/?product=social&mode=username#search",
      stats: [
        { value: "100+", label: "Platforms reviewed" },
        { value: "Fast", label: "Initial online scan" },
        { value: "Safer", label: "First-date research" },
      ],
      sectionTitle: "What Dating Apps search is built for",
      sectionDescription:
        "This product is positioned around high-intent identity, dating-safety, and public online footprint checks.",
      features: [
        {
          icon: Heart,
          title: "Dating app profile discovery",
          description:
            "Look for visible clues tied to dating apps and relationship-related online presence.",
        },
        {
          icon: Globe,
          title: "Social profile discovery",
          description:
            "Surface social and web profiles that help you verify whether someone is who they say they are.",
        },
        {
          icon: Shield,
          title: "Catfish and safety context",
          description:
            "Use a broader online footprint check before dates, meetups, or giving out personal information.",
        },
      ],
      useCasesTitle: "Why users run Dating Apps searches",
      useCases: [
        {
          icon: Shield,
          title: "First-date verification",
          description:
            "Run a name-based search before meeting someone from Tinder, Hinge, Bumble, or another app.",
        },
        {
          icon: Waypoints,
          title: "Digital footprint review",
          description:
            "Get a faster starting point when you want to find someone's public profiles and online mentions.",
        },
        {
          icon: Users,
          title: "Trust and consistency checks",
          description:
            "Compare what someone told you with the public information you can independently verify.",
        },
      ],
      faq: [
        {
          question: "Is Dating Apps only for dating apps?",
          answer:
            "No. The product is dating-safety focused, but the underlying search also looks for broader public social profile and online presence clues.",
        },
        {
          question: "Can I search by username too?",
          answer:
            "Yes. RevealAI keeps a username search utility as a secondary flow when you already know a handle.",
        },
        {
          question: "When should I use this instead of Full Report?",
          answer:
            "Use Dating Apps when your main question is about dating profiles, social accounts, or web presence rather than a broader background snapshot.",
        },
      ],
      closingTitle: "A smarter dating-safety and online-presence search",
      closingDescription:
        "Start with Dating Apps when you want focused digital-footprint research tied to a real person.",
    },
    loading: {
      queryLabel: "Tracing social and dating profiles for",
      steps: [
        {
          id: 1,
          text: "Checking social platforms...",
          detail: "Instagram, Facebook, X, TikTok, Reddit, and more",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Looking for dating app signals...",
          detail: "Relationship clues, usernames, and linked profiles",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Connecting profile matches...",
          detail: "Comparing names, locations, and public web mentions",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Preparing your online presence summary...",
          detail: "Prioritizing the strongest profile matches",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing the social scan...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Helpful Before a First Date",
          quote:
            "I wanted to know if the story lined up before meeting in person. The social scan gave me a better feel for what was real.",
        },
        {
          title: "Found the Right Profiles Quickly",
          quote:
            "It saved me from manually checking app after app and helped me narrow down the real accounts faster.",
        },
        {
          title: "Great for Online Presence Checks",
          quote:
            "RevealAI gave me a strong starting point for seeing where someone actually shows up online.",
        },
      ],
    },
    metadata: {
      landingTitle: "Dating App Search - Find Social Profiles & Hidden Dating Accounts",
      landingDescription:
        "Search dating app profiles, social media accounts, and broader online presence clues with RevealAI's dating-safety focused search flow.",
      landingKeywords: [
        "dating app search",
        "find hidden dating profiles",
        "social media search",
        "catfish checker",
        "find dating profiles",
        "search dating apps",
        "online presence check",
      ],
      toolTitle: "Dating Apps Tool - Search Profiles by Name",
      toolDescription:
        "Run a name-based search for social profiles, dating app clues, and online presence signals.",
      toolKeywords: [
        "social profile search",
        "online presence search",
        "dating profile search tool",
        "search social accounts by name",
      ],
      ogTitle: "RevealAI Dating Apps Search",
      ogSubtitle: "Dating app profile discovery, social accounts, and online presence checks",
    },
  },
  followers: {
    id: "followers",
    label: "Followers Search",
    menuLabel: "Followers Search",
    icon: Users,
    inputMode: "person",
    analyticsKey: "followers_search",
    searchType: "followers",
    landingPath: "/follower-search",
    toolPath: "/followers",
    usernameHelperPath: "/?product=followers&mode=username#search",
    theme: {
      primary: "#FD5068",
      primaryHover: "#E84961",
      soft: "#FFF1F4",
      softBorder: "#FBC8D1",
      surface: "#FFF6F8",
      surfaceAlt: "#FFE8ED",
      gradientFrom: "#FFF4F6",
      gradientTo: "#FFF9F9",
      shadow: "rgba(253, 80, 104, 0.26)",
    },
    home: {
      badge: "Follower Red Flags",
      titlePrefix: "Check",
      titleAccent: "Followers",
      titleSuffix: "for Red Flags",
      subtitle:
        "Public follower patterns, non-follow-backs, and suspicious account clusters.",
      ctaLabel: "Search Followers",
      helperText:
        "Public follower patterns, one-sided follows, and suspicious social graph signals.",
    },
    homeShowcase: {
      displayLabel: "Followers Search",
      eyebrow: "Followers search",
      titlePrefix: "A",
      titleAccent: "Followers Search",
      titleSuffix: "will show you public follow-pattern red flags",
      benefitsTitle: "What a Followers Search can show you",
      benefits: [
        "Who they follow that does not follow back",
        "Suspicious public account clusters",
        "Follow patterns that feel off",
        "A faster read on public profile behavior",
        "Simple signals you can review at a glance",
      ],
      supportTitle: "See public red flags faster",
      supportBody:
        "A Followers Search helps you spot the public patterns that are easy to miss when you scroll manually. It is useful when the follow graph itself is the thing you want to check.",
      ctaLabel: "Open Followers Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a follower-analysis product. Show a silver MacBook on a pale pink seamless studio backdrop displaying a generic follower-pattern dashboard with profile circles, connection lines, simple chart blocks, and count modules only. The screen must feel like social-graph analysis, not a spreadsheet, and it must contain no readable text, no logos, no browser chrome, and no broken UI fragments. Keep the hardware clean and realistic, with correct keyboard, trackpad, and screen perspective. The composition should feel like high-end editorial product photography for a premium trust-and-verification brand, with soft shadows, restrained styling, and absolutely no floating impossible elements or low-quality CGI texture.",
          referencePrompt:
            "Reference image idea: luxury studio photo of a laptop showing an abstract social-network dashboard on a blush backdrop, clean composition, soft premium lighting, realistic hardware, and no readable text.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Ultra-realistic candid lifestyle image for a followers red-flag search product. Show a person casually but intently reviewing a generic follower list or public profile network on a latest-generation iPhone while seated in a bright apartment or cafe. The emotional tone should be thoughtful and observant, like they are evaluating social proof. The device must be a premium modern iPhone only, with physically accurate hardware and a believable front-facing screen. The interface should use generic avatar circles, follow indicators, and clean neutral UI modules with no readable text, no app branding, and no distorted duplicate screen elements. Natural daylight, premium lifestyle photography, accurate hands, no awkward anatomy.",
          referencePrompt:
            "Reference image idea: commercial lifestyle photo of someone analyzing a follower list on an iPhone in a clean modern interior, soft daylight, subtle pink palette, and realistic candid posture.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Ultra-realistic supporting detail image for a follower-pattern landing page. Show an over-the-shoulder or side-angle close-up of a laptop or iPhone screen with a believable generic follow-graph interface made of profile-image circles, connection nodes, and simple trust-signal cards, while a person studies it in a minimal workspace. The scene must feel directly tied to public follow-pattern analysis, not generic social media browsing. No readable text, no logos, no broken UI, no extra monitors, no warped hands, and no synthetic-looking faces on the screen. Premium editorial realism, clean composition, shallow depth of field, and elegant conversion-focused product storytelling.",
          referencePrompt:
            "Reference image idea: close premium photo of a person reviewing an abstract follower-network interface in a modern workspace, believable UI nodes and avatars, soft light, and luxury brand polish.",
        },
      ],
    },
    landing: {
      badge: "Follower Red Flag Checker",
      titlePrefix: "Search public",
      titleAccent: "followers",
      titleSuffix: "for red flags, one-sided follows, and suspicious account patterns",
      description:
        "Use RevealAI Followers Search to review public follower and following signals, spot people who do not follow back, and flag suspicious account clusters tied to a real social presence.",
      primaryCtaLabel: "Start Followers Search",
      secondaryCtaLabel: "Search by Username",
      secondaryCtaHref: "/?product=followers&mode=username#search",
      stats: [
        { value: "Public", label: "Signals only" },
        { value: "Fast", label: "Red-flag scan" },
        { value: "Clear", label: "Follow-back clues" },
      ],
      sectionTitle: "What Followers Search is built to flag",
      sectionDescription:
        "Designed for public-account reviews where the social graph itself becomes part of the trust signal.",
      features: [
        {
          icon: Users,
          title: "One-sided follow patterns",
          description:
            "Identify accounts they appear to follow that do not follow back when public lists and profile links make that visible.",
        },
        {
          icon: Heart,
          title: "Suspicious following mix",
          description:
            "Spot heavy patterns of thirst-trap, creator, or apparent women or men they do not seem personally connected to.",
        },
        {
          icon: Shield,
          title: "Low-trust account clusters",
          description:
            "Surface bot-like, burner, or engagement-bait account patterns that may change how you interpret the profile.",
        },
      ],
      useCasesTitle: "Why users run Followers Search",
      useCases: [
        {
          icon: Heart,
          title: "Relationship trust checks",
          description:
            "Review public follower behavior when you want more context than a single bio or photo grid can provide.",
        },
        {
          icon: Globe,
          title: "Public account vetting",
          description:
            "Use visible follow-back patterns and audience quality clues to assess whether an account feels authentic.",
        },
        {
          icon: Waypoints,
          title: "Consistency reviews",
          description:
            "Compare what an account projects publicly with the broader network signals visible around it.",
        },
      ],
      faq: [
        {
          question: "Does Followers Search inspect private follower lists?",
          answer:
            "No. RevealAI only reviews publicly visible follower and following signals, searchable profile links, and open-web evidence.",
        },
        {
          question: "What kinds of red flags can it highlight?",
          answer:
            "Followers Search can call out one-sided follows, suspicious following ratios, visible clusters of low-trust accounts, and heavy patterns that look inconsistent with the profile story.",
        },
        {
          question: "When should I use this instead of Dating Apps?",
          answer:
            "Use Followers Search when the social graph is the main question. Use Dating Apps when you want broader dating-profile discovery and public online presence clues.",
        },
      ],
      closingTitle: "See the public signals hiding in the follow graph",
      closingDescription:
        "Start with Followers Search when you want a fast read on public social network red flags before you make a judgment call.",
    },
    loading: {
      queryLabel: "Reviewing public follower signals for",
      steps: [
        {
          id: 1,
          text: "Checking public profile networks...",
          detail: "Instagram, TikTok, X, and other public social surfaces",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Comparing follower and following patterns...",
          detail: "Ratios, one-sided follows, and visible account overlap",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Scanning for suspicious clusters...",
          detail: "Possible burner, bait, or low-trust account groups",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Summarizing follower red flags...",
          detail: "Prioritizing the clearest network signals",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing the follower review...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Caught the One-Sided Follows Fast",
          quote:
            "It gave me a quick read on who was not following back and where the public network felt off.",
        },
        {
          title: "Useful for Public Account Sanity Checks",
          quote:
            "The follower review helped me spot weird account patterns I would have missed skimming the profile myself.",
        },
        {
          title: "Helpful Context Before Jumping to Conclusions",
          quote:
            "It turned a messy public profile into a simple summary of the signals that actually mattered.",
        },
      ],
    },
    metadata: {
      landingTitle: "Follower Search - Check Follower Red Flags & Follow-Back Patterns",
      landingDescription:
        "Use RevealAI Followers Search to analyze public follower red flags, one-sided follows, suspicious account clusters, and follow-back patterns tied to someone's social presence.",
      landingKeywords: [
        "follower search",
        "followers search",
        "follower red flags",
        "who doesn't follow back",
        "instagram follower checker",
        "follow back checker",
        "social media red flags",
      ],
      toolTitle: "Followers Search Tool - Check Public Follower Red Flags",
      toolDescription:
        "Run a name-based follower search to review public follow-back patterns, suspicious account clusters, and other social red flags.",
      toolKeywords: [
        "followers search tool",
        "follower red flags",
        "who does not follow back",
        "public follower checker",
      ],
      ogTitle: "RevealAI Followers Search",
      ogSubtitle: "Follower red flags, non-follow-backs, and suspicious account patterns",
    },
  },
  phone: {
    id: "phone",
    label: "Phone Search",
    menuLabel: "Phone Lookup",
    icon: Phone,
    inputMode: "phone",
    analyticsKey: "reverse_phone_lookup",
    searchType: "phone",
    landingPath: "/reverse-phone-lookup",
    toolPath: "/phone",
    theme: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      soft: "#eff6ff",
      softBorder: "#bfdbfe",
      surface: "#f0f7ff",
      surfaceAlt: "#dbeafe",
      gradientFrom: "#eff6ff",
      gradientTo: "#ffffff",
      shadow: "rgba(37, 99, 235, 0.22)",
    },
    home: {
      badge: "Caller Verification",
      titlePrefix: "Identify",
      titleAccent: "Unknown Callers",
      titleSuffix: "in Seconds",
      subtitle: "Caller info and spam checks.",
      ctaLabel: "Lookup Number",
      helperText: "Best for robocalls, missed calls, and scam checks.",
    },
    homeShowcase: {
      displayLabel: "Phone Search",
      eyebrow: "Phone search",
      titlePrefix: "A",
      titleAccent: "Phone Search",
      titleSuffix: "will help identify unknown callers",
      benefitsTitle: "What a Phone Search can show you",
      benefits: [
        "Who may be behind the number",
        "Carrier and line-type details",
        "Spam and scam clues",
        "A quick check before you call or text back",
        "A simple way to sort real outreach from noise",
      ],
      supportTitle: "See who is behind the number before you respond",
      supportBody:
        "A Phone Search is built for quick decisions. When a number keeps showing up, it helps you get the basic context fast so you know whether to answer, ignore, or block it.",
      ctaLabel: "Open Phone Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a reverse-phone-lookup product. Show a latest-generation Apple iPhone Pro lying on a clean pale blue seamless background with a single believable incoming-call or unknown-caller style screen visible. The phone must be physically accurate and premium, with correct front glass, correct bezel proportions, realistic reflections, and no hardware mistakes such as a screen on the back, duplicate buttons, or malformed camera shapes. The on-screen interface should be simple and generic with circular answer-decline affordances and no readable phone number, no readable text, no carrier labels, and no app branding. High-end editorial product photography, subtle shadow, elegant minimalism, and absolutely no low-quality Android appearance.",
          referencePrompt:
            "Reference image idea: premium studio shot of a single iPhone on a soft blue seamless backdrop showing a generic incoming-call interface, luxury reflections, minimal composition, and realistic Apple hardware.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Photorealistic lifestyle image for an unknown-caller verification page. Show an adult in a bright modern kitchen or living room calmly checking a premium current-generation iPhone after a missed call. The phone hardware must look unmistakably like a real iPhone with realistic bezels, buttons, front camera placement, and iOS styling. The screen should show a clean native iOS missed-call or recents-style interface only, with no Android traits, no duplicated labels, no repeated fake words, no visible carrier branding, and no readable phone number. Soft daylight, subtle background blur, natural skin texture, realistic hands, and polished commercial realism.",
          referencePrompt:
            "Reference image idea: premium candid photo of someone checking a missed call on an iPhone in a bright home interior, soft daylight, believable expression, and polished commercial realism.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Photorealistic product close-up for a reverse-phone-lookup section. Show a hand holding a current-generation iPhone in soft daylight. The screen should display a native iOS incoming-call interface for an unknown caller with simple accept and decline affordances only. The hardware must be clearly iPhone-like with accurate button placement, speaker area, front camera island, and realistic proportions. No Android UI, no extra buttons, no duplicated fake labels, no readable phone number, no logos, and no malformed fingers. Premium commercial photography, crisp focus on the phone, softly blurred background, and natural reflections only.",
          referencePrompt:
            "Reference image idea: close luxury product-lifestyle photo of a hand holding an iPhone during an unknown-call decision moment, minimal UI, blue-toned natural light, and crisp realistic hardware.",
        },
      ],
    },
    landing: {
      badge: "Reverse Phone Lookup",
      titlePrefix: "Find out",
      titleAccent: "who called",
      titleSuffix: "before you call or text back",
      description:
        "Run a reverse phone lookup to identify unknown callers, review spam flags, and see the most useful context tied to a number.",
      primaryCtaLabel: "Lookup a Number Now",
      secondaryCtaLabel: "Run a Full Report",
      secondaryCtaHref: "/people-search",
      stats: [
        { value: "Fast", label: "Lookup experience" },
        { value: "Spam", label: "Flagging support" },
        { value: "Clear", label: "Carrier details" },
      ],
      sectionTitle: "What a reverse phone lookup can reveal",
      sectionDescription:
        "Designed for people who need fast caller verification without starting from a full background report.",
      features: [
        {
          icon: Users,
          title: "Owner information",
          description:
            "Identify the likely owner, associated location signals, and useful public context tied to a phone number.",
        },
        {
          icon: Phone,
          title: "Carrier and line details",
          description:
            "Understand the type of number you are dealing with and whether it looks like a mobile, landline, or VoIP line.",
        },
        {
          icon: Shield,
          title: "Spam and scam checks",
          description:
            "Look for signals that help you decide whether to block, ignore, or investigate a caller.",
        },
      ],
      useCasesTitle: "Why users run phone lookups",
      useCases: [
        {
          icon: Shield,
          title: "Missed-call verification",
          description:
            "Check an unfamiliar number before you return a call or respond to a text.",
        },
        {
          icon: Users,
          title: "Sales or lead validation",
          description:
            "Confirm whether a number appears legitimate before sharing time or information.",
        },
        {
          icon: MapPin,
          title: "Personal safety",
          description:
            "Get more context when repeated calls or messages make you uneasy.",
        },
      ],
      faq: [
        {
          question: "What can RevealAI tell me about a phone number?",
          answer:
            "RevealAI focuses on owner clues, location and carrier context, and whether a number appears to have spam or scam-related signals.",
        },
        {
          question: "When should I use reverse phone lookup instead of people search?",
          answer:
            "Use reverse phone lookup when the phone number is the strongest clue you have and you need fast caller verification.",
        },
        {
          question: "Can I use the result to decide whether to block a number?",
          answer:
            "Yes. Many users start here specifically to decide whether an unknown caller looks legitimate or should be ignored.",
        },
      ],
      closingTitle: "Get clarity before you answer",
      closingDescription:
        "Run a reverse phone lookup whenever an unknown number needs context before you engage.",
    },
    loading: {
      queryLabel: "Running reverse phone lookup for",
      steps: [
        {
          id: 1,
          text: "Normalizing the phone number...",
          detail: "Checking formatting, line type, and carrier signals",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Checking caller identity clues...",
          detail: "Owner names, associated locations, and public references",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Reviewing spam reports...",
          detail: "Looking for robocall and scam-related patterns",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Building your phone lookup summary...",
          detail: "Preparing the most useful caller context",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing number details...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Great for Missed Calls",
          quote:
            "I use this whenever a random number keeps calling. It gives me enough context to know if I should care.",
        },
        {
          title: "Better Than Guessing",
          quote:
            "The phone search helped me sort legitimate calls from obvious spam much faster.",
        },
        {
          title: "Useful Scam Check",
          quote:
            "I wanted a quick read before responding, and the lookup gave me exactly that.",
        },
      ],
    },
    metadata: {
      landingTitle: "Reverse Phone Lookup - Find Out Who Called You",
      landingDescription:
        "Use RevealAI reverse phone lookup to identify unknown callers, check spam signals, and review useful owner and carrier context.",
      landingKeywords: [
        "reverse phone lookup",
        "who called me",
        "phone number lookup",
        "spam caller lookup",
        "caller id lookup",
        "unknown caller search",
      ],
      toolTitle: "Phone Search Tool - Reverse Phone Lookup",
      toolDescription:
        "Use RevealAI's phone search tool to look up an unknown number and review owner, carrier, and spam signals.",
      toolKeywords: [
        "reverse phone lookup tool",
        "phone search tool",
        "lookup phone number",
      ],
      ogTitle: "RevealAI Reverse Phone Lookup",
      ogSubtitle: "Find who called, check spam signals, and identify unknown numbers",
    },
  },
  vehicle: {
    id: "vehicle",
    label: "Vehicle Lookup",
    menuLabel: "Vehicle Lookup",
    icon: Car,
    inputMode: "vin",
    analyticsKey: "vehicle_lookup",
    searchType: "vehicle",
    landingPath: "/vehicle-lookup",
    toolPath: "/vehicle",
    theme: {
      primary: "#16a34a",
      primaryHover: "#15803d",
      soft: "#f0fdf4",
      softBorder: "#bbf7d0",
      surface: "#f4fff7",
      surfaceAlt: "#dcfce7",
      gradientFrom: "#f0fdf4",
      gradientTo: "#ffffff",
      shadow: "rgba(22, 163, 74, 0.22)",
    },
    home: {
      badge: "Vehicle Lookup",
      titlePrefix: "Decode",
      titleAccent: "Any Vehicle",
      titleSuffix: "",
      subtitle: "VIN and plate lookups.",
      ctaLabel: "Search Vehicle",
      helperText: "VIN and plate lookups for quick vehicle checks.",
    },
    homeShowcase: {
      displayLabel: "Vehicle Search",
      eyebrow: "Vehicle search",
      titlePrefix: "A",
      titleAccent: "Vehicle Search",
      titleSuffix: "will verify the VIN or plate details",
      benefitsTitle: "What a Vehicle Search can show you",
      benefits: [
        "The make, model, and year",
        "VIN or plate details in one place",
        "A faster way to check a listing",
        "Helpful before you meet a seller",
        "A simple first check before you spend more time",
      ],
      supportTitle: "Check the car before you spend more time or money",
      supportBody:
        "A Vehicle Search helps you confirm that the car details match what you were shown. It is built for quick VIN and plate checks while you are reviewing listings or talking to a seller.",
      ctaLabel: "Open Vehicle Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a vehicle lookup product. Show a clean modern SUV or sedan in a premium editorial automotive composition with a pale green or neutral backdrop and a buyer using a latest-generation iPhone nearby to verify details. The vehicle must look real, correctly proportioned, and commercially photographed, with no warped body panels, no impossible wheel geometry, and no badge confusion. If the phone screen is visible, it should show a generic vehicle-info style interface with blocks only, no readable text, no logos, and no fake low-quality UI. Crisp daylight, refined automotive brand photography, polished surfaces, and a trustworthy pre-purchase verification mood.",
          referencePrompt:
            "Reference image idea: premium automotive campaign photo of a modern car with a shopper verifying details on an iPhone, light green tonal palette, realistic reflections, and clean dealership-style polish.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Photorealistic automotive close-up for a vehicle verification product. Show a buyer pointing to a VIN certification label mounted on the inside of an open driver-side door jamb of a modern SUV in daylight. The VIN sticker must be on the painted metal jamb near the latch area, exactly where a real door-jamb certification label belongs. Do not place the VIN near the windshield, dashboard, or exterior body panel. Include realistic weather seals, painted metal, latch hardware, and a fingertip indicating the label location. Keep any label text too small to read. Clean believable car geometry, premium documentary-style automotive photography, and sharp focus on the label area.",
          referencePrompt:
            "Reference image idea: close premium photo of hands checking the VIN area through a windshield on a clean modern vehicle, daylight, realistic interior materials, and commercial automotive styling.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Ultra-realistic supporting lifestyle image for a VIN or plate lookup section. Show a buyer standing beside a used car, holding a latest-generation iPhone and comparing the listing or vehicle details before a meetup. The phone must look like a real premium iPhone, not Android, with correct hardware and no screen distortions. Any visible UI should be a generic vehicle-details layout made of image blocks and data rows only, with no readable text, no dealership logos, and no fake browser chrome. Natural daylight, polished but candid automotive lifestyle photography, realistic body language, and a clear sense of practical vehicle verification.",
          referencePrompt:
            "Reference image idea: candid premium used-car shopping photo of a buyer with an iPhone next to a parked car, warm daylight, realistic wardrobe, and clear pre-purchase verification storytelling.",
        },
      ],
    },
    landing: {
      badge: "Vehicle Lookup",
      titlePrefix: "Decode any",
      titleAccent: "vehicle",
      titleSuffix: "with a VIN or license plate starting point",
      description:
        "Use RevealAI vehicle lookup to start with a license plate or decode a VIN, confirm core vehicle details, and get the context you need before you buy, sell, or verify a car.",
      primaryCtaLabel: "Search a Vehicle",
      secondaryCtaLabel: "Run a People Search",
      secondaryCtaHref: "/people-search",
      stats: [
        { value: "VIN", label: "Decode-ready input" },
        { value: "Plate", label: "Alternate starting point" },
        { value: "Fast", label: "Decode experience" },
        { value: "Clear", label: "Specs and trim context" },
      ],
      sectionTitle: "What RevealAI vehicle lookup helps verify",
      sectionDescription:
        "Useful when a VIN or plate is the strongest identifier you have and you need a quick read on the vehicle.",
      features: [
        {
          icon: Car,
          title: "VIN and plate starting points",
          description:
            "Start with the identifier you have, whether that is a VIN from the dash or a visible license plate from a listing.",
        },
        {
          icon: FileText,
          title: "Specs and trim signals",
          description:
            "Review engine, transmission, body class, and manufacturing details tied to the VIN.",
        },
        {
          icon: Shield,
          title: "Shopping confidence",
          description:
            "Useful when comparing listings, verifying a seller's claims, or double-checking a VIN on a vehicle.",
        },
      ],
      useCasesTitle: "Common reasons people run vehicle lookups",
      useCases: [
        {
          icon: Search,
          title: "Used-car shopping",
          description:
            "Quickly verify that the VIN or visible plate matches the listing and vehicle details you were given.",
        },
        {
          icon: MapPin,
          title: "Private-party sales",
          description:
            "Confirm what the vehicle appears to be before meeting a seller or exchanging funds.",
        },
        {
          icon: Shield,
          title: "Ownership conversations",
          description:
            "Use the VIN or a plate number as a starting point when you need clearer context around a car.",
        },
      ],
      faq: [
        {
          question: "What do I need to search a vehicle?",
          answer:
            "RevealAI vehicle lookup works best with a 17-character VIN, but you can also start with a license plate when that is the identifier you have available.",
        },
        {
          question: "What can a vehicle lookup tell me quickly?",
          answer:
            "It helps confirm core vehicle details like make, model, year, trim, and manufacturing context so you can verify what you are looking at, especially when a VIN is available.",
        },
        {
          question: "When should I use this instead of another search tool?",
          answer:
            "Use vehicle lookup when a VIN or plate is your primary clue and your goal is fast vehicle verification rather than a people or records search.",
        },
      ],
      closingTitle: "Start with the strongest vehicle identifier you have",
      closingDescription:
        "Start with vehicle lookup whenever you need a cleaner, faster read on what a car really is.",
    },
    loading: {
      queryLabel: "Checking vehicle details for",
      steps: [
        {
          id: 1,
          text: "Checking the vehicle identifier...",
          detail: "Validating the VIN or license plate input",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Matching vehicle details...",
          detail: "Looking for make, model, and listing-ready vehicle clues",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Reviewing specs and context...",
          detail: "Decoding deeper details when a VIN match is available",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Preparing your vehicle summary...",
          detail: "Organizing the strongest vehicle signals we found",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing vehicle search...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Great Before Buying Used",
          quote:
            "I wanted to make sure the VIN matched the car being sold, and this gave me a clean snapshot right away.",
        },
        {
          title: "Easy VIN Check",
          quote:
            "Fast enough to use while browsing listings and useful enough to catch mismatched details.",
        },
        {
          title: "Helpful Seller Verification",
          quote:
            "It gave me a much better starting point before I spent more time on the vehicle.",
        },
      ],
    },
    metadata: {
      landingTitle: "Vehicle Lookup - Decode VINs and Search License Plates",
      landingDescription:
        "Use RevealAI vehicle lookup to search by license plate or decode any VIN and verify core specs, trim, and manufacturing details before you buy or sell.",
      landingKeywords: [
        "vehicle lookup",
        "vin lookup",
        "license plate lookup",
        "plate number search",
        "vin decoder",
        "car vin check",
        "vehicle verification",
        "decode vehicle vin",
      ],
      toolTitle: "Vehicle Search Tool - Search by VIN or Plate",
      toolDescription:
        "Use RevealAI's vehicle search tool to start with a VIN or license plate and verify vehicle details, specs, and manufacturing information.",
      toolKeywords: [
        "vin decoder tool",
        "vehicle lookup tool",
        "decode any vin",
        "license plate lookup tool",
      ],
      ogTitle: "RevealAI Vehicle Lookup",
      ogSubtitle: "Search by VIN or license plate and verify the vehicle behind the listing",
    },
  },
  records: {
    id: "records",
    label: "Public Records",
    menuLabel: "Public Records",
    icon: FileText,
    inputMode: "person",
    analyticsKey: "public_records",
    searchType: "records",
    landingPath: "/public-records-search",
    toolPath: "/records",
    theme: {
      primary: "#f59e0b",
      primaryHover: "#d97706",
      soft: "#fffbeb",
      softBorder: "#fcd34d",
      surface: "#fffaf0",
      surfaceAlt: "#fef3c7",
      gradientFrom: "#fffbeb",
      gradientTo: "#ffffff",
      shadow: "rgba(245, 158, 11, 0.22)",
    },
    home: {
      badge: "Records Search",
      titlePrefix: "Search",
      titleAccent: "Public Records",
      titleSuffix: "by Name",
      subtitle:
        "Court, criminal, and filing records.",
      ctaLabel: "Search Public Records",
      helperText: "Best for court records, criminal history, liens, and filings.",
    },
    homeShowcase: {
      displayLabel: "Public Records Search",
      eyebrow: "Public records search",
      titlePrefix: "A",
      titleAccent: "Public Records Search",
      titleSuffix: "will focus on court and filing history",
      benefitsTitle: "What a Public Records Search can show you",
      benefits: [
        "Court and filing-related records",
        "Criminal and civil record clues",
        "A more focused records-first workflow",
        "Helpful for higher-stakes due diligence",
        "A cleaner way to review legal public-record context",
      ],
      supportTitle: "Start here when records are the main thing you care about",
      supportBody:
        "A Public Records Search is built for moments when court, criminal, civil, or filing history is your main question. It gives you a more direct path than starting with a broader search.",
      ctaLabel: "Open Public Records Search",
      imagePrompts: [
        {
          label: "Primary image placeholder",
          prompt:
            "Ultra-realistic premium website hero image for a public-records search product. Show a clean investigative desk setup on a warm cream seamless or softly styled legal-office backdrop: a silver laptop, a neat stack of file folders, a legal pad, and a few printed public-record style pages. The pages may contain layout structure, stamps, and line blocks but no readable text, no court names, and no visible personal data. The composition should feel premium, ordered, and serious without looking like a law firm cliché. Warm natural light, elegant editorial product photography, realistic paper texture, accurate object scale, no clutter, no gavels, no stock-photo cheesiness, and no fantasy props.",
          referencePrompt:
            "Reference image idea: luxury editorial still life of a due-diligence desk with a laptop, file folders, and neatly arranged paperwork on a cream backdrop, warm sunlight, realistic textures, and minimal branding.",
        },
        {
          label: "Secondary image placeholder",
          prompt:
            "Ultra-realistic candid lifestyle image for a records-first verification page. Show a professional reviewing printed court or filing documents beside a silver laptop in a bright office or conference-room setting. The person should look focused and capable, not dramatic or overly corporate. Documents must look believable but contain no readable text, no identifiable case details, and no messy gibberish paragraphs; use abstract line blocks, seals, and form structure only. Natural neutral palette, premium documentary-editorial photography, realistic hands and pen placement, clean desk styling, and no exaggerated legal props.",
          referencePrompt:
            "Reference image idea: premium office photo of a professional doing due-diligence review with papers and laptop, neutral palette, daylight, and believable document styling without readable text.",
        },
        {
          label: "Supporting image placeholder",
          prompt:
            "Ultra-realistic supporting detail image for a public-records search section. Show a close-up of a hand marking or reviewing a printed filing summary next to a silver laptop and organized folders, emphasizing careful records research. The paperwork should show only generic document structure, stamps, highlights, and line blocks with no readable text or real case information. Lighting should be soft and directional, the scene should feel methodical and trustworthy, and every object should look physically accurate and professionally styled. No odd anatomy, no duplicated stationery, no warped paper, no clutter, and no theatrical courtroom imagery.",
          referencePrompt:
            "Reference image idea: close premium desk photo of records review in progress, hand with pen over structured paperwork, clean laptop nearby, soft sunlight, and refined due-diligence aesthetics.",
        },
      ],
    },
    landing: {
      badge: "Public Records Search",
      titlePrefix: "Search",
      titleAccent: "public records",
      titleSuffix: "when legal and court history matters most",
      description:
        "Use RevealAI public records search to focus on court filings, criminal history clues, civil cases, and other legal-public-record context tied to a person.",
      primaryCtaLabel: "Search Public Records",
      secondaryCtaLabel: "Start a Full Report",
      secondaryCtaHref: "/people-search",
      stats: [
        { value: "Focused", label: "Legal-record intent" },
        { value: "Fast", label: "Search workflow" },
        { value: "Clear", label: "Case-level summaries" },
      ],
      sectionTitle: "Why use a dedicated public records search",
      sectionDescription:
        "Built for users whose main question is around court, criminal, civil, or filing-related context.",
      features: [
        {
          icon: Scale,
          title: "Court and case context",
          description:
            "Focus the search on court records, filings, and other public legal-record signals instead of a broader people lookup.",
        },
        {
          icon: Shield,
          title: "Criminal and civil record review",
          description:
            "Useful when you need a more records-specific starting point before going wider.",
        },
        {
          icon: FileText,
          title: "Filing and status summaries",
          description:
            "See the high-level context that helps you understand what kind of records may be relevant.",
        },
      ],
      useCasesTitle: "Common reasons people search public records",
      useCases: [
        {
          icon: Users,
          title: "Tenant or applicant screening",
          description:
            "Start with public-record-focused context when records are the main factor you care about.",
        },
        {
          icon: Shield,
          title: "Safety and due diligence",
          description:
            "Check court or legal-public-record context before a deeper business or personal decision.",
        },
        {
          icon: Search,
          title: "Follow-up from a full report",
          description:
            "Use public records search to go deeper after a broader people search raises questions.",
        },
      ],
      faq: [
        {
          question: "How is Public Records different from Full Report?",
          answer:
            "Public Records is more focused on legal, court, and filing-related context, while Full Report is designed to be a broader people-intelligence starting point.",
        },
        {
          question: "What kinds of records can this help surface?",
          answer:
            "The flow is built around court records, criminal history clues, civil cases, filings, liens, judgments, and similar public-record categories.",
        },
        {
          question: "When should I start here?",
          answer:
            "Start with Public Records when records are your main reason for searching rather than a broader identity or online-profile question.",
        },
      ],
      closingTitle: "Use a focused records workflow when the stakes are higher",
      closingDescription:
        "Start with Public Records when you need court and filing context without the noise of a broader search.",
    },
    loading: {
      queryLabel: "Reviewing public records for",
      steps: [
        {
          id: 1,
          text: "Searching court records...",
          detail: "Criminal, civil, traffic, and filing-related sources",
          completionTime: 3000,
        },
        {
          id: 2,
          text: "Comparing legal identifiers...",
          detail: "Names, locations, jurisdictions, and case clues",
          completionTime: 6000,
        },
        {
          id: 3,
          text: "Summarizing record categories...",
          detail: "Prioritizing the most relevant legal-public-record context",
          completionTime: 9000,
        },
        {
          id: 4,
          text: "Building your records overview...",
          detail: "Organizing case and filing details into one summary",
          completionTime: 12000,
        },
        {
          id: 5,
          text: "Finalizing record results...",
          detail: "Almost ready",
          completionTime: Number.POSITIVE_INFINITY,
        },
      ],
      testimonials: [
        {
          title: "Helpful Records Starting Point",
          quote:
            "I needed the records angle first, not a general people search, and this got me there faster.",
        },
        {
          title: "Good for Due Diligence",
          quote:
            "The public-records flow made it easier to focus on the legal context I actually cared about.",
        },
        {
          title: "Clearer Than Piecing It Together",
          quote:
            "It pulled the relevant record categories into one place so I could decide what to investigate next.",
        },
      ],
    },
    metadata: {
      landingTitle: "Public Records Search - Court, Criminal, and Filing Context",
      landingDescription:
        "Search public records with RevealAI to review court filings, criminal history clues, civil cases, and legal-public-record context tied to a person.",
      landingKeywords: [
        "public records search",
        "court records search",
        "criminal records search",
        "civil case search",
        "background records",
        "legal records search",
      ],
      toolTitle: "Public Records Tool - Search Court and Legal Records",
      toolDescription:
        "Use RevealAI's public records tool to search court, criminal, civil, and filing-related public records.",
      toolKeywords: [
        "public records tool",
        "court records tool",
        "search legal records",
      ],
      ogTitle: "RevealAI Public Records Search",
      ogSubtitle: "Search court records, criminal history clues, and public filings",
    },
  },
};

export const SEARCH_PRODUCT_IDS = Object.keys(
  SEARCH_PRODUCTS
) as SearchProductId[];

export function isSearchProductId(value: string | null | undefined): value is SearchProductId {
  return SEARCH_PRODUCT_IDS.includes(value as SearchProductId);
}

export function getSearchProduct(productId: SearchProductId) {
  return SEARCH_PRODUCTS[productId];
}

export function getSearchExperiencePath(productId: SearchProductId) {
  return `/?product=${productId}#search`;
}

export function getSearchProductBySearchType(searchType?: string): SearchProductId {
  switch (getCanonicalSearchType(searchType) ?? searchType) {
    case "social":
    case "datingapps":
      return "social";
    case "followers":
      return "followers";
    case "phone":
      return "phone";
    case "vehicle":
      return "vehicle";
    case "records":
      return "records";
    default:
      return "people";
  }
}

export function getProductThemeStyle(
  productId: SearchProductId
): CSSProperties & Record<string, string> {
  const theme = SEARCH_PRODUCTS[productId].theme;

  return {
    "--product-primary": theme.primary,
    "--product-primary-hover": theme.primaryHover,
    "--product-soft": theme.soft,
    "--product-soft-border": theme.softBorder,
    "--product-surface": theme.surface,
    "--product-surface-alt": theme.surfaceAlt,
    "--product-gradient-from": theme.gradientFrom,
    "--product-gradient-to": theme.gradientTo,
    "--product-shadow": theme.shadow,
  };
}

export function buildLandingMetadata(productId: SearchProductId): Metadata {
  const product = getSearchProduct(productId);
  const url = `${BASE_URL}${product.landingPath}`;

  return {
    title: product.metadata.landingTitle,
    description: product.metadata.landingDescription,
    keywords: product.metadata.landingKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: product.metadata.landingTitle,
      description: product.metadata.landingDescription,
      url,
      images: [
        {
          url: createOgImageUrl(
            product.metadata.ogTitle,
            product.metadata.ogSubtitle
          ),
          width: 1200,
          height: 630,
          alt: product.metadata.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.metadata.landingTitle,
      description: product.metadata.landingDescription,
      images: [
        createOgImageUrl(product.metadata.ogTitle, product.metadata.ogSubtitle),
      ],
    },
  };
}

export function buildToolMetadata(productId: SearchProductId): Metadata {
  const product = getSearchProduct(productId);

  return {
    title: product.metadata.toolTitle,
    description: product.metadata.toolDescription,
    keywords: product.metadata.toolKeywords,
    alternates: {
      canonical: `${BASE_URL}${product.landingPath}`,
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
    openGraph: {
      title: product.metadata.toolTitle,
      description: product.metadata.toolDescription,
      url: `${BASE_URL}${product.toolPath}`,
    },
  };
}
