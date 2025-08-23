import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';
import rateLimit from './rate-limit';

// API错误类
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 验证中间件
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new APIError(`输入验证失败: ${errorMessage}`, 400, 'VALIDATION_ERROR');
      }
      throw new APIError('请求格式无效', 400, 'INVALID_REQUEST');
    }
  };
}

// 查询参数验证中间件
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (request: NextRequest): T => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query: Record<string, string | string[]> = {};
      
      for (const [key, value] of searchParams.entries()) {
        if (query[key]) {
          // 处理重复的查询参数
          const existing = query[key];
          query[key] = Array.isArray(existing) ? [...existing, value] : [existing as string, value];
        } else {
          query[key] = value;
        }
      }
      
      return schema.parse(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new APIError(`查询参数验证失败: ${errorMessage}`, 400, 'VALIDATION_ERROR');
      }
      throw new APIError('查询参数格式无效', 400, 'INVALID_QUERY');
    }
  };
}

// CORS中间件
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// 安全头中间件
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
  };
}

// 请求大小限制中间件
export function validateRequestSize(maxSizeInBytes: number = 1024 * 1024) { // 默认1MB
  return async (request: NextRequest) => {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSizeInBytes) {
      throw new APIError('请求体过大', 413, 'PAYLOAD_TOO_LARGE');
    }
  };
}

// API响应包装器
export function createAPIResponse<T>(
  data?: T,
  error?: { code: string; message: string; details?: unknown },
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) {
  return {
    success: !error,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
    ...(error && { error }),
    ...(pagination && { pagination }),
  };
}

// 统一错误处理包装器
export function withErrorHandler(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof APIError) {
        return NextResponse.json(
          createAPIResponse(undefined, {
            code: error.code,
            message: error.message,
          }),
          { 
            status: error.statusCode,
            headers: securityHeaders()
          }
        );
      }

      // 未知错误
      return NextResponse.json(
        createAPIResponse(undefined, {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : '未知错误')
            : '服务器内部错误',
        }),
        { 
          status: 500,
          headers: securityHeaders()
        }
      );
    }
  };
}

// API处理器包装器，集成所有中间件
export function createAPIHandler(options: {
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  maxRequestSize?: number;
}) {
  return function<T>(
    handler: (request: NextRequest, validatedData?: T, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return withErrorHandler(async (request: NextRequest, ...args: unknown[]) => {
      // 应用速率限制
      if (options.rateLimit) {
        await rateLimit(request, options.rateLimit);
      }

      // 验证请求大小
      if (options.maxRequestSize) {
        await validateRequestSize(options.maxRequestSize)(request);
      }

      // OPTIONS请求处理（CORS预检）
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: { ...corsHeaders(), ...securityHeaders() },
        });
      }

      return handler(request, undefined, ...args);
    });
  };
}

// 特定的中间件组合
export const withValidation = <T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T, ...args: unknown[]) => Promise<NextResponse>
) => {
  return createAPIHandler({
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }, // 15分钟100次请求
    maxRequestSize: 1024 * 1024, // 1MB
  })(async (request: NextRequest, ...args: unknown[]) => {
    const validatedData = await validateRequest(schema)(request);
    return handler(request, validatedData, ...args);
  });
};

export const withQueryValidation = <T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validatedQuery: T, ...args: unknown[]) => Promise<NextResponse>
) => {
  return createAPIHandler({
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 }, // 15分钟200次请求（GET请求可以更多）
  })(async (request: NextRequest, ...args: unknown[]) => {
    const validatedQuery = validateQuery(schema)(request);
    return handler(request, validatedQuery, ...args);
  });
};