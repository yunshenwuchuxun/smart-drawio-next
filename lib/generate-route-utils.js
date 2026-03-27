import { CONTINUATION_SYSTEM_PROMPT, buildSystemPrompt, USER_PROMPT_TEMPLATE } from '@/lib/prompts';
import { DEFAULT_THEME_ID } from '@/lib/themes';

const VISION_MODEL_KEYWORDS = [
  'vision',
  'gpt-4o',
  'gpt-4.1',
  'gpt-4-turbo',
  'claude-3',
  'claude-sonnet',
  'claude-opus',
  'claude-haiku',
];

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

export function validateGeneratePayload(payload = {}) {
  const { config, userInput } = payload;

  if (!config || !userInput) {
    return 'Missing required parameters: config, userInput';
  }

  return null;
}

export function isImageInput(userInput) {
  return Boolean(userInput && typeof userInput === 'object' && userInput.image);
}

export function supportsVisionModel(model = '') {
  const normalizedModel = model.toLowerCase();
  return VISION_MODEL_KEYWORDS.some((keyword) => normalizedModel.includes(keyword));
}

export function createVisionModelError(model = '') {
  const modelPrefix = model ? `当前模型 ${model} 不支持图片输入` : '当前模型不支持图片输入';
  return `${modelPrefix}，请使用支持视觉输入的模型，例如 gpt-4o、gpt-4.1 或 claude-3.5-sonnet。`;
}

export function buildUserMessage(userInput, chartType = 'auto', theme = DEFAULT_THEME_ID) {
  if (isImageInput(userInput)) {
    return {
      role: 'user',
      content: USER_PROMPT_TEMPLATE(userInput.text || '', chartType, theme),
      image: {
        data: userInput.image.data,
        mimeType: userInput.image.mimeType,
      },
    };
  }

  return {
    role: 'user',
    content: USER_PROMPT_TEMPLATE(userInput, chartType, theme),
  };
}

export function buildGenerateMessages({
  userInput,
  chartType = 'auto',
  isContinuation = false,
  theme = DEFAULT_THEME_ID,
}) {
  const systemPrompt = isContinuation
    ? CONTINUATION_SYSTEM_PROMPT
    : buildSystemPrompt(theme || DEFAULT_THEME_ID);

  return [
    { role: 'system', content: systemPrompt },
    buildUserMessage(userInput, chartType, theme || DEFAULT_THEME_ID),
  ];
}

function createSseChunk(payload) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function createGenerateEventStream({
  callLLM,
  config,
  messages,
  onStreamError,
}) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const result = await callLLM(config, messages, (chunk) => {
          controller.enqueue(encoder.encode(createSseChunk({ content: chunk })));
        });

        const stopReason = result?.stopReason || null;
        if (stopReason) {
          controller.enqueue(encoder.encode(createSseChunk({ meta: { stopReason } })));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        onStreamError?.(error);
        controller.enqueue(encoder.encode(createSseChunk({ error: error.message || 'Failed to generate code' })));
        controller.close();
      }
    },
  });
}
