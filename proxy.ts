import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/ratelimit";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  
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

    // Path-specific limits: checkout strict, Perplexity moderate, other API moderate
    let maxRequests: number;
    if (pathname === "/api/stripe/checkout") {
      maxRequests = 10; // 10/min to prevent session spam
    } else if (pathname.includes("/api/perplexity/search")) {
      maxRequests = 25; // 25/min in addition to per-user daily limit
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

