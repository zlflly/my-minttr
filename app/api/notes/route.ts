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
import type { NoteType, APIError as APIErrorInterface } from '@/lib/types';
import { handleError } from '@/lib/error-handler';

// 查询验证模式 - 手动处理查询参数
const parseQuery = (searchParams: URLSearchParams) => {
  const page = parseInt(searchParams.get('page') || '1', 10) || 1;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
  const typeParam = searchParams.get('type');
  const type = typeParam && ['LINK', 'TEXT', 'IMAGE'].includes(typeParam) 
    ? typeParam as NoteType 
    : undefined;
  
  return { page, limit, type };
};

// 获取笔记列表
export async function GET(request: NextRequest) {
  try {
    const { page, limit, type } = parseQuery(request.nextUrl.searchParams);
    
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
          skip: (page - 1) * limit,
          take: limit,
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
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        ),
        { headers: securityHeaders() }
      );
    } catch (error) {
      console.error('获取笔记失败:', error);
      return NextResponse.json(
        createAPIResponse(undefined, {
          code: 'FETCH_NOTES_ERROR',
          message: '获取笔记失败'
        }),
        { 
          status: 500,
          headers: securityHeaders()
        }
      );
    }
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    if (error instanceof Error) {
      handleError(error);
    }
    return NextResponse.json(
      createAPIResponse(undefined, {
        code: 'FETCH_NOTES_ERROR',
        message: error instanceof Error ? error.message : '获取笔记列表失败'
      }),
      { 
        status: 500,
        headers: securityHeaders()
      }
    );
  }
}

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