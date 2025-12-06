// Simple in-memory rate limiter (resets on server restart)
// For production, consider upgrading to @upstash/ratelimit with Redis

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requests = new Map<string, RateLimitRecord>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  requests.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => requests.delete(key));
}, 60000); // Clean up every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute default
): Promise<RateLimitResult> {
  const now = Date.now();
  
  const record = requests.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window - allow request
    const resetTime = now + windowMs;
    requests.set(identifier, { count: 1, resetTime });
    return { 
      allowed: true, 
      remaining: maxRequests - 1,
      resetTime 
    };
  }
  
  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime 
    };
  }
  
  // Increment count
  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count,
    resetTime: record.resetTime 
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  const ip = forwarded?.split(",")[0]?.trim() || 
             realIp || 
             cfConnectingIp || 
             "unknown";
  
  return ip;
}

