import { NextRequest } from 'next/server';
import { APIError } from './api-middleware';

// 内存存储的速率限制器（生产环境建议使用Redis）
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // 创建新窗口或重置过期窗口
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }

    // 增加计数
    entry.count++;
    this.store.set(key, entry);
    return entry;
  }

  // 清理过期条目（定期运行）
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimiter = new MemoryRateLimiter();

// 定期清理过期条目
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 获取客户端标识符
function getClientIdentifier(request: NextRequest): string {
  // 优先使用真实IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  // 在开发环境中，可能需要使用其他标识符
  if (process.env.NODE_ENV === 'development') {
    return `dev-${ip}`;
  }

  return ip;
}

// 速率限制中间件
export default async function rateLimit(
  request: NextRequest,
  options: {
    windowMs: number; // 时间窗口（毫秒）
    max: number; // 最大请求数
    skipSuccessfulRequests?: boolean; // 是否跳过成功请求的计数
    skipFailedRequests?: boolean; // 是否跳过失败请求的计数
    keyGenerator?: (request: NextRequest) => string; // 自定义key生成器
  }
): Promise<void> {
  const { windowMs, max, keyGenerator } = options;
  
  // 生成限制key
  const key = keyGenerator ? keyGenerator(request) : getClientIdentifier(request);
  
  if (!key) {
    throw new APIError('无法识别客户端', 400, 'CLIENT_IDENTIFICATION_ERROR');
  }

  try {
    const { count, resetTime } = await rateLimiter.increment(key, windowMs);

    // 检查是否超过限制
    if (count > max) {
      const resetDate = new Date(resetTime);
      const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);
      
      throw new APIError(
        `请求过于频繁，请在 ${retryAfterSeconds} 秒后重试`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // 设置速率限制相关的响应头（这里只能记录，实际设置需要在响应时）
    // 实际项目中可以通过context或其他方式传递这些信息
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // 速率限制系统故障时，记录错误但不阻止请求
    console.error('Rate limiter error:', error);
  }
}

// 专门的API端点速率限制配置
export const rateLimitConfigs = {
  // 读取操作 - 较宽松
  read: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 1000次请求
  },
  
  // 写入操作 - 较严格
  write: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 100次请求
  },
  
  // 敏感操作 - 最严格
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10, // 10次请求
  },
  
  // 文件上传 - 特殊限制
  upload: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 50, // 50次上传
  },
  
  // 元数据提取 - 中等限制
  metadata: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 200, // 200次请求
  },
};

// 基于用户的速率限制（如果有用户系统）
export async function userBasedRateLimit(
  request: NextRequest,
  userId: string,
  options: {
    windowMs: number;
    max: number;
  }
): Promise<void> {
  const key = `user:${userId}`;
  const { count, resetTime } = await rateLimiter.increment(key, options.windowMs);

  if (count > options.max) {
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    throw new APIError(
      `操作过于频繁，请在 ${retryAfterSeconds} 秒后重试`,
      429,
      'USER_RATE_LIMIT_EXCEEDED'
    );
  }
}

// 基于IP和用户的组合限制
export async function combinedRateLimit(
  request: NextRequest,
  options: {
    windowMs: number;
    max: number;
    userMax?: number; // 用户特定限制
  },
  userId?: string
): Promise<void> {
  const ip = getClientIdentifier(request);
  
  // IP级别限制
  await rateLimit(request, {
    windowMs: options.windowMs,
    max: options.max,
  });

  // 用户级别限制（如果提供了userId且有userMax配置）
  if (userId && options.userMax) {
    await userBasedRateLimit(request, userId, {
      windowMs: options.windowMs,
      max: options.userMax,
    });
  }
}