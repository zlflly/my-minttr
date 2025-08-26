import { PrismaClient } from '@prisma/client'

// 优化的 Prisma 客户端配置
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
    // 优化配置
    transactionOptions: {
      timeout: 20000, // 20秒超时
      maxWait: 10000, // 最大等待10秒
    },
  }).$extends({
    query: {
      // 添加查询级别的优化
      note: {
        findMany: async ({ model, operation, args, query }) => {
          // 添加查询提示和优化
          const start = Date.now()
          const result = await query(args)
          const duration = Date.now() - start
          
          // 在开发环境记录慢查询
          if (process.env.NODE_ENV === 'development' && duration > 1000) {
            console.warn(`慢查询警告: ${model}.${operation} 用时 ${duration}ms`)
          }
          
          return result
        },
      },
    },
  })
}

// 全局单例模式，避免连接池耗尽
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prismaOptimized = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaOptimized
}

// 预热连接池的函数
export async function warmupDatabase() {
  try {
    await prismaOptimized.$queryRaw`SELECT 1`
    console.log('数据库连接池已预热')
  } catch (error) {
    console.error('数据库预热失败:', error)
  }
}

// 优化的查询助手
export const optimizedQueries = {
  // 快速获取笔记计数（使用估算）
  async getNotesCountFast(userId: string, where: any = {}) {
    // 对于大数据集，使用 PostgreSQL 的估算统计
    const result = await prismaOptimized.$queryRaw`
      SELECT reltuples::BIGINT AS estimate 
      FROM pg_class 
      WHERE relname = 'notes'
    ` as [{ estimate: bigint }]
    
    return Number(result[0]?.estimate || 0)
  },

  // 批量预加载相关数据
  async preloadRelatedData(noteIds: string[]) {
    if (noteIds.length === 0) return
    
    // 预加载可能需要的关联数据
    await Promise.all([
      prismaOptimized.noteCollection.findMany({
        where: { noteId: { in: noteIds } },
        select: { noteId: true, collectionId: true }
      }),
    ])
  }
}