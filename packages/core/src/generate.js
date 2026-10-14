import { GeneratePayloadSchema } from './schemas.js';
import { buildSystemPrompt, USER_PROMPT_TEMPLATE } from './prompts.js';
import { callLLM, publicLlmError } from './llm-client.js';
import { parseGeneratedContent } from './generation-utils.js';
import { validateDiagram } from './diagram.js';
import { applyThemePostProcessing } from './theme-postprocess.js';

const failure = (code, message) => ({ ok: false, diagnostics: [{ code, message, severity: 'error' }] });

/** Generate one validated XML document without applying incomplete output. */
export async function generateDiagram(input, { config, signal } = {}) {
  if (!config) return failure('CONFIG_MISSING', 'Configure a model provider before using generate_drawio.');
  const payload = GeneratePayloadSchema.safeParse({
    config, userInput: input?.prompt, chartType: input?.chartType, theme: input?.theme,
  });
  if (!payload.success) return failure('INVALID_GENERATE_INPUT', 'Provide a valid prompt, chart type, theme and model configuration.');
  const { userInput, chartType, theme } = payload.data;
  try {
    const result = await callLLM(payload.data.config, [
      { role: 'system', content: buildSystemPrompt(theme) },
      { role: 'user', content: USER_PROMPT_TEMPLATE(userInput, chartType, theme) },
    ], undefined, { signal });
    if (['length', 'max_tokens'].includes(result.stopReason)) {
      return failure('OUTPUT_TRUNCATED', 'The model output was truncated. Reduce diagram complexity and try again.');
    }
    const parsed = parseGeneratedContent(result.text, { autoRepair: false });
    if (!parsed.shouldApply || !parsed.generatedXml) {
      return failure('INVALID_MODEL_XML', 'The model did not produce a complete, valid draw.io XML document.');
    }
    // The same theme tools are used by the website and the local MCP service.
    const processed = applyThemePostProcessing(parsed.generatedXml, theme);
    if (processed.applied.some((operation) => operation.error)) {
      return failure('TRANSFORM_FAILED', 'The diagram theme processing could not be completed.');
    }
    return validateDiagram(processed.xml);
  } catch (error) {
    return failure(error?.name === 'AbortError' ? 'CANCELLED' : error?.code || 'GENERATION_FAILED', publicLlmError(error));
  }
}
