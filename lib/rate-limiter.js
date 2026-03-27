/**
 * IP-based sliding window rate limiter
 * Limits requests to 20 per minute per IP
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

const requestLog = new Map();

/**
 * Clean up old entries from the request log
 */
function cleanup() {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, valid);
    }
  }
}

/**
 * Check if a request from an IP should be rate limited
 * @param {string} ip - Client IP address
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(ip) {
  cleanup();

  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = Math.min(...validTimestamps);
    const resetIn = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn
    };
  }

  validTimestamps.push(now);
  requestLog.set(ip, validTimestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - validTimestamps.length,
    resetIn: Math.ceil(WINDOW_MS / 1000)
  };
}

/**
 * Get client IP from Next.js request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return '127.0.0.1';
}

/**
 * Create rate limit response
 * @param {number} resetIn - Seconds until rate limit resets
 * @returns {Response}
 */
export function rateLimitResponse(resetIn) {
  return new Response(
    JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn)
      }
    }
  );
}

/**
 * Rate limit middleware wrapper for API routes
 * @param {Function} handler - Route handler function
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimit(handler) {
  return async (request, context) => {
    const ip = getClientIp(request);
    const { allowed, resetIn } = checkRateLimit(ip);

    if (!allowed) {
      return rateLimitResponse(resetIn);
    }

    return handler(request, context);
  };
}
