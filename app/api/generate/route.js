import { NextResponse } from 'next/server';

import {
  buildGenerateMessages,
  createGenerateEventStream,
  createVisionModelError,
  isImageInput,
  SSE_HEADERS,
  supportsVisionModel,
  validateGeneratePayload,
} from '@/lib/generate-route-utils';
import { callLLM } from '@/lib/llm-client';
import { debug, error as logError } from '@/lib/logger';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * POST /api/generate
 * Generate Draw.io diagram based on user input.
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed, resetIn } = checkRateLimit(ip);

  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  try {
    const payload = await request.json();
    const validationError = validateGeneratePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { config, userInput, chartType, isContinuation, theme } = payload;
    const hasImageInput = isImageInput(userInput);

    debug('[generate] incoming payload', {
      chartType,
      configType: config.type,
      hasImageInput,
      isContinuation: Boolean(isContinuation),
      model: config.model,
      theme: theme ?? null,
      userInputType: typeof userInput,
    });

    if (hasImageInput && !supportsVisionModel(config.model)) {
      return NextResponse.json(
        { error: createVisionModelError(config.model) },
        { status: 400 }
      );
    }

    const messages = buildGenerateMessages({
      userInput,
      chartType,
      isContinuation,
      theme,
    });

    debug('[generate] prepared messages', {
      hasImageInput,
      messageCount: messages.length,
      systemPromptLength: messages[0].content.length,
      userPromptLength: typeof messages[1].content === 'string' ? messages[1].content.length : 0,
    });

    const stream = createGenerateEventStream({
      callLLM,
      config,
      messages,
      onStreamError: (error) => {
        logError('Error in generate stream:', error);
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (error) {
    logError('Error generating code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}