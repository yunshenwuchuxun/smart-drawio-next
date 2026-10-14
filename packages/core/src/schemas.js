import { z } from 'zod';

import { CHART_TYPES } from './constants.js';
import { DEFAULT_THEME_ID, themes } from './themes/index.js';

// Keep JSON (including base64 images) below Vercel's 4.5 MB request limit.
export const MAX_GENERATE_BODY_BYTES = 4 * 1024 * 1024;
export const MAX_GENERATE_TEXT_CHARS = 256 * 1024;
export const MAX_GENERATE_IMAGE_BYTES = 2 * 1024 * 1024;

const ProviderTypeSchema = z.string().trim().refine(
  (value) => value === 'openai' || value === 'anthropic',
  '配置类型必须是 openai 或 anthropic'
);

const RequiredText = (label) => z.string().trim().min(1, `${label}不能为空`);

export const ConnectionConfigSchema = z.object({
  type: ProviderTypeSchema,
  baseUrl: z.string().trim().url('API 地址格式不正确'),
  apiKey: RequiredText('API 密钥'),
});

export const ConfigSchema = ConnectionConfigSchema.extend({
  id: z.string().optional(),
  name: RequiredText('配置名称'),
  model: RequiredText('模型名称'),
  description: z.string().optional().default(''),
  isActive: z.boolean().optional().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Generation only needs connection fields and a model, not a persisted config name.
// HTTP endpoints and arbitrary hosts remain supported for self-hosted providers.
export const GenerateConfigSchema = z.object({
  type: z.enum(['openai', 'anthropic']),
  baseUrl: z.string().trim().min(1).max(2048).url().refine((value) => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol)
        && !url.username && !url.password && !url.search && !url.hash;
    } catch {
      return false;
    }
  }, 'API 地址必须为不包含凭证或查询参数的 HTTP(S) URL'),
  apiKey: z.string().trim().min(1).max(4096).refine(
    (value) => !/[\r\n]/.test(value), 'API 密钥格式不正确'
  ),
  model: z.string().trim().min(1).max(256),
});

const GenerateImageSchema = z.object({
  data: z.string().min(1).max(Math.ceil(MAX_GENERATE_IMAGE_BYTES / 3) * 4)
    .refine((value) => value.length <= Math.ceil(MAX_GENERATE_IMAGE_BYTES / 3) * 4
      && value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value), '图片必须使用有效的 base64 编码')
    .refine((value) => {
      const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
      return value.length * 3 / 4 - padding <= MAX_GENERATE_IMAGE_BYTES;
    }, '图片大小不能超过 2MB'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
});

export const GeneratePayloadSchema = z.object({
  config: GenerateConfigSchema,
  userInput: z.union([
    z.string().max(MAX_GENERATE_TEXT_CHARS).refine((value) => value.trim().length > 0, '请输入图表描述'),
    z.object({
      text: z.string().max(MAX_GENERATE_TEXT_CHARS).optional().default(''),
      image: GenerateImageSchema,
    }),
  ]),
  chartType: z.enum(Object.keys(CHART_TYPES)).optional().default('auto'),
  theme: z.enum(Object.keys(themes)).optional().default(DEFAULT_THEME_ID),
  isContinuation: z.boolean().optional().default(false),
});

function collectErrors(result) {
  return result.error.issues.map((issue) => issue.message);
}

/**
 * Validate a full persisted config record.
 * @param {unknown} data
 * @returns {{ success: true, data: z.infer<typeof ConfigSchema> } | { success: false, errors: string[] }}
 */
export function validateConfig(data) {
  const result = ConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: collectErrors(result) };
}

/**
 * Validate connection-only fields for model loading / connectivity checks.
 * @param {unknown} data
 * @returns {{ success: true, data: z.infer<typeof ConnectionConfigSchema> } | { success: false, errors: string[] }}
 */
export function validateConnectionConfig(data) {
  const result = ConnectionConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: collectErrors(result) };
}
