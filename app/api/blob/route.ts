import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge'

// 获取Blob存储状态
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return Response.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 })
  }

  return Response.json({ status: 'Blob storage ready', token: !!token })
}

// 直接由服务端接收内容并写入 Blob（适合小文本、已在服务器侧生成的内容）
export async function POST(request: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return Response.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 })
  }

  try {
    // 支持两种 body：JSON 或原始二进制
    const contentType = request.headers.get('content-type') || ''

    // 默认路径前缀，可按需改成基于用户/业务的目录
    let pathname = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}`
    let access: 'public' | 'private' = 'public'

    if (contentType.includes('application/json')) {
      const { path, data, access: inputAccess }: { path?: string; data: string; access?: 'public' | 'private' } = await request.json()
      if (path) pathname = path
      if (inputAccess) access = inputAccess
      const result = await put(pathname, data, { access, token })
      return Response.json({ url: result.url, pathname })
    }

    // 处理原始二进制（如从前端 fetch 直接发送 ArrayBuffer/FormData 中的 file.arrayBuffer()）
    const arrayBuffer = await request.arrayBuffer()
    const result = await put(pathname, Buffer.from(arrayBuffer), { access, token })
    return Response.json({ url: result.url, pathname })
  } catch (error) {
    return Response.json({ error: 'Failed to upload to Blob' }, { status: 500 })
  }
}


