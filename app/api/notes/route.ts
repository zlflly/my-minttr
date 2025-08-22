import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type NoteType = "LINK" | "TEXT"

// 获取笔记列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') as NoteType | null
    
    // 为演示目的，现在使用一个默认用户ID
    const defaultUserId = 'demo-user'

    const where = {
      userId: defaultUserId,
      isArchived: false,
      ...(type && { type })
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.note.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取笔记失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_NOTES_ERROR', message: '获取笔记失败' } },
      { status: 500 }
    )
  }
}

// 创建新笔记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, content, url, description, domain, faviconUrl, imageUrl, tags } = body

    // 为演示目的，现在使用一个默认用户ID
    const defaultUserId = 'demo-user'

    // 确保用户存在
    let user = await prisma.user.findUnique({
      where: { id: defaultUserId }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: defaultUserId,
          email: 'demo@example.com',
          displayName: '演示用户'
        }
      })
    }

    const note = await prisma.note.create({
      data: {
        userId: defaultUserId,
        type: type || (url ? 'LINK' : 'TEXT'),
        title,
        content,
        url,
        description,
        domain,
        faviconUrl,
        imageUrl,
        tags: tags || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('创建笔记失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_NOTE_ERROR', message: '创建笔记失败' } },
      { status: 500 }
    )
  }
}