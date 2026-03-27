const ALLOWED_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.deepseek.com',
  'api.groq.com',
  'api.mistral.ai',
  'api.cohere.ai',
  'openrouter.ai',
  'api.together.xyz',
];

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd[0-9a-f]{2}:/i,
];

/**
 * Check if a hostname resolves to a private/internal IP
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIp(ip) {
  return PRIVATE_RANGES.some(r => r.test(ip));
}

/**
 * Validate a base URL against the allowed hosts list
 * @param {string} baseUrl
 * @returns {{ valid: boolean, reason?: string }}
 */
export function isAllowedBaseUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);

    if (url.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTPS URLs are allowed' };
    }

    const hostname = url.hostname;

    if (isPrivateIp(hostname) || hostname === 'localhost') {
      return { valid: false, reason: 'Private/internal addresses are not allowed' };
    }

    if (ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))) {
      return { valid: true };
    }

    // Allow custom domains but flag them
    return { valid: true, reason: 'Custom domain - not in default allow list' };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}
