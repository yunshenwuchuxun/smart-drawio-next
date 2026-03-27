import { NextResponse } from 'next/server';

import { error as logError } from '@/lib/logger';
import { testConnection } from '@/lib/llm-client';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { validateConnectionConfig } from '@/lib/schemas';
import { isAllowedBaseUrl } from '@/lib/url-validator';

/**
 * POST /api/configs
 * Test connection to a provider API
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed, resetIn } = checkRateLimit(ip);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  try {
    const { config } = await request.json();
    if (!config) {
      return NextResponse.json(
        { success: false, message: '缺少必填参数：config' },
        { status: 400 }
      );
    }

    const validation = validateConnectionConfig(config);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.errors.join('，') },
        { status: 400 }
      );
    }

    const { valid, reason } = isAllowedBaseUrl(validation.data.baseUrl);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: `无效的基础 URL：${reason}` },
        { status: 400 }
      );
    }

    const result = await testConnection(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    logError('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || '连接测试失败',
      },
      { status: 500 }
    );
  }
}
