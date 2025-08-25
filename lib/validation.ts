import { z } from 'zod';

// 基础验证模式
export const urlSchema = z.string().url('请输入有效的URL').min(1, 'URL不能为空');

export const noteIdSchema = z.string().cuid('无效的笔记ID');

export const tagSchema = z.string().max(100, '标签长度不能超过100个字符');

export const titleSchema = z.string()
  .max(200, '标题长度不能超过200个字符')
  .optional();

export const contentSchema = z.string()
  .max(10000, '内容长度不能超过10000个字符')
  .optional();

export const descriptionSchema = z.string()
  .max(500, '描述长度不能超过500个字符')
  .optional();

export const colorSchema = z.enum(['default', 'pink', 'blue', 'green']);

export const noteTypeSchema = z.enum(['LINK', 'TEXT', 'IMAGE']);

// 笔记数据验证模式
export const createNoteSchema = z.object({
  type: noteTypeSchema.optional(),
  title: titleSchema,
  content: contentSchema,
  url: urlSchema.nullable().optional(),
  description: descriptionSchema,
  domain: z.string().nullable().optional(),
  faviconUrl: urlSchema.nullable().optional(),
  imageUrl: urlSchema.nullable().optional(),
  tags: z.string().default(''),
});

export const updateNoteSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  url: urlSchema.optional(),
  description: descriptionSchema,
  tags: z.string().optional(),
  color: colorSchema.optional(),
  isHidden: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
}).partial();

export const metadataExtractionSchema = z.object({
  url: urlSchema,
});

// 分页验证模式 - 查询参数都是字符串
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10) || 1).pipe(z.number().int().min(1)),
  limit: z.string().transform(val => Math.min(parseInt(val, 10) || 20, 100)).pipe(z.number().int().min(1).max(100)),
});

// 类型安全的输入清理函数
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/on\w+\s*=/gi, '') // 移除事件处理器
    .trim();
}

export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  try {
    const url = new URL(input);
    // 只允许http和https协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

// 安全的JSON解析
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// 类型保护函数
export function isValidNoteType(type: unknown): type is 'LINK' | 'TEXT' | 'IMAGE' {
  return typeof type === 'string' && ['LINK', 'TEXT', 'IMAGE'].includes(type);
}

export function isValidColor(color: unknown): color is 'default' | 'pink' | 'blue' | 'green' {
  return typeof color === 'string' && ['default', 'pink', 'blue', 'green'].includes(color);
}

// API响应验证
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// 导出类型推断
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type MetadataExtractionInput = z.infer<typeof metadataExtractionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;