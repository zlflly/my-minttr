import { NextRequest, NextResponse } from 'next/server'

// 真正的链接元数据提取函数
async function extractMetadata(url: string) {
  try {
    const domain = new URL(url).hostname
    
    // 获取网页内容
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    // 对于Twitter/X，添加特殊的请求头
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      headers['Accept-Language'] = 'en-US,en;q=0.5'
      headers['Accept-Encoding'] = 'gzip, deflate, br'
      headers['DNT'] = '1'
      headers['Connection'] = 'keep-alive'
      headers['Upgrade-Insecure-Requests'] = '1'
    }
    
    const response = await fetch(url, {
      headers,
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
      description: extractDescription(html, url),
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
  // X(Twitter)特殊处理
  if (domain.includes('twitter.com') || domain.includes('x.com')) {
    return extractTwitterTitle(html, domain)
  }
  
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
function extractDescription(html: string, baseUrl?: string): string {
  // X(Twitter)特殊处理
  if (baseUrl) {
    const domain = new URL(baseUrl).hostname
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return extractTwitterDescription(html)
    }
  }
  
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
  const domain = new URL(baseUrl).hostname
  
  // 哔哩哔哩视频封面特殊处理
  if (domain.includes('bilibili.com')) {
    return extractBilibiliCover(html, baseUrl)
  }
  
  // ArchDaily图片特殊处理
  if (domain.includes('archdaily.cn') || domain.includes('archdaily.com')) {
    return extractArchDailyFirstImage(html, baseUrl)
  }
  
  // X(Twitter)特殊处理
  if (domain.includes('twitter.com') || domain.includes('x.com')) {
    return extractTwitterImage(html, baseUrl)
  }
  
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

// 提取哔哩哔哩视频封面
function extractBilibiliCover(html: string, baseUrl: string): string | null {
  // 优先从og:image meta标签提取（最可靠的方式）
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogImageMatch && ogImageMatch[1]) {
    let coverUrl = ogImageMatch[1].trim()
    
    // 处理协议缺失的情况：//i0.hdslb.com/... → https://i0.hdslb.com/...
    if (coverUrl.startsWith('//')) {
      coverUrl = 'https:' + coverUrl
    }
    
    // 移除B站URL中的尺寸参数，获取原图
    // 例如：.../cover.jpg@672w_378h_1c_!web-search-common-cover.jpg → .../cover.jpg
    coverUrl = coverUrl.replace(/@.*$/, '')
    
    return coverUrl
  }
  
  // 备选方案：从JSON-LD数据中提取封面
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i)
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1])
      if (jsonData.thumbnailUrl) {
        let coverUrl = jsonData.thumbnailUrl
        if (coverUrl.startsWith('//')) {
          coverUrl = 'https:' + coverUrl
        }
        return coverUrl.replace(/@.*$/, '')
      }
    } catch (e) {
      console.log('解析JSON-LD失败:', e)
    }
  }
  
  // 备选方案：从window.__INITIAL_STATE__中提取
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});?\s*\(function/)
  if (initialStateMatch) {
    try {
      const stateData = JSON.parse(initialStateMatch[1])
      const picUrl = stateData?.videoData?.pic || stateData?.videoInfo?.pic
      if (picUrl) {
        let coverUrl = picUrl
        if (coverUrl.startsWith('//')) {
          coverUrl = 'https:' + coverUrl
        }
        return coverUrl.replace(/@.*$/, '')
      }
    } catch (e) {
      console.log('解析INITIAL_STATE失败:', e)
    }
  }
  
  // 最后备选：其他meta标签
  const otherPatterns = [
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i
  ]
  
  for (const pattern of otherPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let coverUrl = match[1]
      if (coverUrl.startsWith('//')) {
        coverUrl = 'https:' + coverUrl
      }
      return coverUrl.replace(/@.*$/, '')
    }
  }
  
  return null
}

// 提取ArchDaily第一张图片
function extractArchDailyFirstImage(html: string, baseUrl: string): string | null {
  // 优先尝试提取文章主要图片
  const imagePatterns = [
    // ArchDaily的主要图片通常在特定的容器中
    /<img[^>]*class=["'][^"']*main-image[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*class=["'][^"']*hero[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*class=["'][^"']*featured[^"']*["'][^>]*src=["']([^"']+)["']/i,
    // JSON-LD中的图片
    /"image"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*\[\s*"([^"]+)"/i,
    // 文章内容区域的第一张图片
    /<article[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    // 通用的第一张图片（排除小图标和装饰性图片）
    /<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*(?:width=["']\d{3,}|height=["']\d{3,})/i
  ]
  
  for (const pattern of imagePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const imageUrl = resolveUrl(match[1], baseUrl)
      // 过滤掉明显的装饰性图片和图标
      if (!imageUrl.includes('icon') && 
          !imageUrl.includes('logo') && 
          !imageUrl.includes('avatar') &&
          !imageUrl.includes('placeholder')) {
        return imageUrl
      }
    }
  }
  
  // 如果以上都没找到，尝试og:image作为备选
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogImageMatch) {
    return resolveUrl(ogImageMatch[1], baseUrl)
  }
  
  return null
}

// 提取X(Twitter)图片和头像
function extractTwitterImage(html: string, baseUrl: string): string | null {
  // 优先提取推文中的图片（非头像）
  const mediaPatterns = [
    // 推文中的媒体图片（从示例HTML结构看）
    /<img[^>]*src=["']([^"']*pbs\.twimg\.com\/media[^"']+)["']/i,
    // 推文图片的常见class
    /<img[^>]*class=["'][^"']*media[^"']*["'][^>]*src=["']([^"']+)["']/i,
    // Twitter Card中的图片
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    // 其他可能的推文图片
    /<img[^>]*src=["']([^"']*twimg\.com\/[^"']*(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i
  ]
  
  // 首先寻找推文媒体图片
  for (const pattern of mediaPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const imageUrl = resolveUrl(match[1], baseUrl)
      // 确保这不是头像
      if (!imageUrl.includes('profile_images') && 
          (imageUrl.includes('media') || imageUrl.includes('twimg.com'))) {
        return imageUrl
      }
    }
  }
  
  // 如果没有找到推文图片，再考虑用户头像
  const avatarPatterns = [
    /<img[^>]*src=["']([^"']*pbs\.twimg\.com\/profile_images[^"']+)["']/i,
    /<img[^>]*class=["'][^"']*profile[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*class=["'][^"']*avatar[^"']*["'][^>]*src=["']([^"']+)["']/i
  ]
  
  for (const pattern of avatarPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const imageUrl = resolveUrl(match[1], baseUrl)
      if (imageUrl.includes('profile_images') || imageUrl.includes('pbs.twimg.com')) {
        return imageUrl
      }
    }
  }
  
  return null
}

// 提取X(Twitter)标题
function extractTwitterTitle(html: string, domain: string): string {
  // 尝试组合用户名和推文内容作为标题
  let username = ''
  let tweetContent = ''
  
  // 提取用户名
  const usernamePatterns = [
    // 从 og:title 中提取用户名（通常格式为 "用户名 on X: 推文内容"）
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*?)\s+on\s+(X|Twitter):/i,
    // 从 title 标签提取用户名
    /<title[^>]*>([^"']*?)\s+on\s+(X|Twitter)[^<]*<\/title>/i,
    // 备选：从页面结构中提取
    /<span[^>]*class=["'][^"']*username[^"']*["'][^>]*>@?([^<]+)</i
  ]
  
  for (const pattern of usernamePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      username = match[1].trim().replace(/^@/, '')
      break
    }
  }
  
  // 提取推文内容
  const contentPatterns = [
    // 从 meta description 提取推文内容
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    // 从 og:description 提取
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    // 从 og:title 中提取推文内容部分
    /<meta[^>]*property=["']og:title["'][^>]*content=["'][^"']*?\s+on\s+(X|Twitter):\s*["']?([^"']+)["']?/i
  ]
  
  for (const pattern of contentPatterns) {
    const match = html.match(pattern)
    if (match) {
      // 对于第三个模式，推文内容在match[2]中
      tweetContent = (match[2] || match[1]).trim()
      break
    }
  }
  
  // 组合标题
  if (username && tweetContent) {
    // 如果推文内容太长，截取前100字符
    const shortContent = tweetContent.length > 100 ? tweetContent.substring(0, 100) + '...' : tweetContent
    return `@${username}: ${shortContent}`
  } else if (tweetContent) {
    return tweetContent.length > 120 ? tweetContent.substring(0, 120) + '...' : tweetContent
  } else if (username) {
    return `@${username} 的推文`
  }
  
  // 最后的备选方案
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  if (ogTitleMatch) {
    let title = ogTitleMatch[1].trim()
    title = title.replace(/\s+on\s+(X|Twitter):\s*$|:\s*$/, '')
    return title
  }
  
  return `来自 ${domain} 的推文`
}

// 提取X(Twitter)描述
function extractTwitterDescription(html: string): string {
  // 尝试从 meta description 获取推文内容
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (descMatch) {
    return descMatch[1].trim()
  }
  
  // 尝试从 og:description 获取
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogDescMatch) {
    return ogDescMatch[1].trim()
  }
  
  // 尝试从推文内容区域提取
  const tweetContentMatch = html.match(/<div[^>]*data-testid=["']tweetText["'][^>]*>([^<]+)</i)
  if (tweetContentMatch) {
    return tweetContentMatch[1].trim()
  }
  
  return "推文内容"
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