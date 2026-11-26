import { NextResponse } from 'next/server';
import { fetchModels } from '@/lib/llm-client';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { isAllowedBaseUrl, shouldAllowLocalBaseUrls } from '@/lib/url-validator';
import { error as logError } from '@/lib/logger';

const CACHE_CONTROL = 'no-store';

function json(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { 'Cache-Control': CACHE_CONTROL },
  });
}

/** List provider models using credentials supplied only in the JSON body. */
export async function POST(request) {
  const { allowed, resetIn } = checkRateLimit(getClientIp(request));
  if (!allowed) {
    const response = rateLimitResponse(resetIn);
    response.headers.set('Cache-Control', CACHE_CONTROL);
    return response;
  }

  if (new URL(request.url).searchParams.has('apiKey')) {
    return json({ error: 'Supply the API key in the request body, not the URL' }, 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { type, baseUrl, apiKey } = payload ?? {};
  if (![type, baseUrl, apiKey].every(value => typeof value === 'string' && value.trim())) {
    return json({ error: 'Required string fields: type, baseUrl, apiKey' }, 400);
  }

  const { valid, reason } = isAllowedBaseUrl(baseUrl, {
    allowLocal: shouldAllowLocalBaseUrls(),
  });
  if (!valid) {
    return json({ error: `Invalid base URL: ${reason}` }, 400);
  }

  try {
    const models = await fetchModels(type, baseUrl, apiKey);
    return json({ models });
  } catch {
    // Upstream errors may contain credentials. Never log or echo the raw error.
    logError('Error fetching models:', 'Provider model listing failed');
    return json({ error: 'Failed to fetch models from the provider' }, 500);
  }
}
