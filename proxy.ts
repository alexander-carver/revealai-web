import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/ratelimit";
import { normalizeReportSearchType } from "@/lib/reveal-search";
import { resolveSearchProductId } from "@/lib/search-routing";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  const searchParams = request.nextUrl.searchParams;
  const productParam = searchParams.get("product");
  const typeParam = searchParams.get("type") ?? searchParams.get("searchType");

  const canonicalProduct = resolveSearchProductId(productParam);
  if (pathname === "/" && productParam && canonicalProduct && productParam !== canonicalProduct) {
    const url = request.nextUrl.clone();
    url.searchParams.set("product", canonicalProduct);
    return NextResponse.redirect(url, 307);
  }

  const canonicalSearchType = typeParam
    ? normalizeReportSearchType(typeParam)
    : null;
  if (
    pathname === "/search/result" &&
    typeParam &&
    canonicalSearchType &&
    (searchParams.get("type") !== canonicalSearchType || searchParams.has("searchType"))
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("searchType");
    url.searchParams.set("type", canonicalSearchType);
    return NextResponse.redirect(url, 307);
  }

  // Send branded /search visits to the higher-converting people-search landing page.
  // Keep parameterized searches and deeper search routes untouched.
  if (pathname === "/search" && !request.nextUrl.search) {
    const url = request.nextUrl.clone();
    url.pathname = "/people-search";
    return NextResponse.redirect(url, 307);
  }

  // Retire legacy tool screens as standalone destinations. If a route is reached
  // without the params needed for an actual lookup, send the user to the unified
  // homepage search experience for that product instead.
  if (pathname === "/social") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", "social");
    url.hash = "search";
    return NextResponse.redirect(url, 307);
  }

  if (pathname === "/username") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", "social");
    url.searchParams.set("mode", "username");
    url.hash = "search";
    return NextResponse.redirect(url, 307);
  }

  if (pathname === "/phone" && searchParams.get("number")) {
    const url = request.nextUrl.clone();
    url.pathname = "/search/result";
    url.search = "";
    url.searchParams.set("type", "phone");
    url.searchParams.set("number", searchParams.get("number") ?? "");
    return NextResponse.redirect(url, 307);
  }

  if (pathname === "/phone" && !searchParams.get("number")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", "phone");
    url.hash = "search";
    return NextResponse.redirect(url, 307);
  }

  if (
    pathname === "/vehicle" &&
    (searchParams.get("vin") || searchParams.get("plate"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/search/result";
    url.search = "";
    url.searchParams.set("type", "vehicle");

    if (searchParams.get("vin")) {
      url.searchParams.set("vin", searchParams.get("vin") ?? "");
    } else if (searchParams.get("plate")) {
      url.searchParams.set("plate", searchParams.get("plate") ?? "");
    }

    return NextResponse.redirect(url, 307);
  }

  if (
    pathname === "/vehicle" &&
    !searchParams.get("vin") &&
    !searchParams.get("plate")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", "vehicle");
    url.hash = "search";
    return NextResponse.redirect(url, 307);
  }

  if (
    pathname === "/records" &&
    (!searchParams.get("firstName") || !searchParams.get("lastName"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", "records");
    url.hash = "search";
    return NextResponse.redirect(url, 307);
  }
  
  // Force redirect to main domain (revealai-peoplesearch.com)
  // Skip for localhost/development
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isMainDomain = hostname === "revealai-peoplesearch.com" || hostname === "www.revealai-peoplesearch.com";
  const isVercelDomain = hostname.includes("vercel.app");
  
  if (!isLocalhost && !isMainDomain && isVercelDomain) {
    // Redirect Vercel domains to main domain
    const url = request.nextUrl.clone();
    url.host = "revealai-peoplesearch.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // Rate limit API routes (skip webhook - Stripe uses many IPs, only signature verification applies)
  if (pathname.startsWith("/api/") && pathname !== "/api/stripe/webhook") {
    const identifier = getClientIdentifier(request);
    const windowMs = 60 * 1000; // 1 minute
    const isSearchDebugMode =
      process.env.NODE_ENV !== "production" &&
      process.env.STRIPE_DEBUG_TEST_MODE === "true";
    const isRevealSearchPoll =
      pathname.includes("/api/perplexity/search") &&
      request.nextUrl.searchParams.get("poll") === "1";

    // Path-specific limits: checkout strict, Perplexity moderate, other API moderate
    let maxRequests: number;
    if (pathname === "/api/stripe/checkout") {
      maxRequests = 10; // 10/min to prevent session spam
    } else if (pathname.includes("/api/perplexity/search")) {
      maxRequests = isSearchDebugMode
        ? isRevealSearchPoll
          ? 240
          : 40
        : isRevealSearchPoll
          ? 120
          : 8; // allow active search polling, but keep fresh GPT report starts expensive to abuse
    } else {
      maxRequests = 30; // 30/min for other API routes
    }

    const rateLimit = await checkRateLimit(identifier, maxRequests, windowMs);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetTime.toString(),
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
