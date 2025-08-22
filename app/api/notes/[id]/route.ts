import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个笔记
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        collections: {
          include: {
            collection: true
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: { code: 'NOTE_NOT_FOUND', message: '笔记不存在' } },
        { status: 404 }
      )
    }

    // 更新访问时间
    await prisma.note.update({
      where: { id: params.id },
      data: { accessedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('获取笔记失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_NOTE_ERROR', message: '获取笔记失败' } },
      { status: 500 }
    )
  }
}

// 更新笔记
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, content, url, description, domain, faviconUrl, imageUrl, tags, isArchived, isFavorite } = body

    const note = await prisma.note.update({
      where: { id: params.id },
      data: {
        title,
        content,
        url,
        description,
        domain,
        faviconUrl,
        imageUrl,
        tags,
        isArchived,
        isFavorite,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('更新笔记失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_NOTE_ERROR', message: '更新笔记失败' } },
      { status: 500 }
    )
  }
}

// 删除笔记
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: { message: '笔记已删除' }
    })
  } catch (error) {
    console.error('删除笔记失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_NOTE_ERROR', message: '删除笔记失败' } },
      { status: 500 }
    )
  }
}