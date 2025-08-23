import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  withQueryValidation, 
  withValidation, 
  createAPIResponse, 
  securityHeaders 
} from '@/lib/api-middleware';
import { 
  createNoteSchema, 
  paginationSchema, 
  noteTypeSchema,
  sanitizeString,
  sanitizeUrl
} from '@/lib/validation';
import type { NoteType } from '@/lib/types';

// 查询验证模式
const notesQuerySchema = paginationSchema.extend({
  type: noteTypeSchema.optional(),
}).transform((data) => {
  const page = Number(data.page) || 1;
  const limit = Math.min(Number(data.limit) || 20, 100);
  const type = data.type as NoteType | undefined;
  return { page, limit, type };
});

// 获取笔记列表
export const GET = withQueryValidation(
  notesQuerySchema,
  async (request: NextRequest, validatedQuery) => {
    const { page = 1, limit = 20, type } = validatedQuery;
    // 确保page和limit是数字
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    
    // 为演示目的，现在使用一个默认用户ID
    const defaultUserId = 'demo-user';

    const where = {
      userId: defaultUserId,
      isArchived: false,
      ...(type && { type }),
    };

    try {
      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (safePage - 1) * safeLimit,
          take: safeLimit,
          // 只选择必要的字段，提高性能
          select: {
            id: true,
            type: true,
            title: true,
            content: true,
            url: true,
            description: true,
            domain: true,
            faviconUrl: true,
            imageUrl: true,
            tags: true,
            color: true,
            isHidden: true,
            isArchived: true,
            isFavorite: true,
            createdAt: true,
            updatedAt: true,
            accessedAt: true,
          },
        }),
        prisma.note.count({ where }),
      ]);

      return NextResponse.json(
        createAPIResponse(
          notes,
          undefined,
          {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
          }
        ),
        { headers: securityHeaders() }
      );
    } catch (error) {
      console.error('获取笔记失败:', error);
      throw new Error('数据库操作失败');
    }
  }
);

// 创建新笔记
export const POST = withValidation(
  createNoteSchema,
  async (request: NextRequest, validatedData) => {
    // 为演示目的，现在使用一个默认用户ID
    const defaultUserId = 'demo-user';

    try {
      // 确保用户存在
      let user = await prisma.user.findUnique({
        where: { id: defaultUserId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: defaultUserId,
            email: 'demo@example.com',
            displayName: '演示用户',
          },
        });
      }

      // 清理和验证数据
      const cleanData = {
        userId: defaultUserId,
        type: validatedData.type || (validatedData.url ? 'LINK' as const : 'TEXT' as const),
        title: validatedData.title ? sanitizeString(validatedData.title) : null,
        content: validatedData.content ? sanitizeString(validatedData.content) : null,
        url: validatedData.url ? sanitizeUrl(validatedData.url) : null,
        description: validatedData.description ? sanitizeString(validatedData.description) : null,
        domain: validatedData.domain ? sanitizeString(validatedData.domain) : null,
        faviconUrl: validatedData.faviconUrl ? sanitizeUrl(validatedData.faviconUrl) : null,
        imageUrl: validatedData.imageUrl ? sanitizeUrl(validatedData.imageUrl) : null,
        tags: validatedData.tags ? sanitizeString(validatedData.tags) : '',
      };

      const note = await prisma.note.create({
        data: cleanData,
      });

      return NextResponse.json(
        createAPIResponse(note),
        { 
          status: 201,
          headers: securityHeaders()
        }
      );
    } catch (error) {
      console.error('创建笔记失败:', error);
      throw new Error('数据库操作失败');
    }
  }
);