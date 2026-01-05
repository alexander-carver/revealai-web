import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
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
  
  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    const identifier = getClientIdentifier(request);
    
    // Stricter limits for search-related endpoints
    const isSearchEndpoint = pathname.includes("search") || pathname.includes("stripe");
    const maxRequests = isSearchEndpoint ? 10 : 30; // 10/min for search, 30/min for others
    const windowMs = 60 * 1000; // 1 minute
    
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
    // Match all paths for domain redirect
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

