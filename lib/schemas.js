import { z } from 'zod';

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
