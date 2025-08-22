import { NextRequest, NextResponse } from 'next/server'

// 真正的链接元数据提取函数
async function extractMetadata(url: string) {
  try {
    const domain = new URL(url).hostname
    
    // 获取网页内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // 设置超时
      signal: AbortSignal.timeout(10000) // 10秒超时
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // 解析 HTML 提取元数据
    const metadata = {
      title: extractTitle(html, domain),
      description: extractDescription(html),
      image: extractImage(html, url),
      favicon: extractFavicon(html, url),
      domain
    }
    
    return metadata
  } catch (error) {
    console.error('提取元数据失败:', error)
    
    // 如果提取失败，返回基本信息
    const domain = new URL(url).hostname
    return {
      title: `来自 ${domain} 的内容`,
      description: "无法获取详细描述信息",
      image: null,
      favicon: `https://${domain}/favicon.ico`,
      domain
    }
  }
}

// 提取标题
function extractTitle(html: string, domain: string): string {
  // 尝试提取 title 标签
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // 尝试提取 og:title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim()
  }
  
  // 尝试提取 twitter:title
  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i)
  if (twitterTitleMatch) {
    return twitterTitleMatch[1].trim()
  }
  
  return `来自 ${domain} 的内容`
}

// 提取描述
function extractDescription(html: string): string {
  // 尝试提取 meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (descMatch) {
    return descMatch[1].trim()
  }
  
  // 尝试提取 og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogDescMatch) {
    return ogDescMatch[1].trim()
  }
  
  // 尝试提取 twitter:description
  const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i)
  if (twitterDescMatch) {
    return twitterDescMatch[1].trim()
  }
  
  return "暂无描述信息"
}

// 提取图片
function extractImage(html: string, baseUrl: string): string | null {
  // 尝试提取 og:image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogImageMatch) {
    return resolveUrl(ogImageMatch[1], baseUrl)
  }
  
  // 尝试提取 twitter:image
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
  if (twitterImageMatch) {
    return resolveUrl(twitterImageMatch[1], baseUrl)
  }
  
  return null
}

// 提取 favicon
function extractFavicon(html: string, baseUrl: string): string {
  // 尝试提取 link rel="icon"
  const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i)
  if (iconMatch) {
    return resolveUrl(iconMatch[1], baseUrl)
  }
  
  // 默认使用 /favicon.ico
  const domain = new URL(baseUrl).origin
  return `${domain}/favicon.ico`
}

// 解析相对 URL
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: { code: 'URL_REQUIRED', message: 'URL 参数必需' } },
        { status: 400 }
      )
    }

    // 验证 URL 格式
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_URL', message: '无效的 URL 格式' } },
        { status: 400 }
      )
    }

    const metadata = await extractMetadata(url)

    return NextResponse.json({
      success: true,
      data: metadata
    })
  } catch (error) {
    console.error('提取元数据失败:', error)
    return NextResponse.json(
      { success: false, error: { code: 'EXTRACT_METADATA_ERROR', message: '提取元数据失败' } },
      { status: 500 }
    )
  }
}