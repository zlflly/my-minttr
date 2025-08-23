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
    return Response.json({ 
      success: false, 
      error: { code: 'MISSING_TOKEN', message: 'Missing BLOB_READ_WRITE_TOKEN' } 
    }, { status: 500 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // 处理FormData文件上传
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return Response.json({ 
          success: false, 
          error: { code: 'NO_FILE', message: 'No file provided' } 
        }, { status: 400 })
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return Response.json({ 
          success: false, 
          error: { code: 'INVALID_FILE_TYPE', message: 'Only image files are allowed' } 
        }, { status: 400 })
      }

      // 验证文件大小 (最大10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return Response.json({ 
          success: false, 
          error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 10MB' } 
        }, { status: 400 })
      }

      // 生成唯一文件名
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).slice(2)
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const pathname = `images/${timestamp}-${randomId}.${fileExtension}`

      // 上传到Vercel Blob
      const arrayBuffer = await file.arrayBuffer()
      const result = await put(pathname, Buffer.from(arrayBuffer), { 
        access: 'public', 
        token,
        contentType: file.type
      })

      return Response.json({ 
        success: true, 
        data: { 
          url: result.url, 
          pathname,
          size: file.size,
          type: file.type
        } 
      })
    }

    // 处理JSON格式的数据
    if (contentType.includes('application/json')) {
      const { path, data, access: inputAccess }: { path?: string; data: string; access?: 'public' | 'private' } = await request.json()
      let pathname = path || `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}`
      const access: 'public' = 'public' // 强制使用public访问
      
      const result = await put(pathname, data, { access, token })
      return Response.json({ 
        success: true, 
        data: { url: result.url, pathname } 
      })
    }

    // 处理原始二进制数据
    const arrayBuffer = await request.arrayBuffer()
    const pathname = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}`
    const result = await put(pathname, Buffer.from(arrayBuffer), { access: 'public', token })
    
    return Response.json({ 
      success: true, 
      data: { url: result.url, pathname } 
    })
  } catch (error) {
    console.error('Blob upload error:', error)
    return Response.json({ 
      success: false, 
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload to Blob storage' } 
    }, { status: 500 })
  }
}


