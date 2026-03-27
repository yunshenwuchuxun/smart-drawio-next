import { NextResponse } from 'next/server';
import { fetchModels } from '@/lib/llm-client';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { isAllowedBaseUrl } from '@/lib/url-validator';
import { error as logError } from '@/lib/logger';

/**
 * GET /api/models
 * Fetch available models from the configured provider
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const { allowed, resetIn } = checkRateLimit(ip);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const baseUrl = searchParams.get('baseUrl');
    const apiKey = searchParams.get('apiKey');

    if (!type || !baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, baseUrl, apiKey' },
        { status: 400 }
      );
    }

    const { valid, reason } = isAllowedBaseUrl(baseUrl);
    if (!valid) {
      return NextResponse.json(
        { error: `Invalid base URL: ${reason}` },
        { status: 400 }
      );
    }

    const models = await fetchModels(type, baseUrl, apiKey);

    return NextResponse.json({ models });
  } catch (error) {
    logError('Error fetching models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

