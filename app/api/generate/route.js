import { NextResponse } from 'next/server';

import {
  buildGenerateMessages,
  createGenerateEventStream,
  createVisionModelError,
  isImageInput,
  readGeneratePayload,
  SSE_HEADERS,
  supportsVisionModel,
  validateGeneratePayload,
} from '@/lib/generate-route-utils';
import { callLLM, publicLlmError } from '@/lib/llm-client';
import { GeneratePayloadSchema } from '@/lib/schemas';
import { debug, error as logError } from '@/lib/logger';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const maxDuration = 300;

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
    const payload = await readGeneratePayload(request);
    const validationError = validateGeneratePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { config, userInput, chartType, isContinuation, theme } = GeneratePayloadSchema.parse(payload);
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
      signal: request.signal,
      onStreamError: (error) => {
        logError('Error in generate stream:', error);
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (error) {
    const isBodyError = error?.code === 'BODY_INVALID' || error?.code === 'BODY_TOO_LARGE';
    const message = isBodyError ? error.message : publicLlmError(error);
    if (!isBodyError && error?.name !== 'AbortError') logError('Error generating code:', new Error(message));
    return NextResponse.json(
      { error: message },
      { status: error?.code === 'BODY_TOO_LARGE' ? 413 : isBodyError ? 400 : error?.name === 'AbortError' ? 499 : 500 }
    );
  }
}
