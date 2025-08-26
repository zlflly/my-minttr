/**
 * 性能优化配置中心
 * 统一管理所有性能相关的配置和优化策略
 */

// 数据库查询优化配置
export const DATABASE_CONFIG = {
  // 连接池配置
  connectionPool: {
    timeout: 20000,      // 20秒超时
    maxWait: 10000,      // 最大等待10秒
    retries: 3,          // 重试次数
  },

  // 查询优化
  queryOptimization: {
    enableQueryLogging: process.env.NODE_ENV === 'development',
    slowQueryThreshold: 1000,  // 1秒以上算慢查询
    enableIndexHints: true,
    batchSize: 50,            // 批量操作大小
  },

  // 缓存策略
  caching: {
    notesListTTL: 60 * 1000,      // 笔记列表缓存1分钟
    metadataTTL: 30 * 60 * 1000,  // 元数据缓存30分钟
    countTTL: 2 * 60 * 1000,      // 计数缓存2分钟
  }
}

// 图片优化配置
export const IMAGE_CONFIG = {
  // 压缩配置
  compression: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'webp' as const,
    maxSizeKB: 800,
  },

  // 上传配置
  upload: {
    maxFileSize: 15 * 1024 * 1024,  // 15MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    concurrent: false,  // 是否允许并发上传
  },

  // 优化策略
  optimization: {
    enableCompression: true,
    enableProgressiveJPEG: true,
    enableWebP: true,
    enableResize: true,
  }
}

// 客户端缓存配置
export const CACHE_CONFIG = {
  // 缓存策略
  strategies: {
    staleWhileRevalidate: true,   // 返回缓存同时后台更新
    optimisticUpdates: true,      // 启用乐观更新
    prefetching: false,           // 预加载（暂时关闭）
  },

  // TTL配置
  ttl: {
    notes: 5 * 60 * 1000,         // 笔记缓存5分钟
    metadata: 30 * 60 * 1000,     // 元数据缓存30分钟
    images: 60 * 60 * 1000,       // 图片URL缓存1小时
  },

  // 存储配置
  storage: {
    maxSize: 50 * 1024 * 1024,    // 最大缓存50MB
    cleanup: true,                 // 自动清理过期缓存
    persist: false,                // 不持久化（使用内存缓存）
  }
}

// 网络优化配置
export const NETWORK_CONFIG = {
  // 请求配置
  requests: {
    timeout: 30000,               // 30秒超时
    retries: 2,                   // 重试2次
    retryDelay: 1000,             // 重试间隔1秒
  },

  // 并发控制
  concurrency: {
    maxConcurrent: 6,             // 最大并发请求数
    maxPerHost: 4,                // 每个主机最大并发
  },

  // 预加载策略
  preload: {
    criticalResources: true,      // 预加载关键资源
    nextPage: false,              // 不预加载下一页（节省带宽）
  }
}

// 用户体验配置
export const UX_CONFIG = {
  // 加载状态
  loading: {
    minimumDuration: 300,         // 最小加载时间300ms（避免闪烁）
    showProgressAfter: 1000,      // 1秒后显示详细进度
    enableSkeleton: true,         // 启用骨架屏
  },

  // 反馈配置
  feedback: {
    showTimings: process.env.NODE_ENV === 'development', // 开发环境显示耗时
    enableToasts: true,           // 启用提示消息
    autoCloseDelay: 3000,         // 3秒后自动关闭成功消息
  },

  // 动画配置
  animations: {
    enableTransitions: true,      // 启用过渡动画
    duration: 200,                // 默认动画时长
    easing: 'ease-out',          // 缓动函数
  }
}

// 性能监控配置
export const MONITORING_CONFIG = {
  // 指标收集
  metrics: {
    enableTiming: true,           // 收集耗时指标
    enableErrorTracking: true,    // 错误追踪
    enableUserActions: true,      // 用户行为追踪
  },

  // 报告配置
  reporting: {
    consoleOutput: process.env.NODE_ENV === 'development',
    batchSize: 10,               // 批量上报大小
    flushInterval: 30000,        // 30秒上报一次
  },

  // 阈值配置
  thresholds: {
    apiResponse: 2000,           // API响应时间阈值2秒
    imageUpload: 10000,          // 图片上传阈值10秒
    pageLoad: 3000,              // 页面加载阈值3秒
  }
}

// 导出合并配置
export const PERFORMANCE_CONFIG = {
  database: DATABASE_CONFIG,
  image: IMAGE_CONFIG,
  cache: CACHE_CONFIG,
  network: NETWORK_CONFIG,
  ux: UX_CONFIG,
  monitoring: MONITORING_CONFIG,
}

// 性能优化建议函数
export function getOptimizationRecommendations() {
  const recommendations = []

  if (process.env.NODE_ENV === 'production') {
    recommendations.push({
      type: 'database',
      priority: 'high',
      message: '建议启用数据库连接池和查询缓存'
    })

    recommendations.push({
      type: 'cdn',
      priority: 'medium', 
      message: '考虑使用CDN加速静态资源加载'
    })

    recommendations.push({
      type: 'compression',
      priority: 'high',
      message: '确保启用gzip/brotli压缩'
    })
  }

  return recommendations
}

// 性能监控工具
export class PerformanceTracker {
  private timings = new Map<string, number>()
  private metrics: Array<{
    operation: string
    duration: number
    timestamp: number
    success: boolean
  }> = []

  start(operation: string): void {
    this.timings.set(operation, performance.now())
  }

  end(operation: string, success = true): number {
    const startTime = this.timings.get(operation)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.timings.delete(operation)

    // 记录指标
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      success
    })

    // 检查是否超过阈值
    const threshold = MONITORING_CONFIG.thresholds.apiResponse
    if (duration > threshold) {
      console.warn(`慢操作警告: ${operation} 用时 ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  getMetrics() {
    return [...this.metrics]
  }

  clearMetrics() {
    this.metrics = []
  }
}

export const performanceTracker = new PerformanceTracker()