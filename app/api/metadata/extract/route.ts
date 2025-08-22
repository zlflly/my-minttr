import { NextRequest, NextResponse } from 'next/server'

// 简单的链接元数据提取函数
function extractMetadata(url: string) {
  const domain = new URL(url).hostname
  
  // 模拟元数据提取（实际应用中应该真正抓取网页内容）
  const mockData: Record<string, any> = {
    "sspai.com": {
      title: "少数派：一个关于阅读、笔记与思考的分享",
      description: "在这里，我们讨论如何更有效地阅读，如何做笔记，以及如何将思考融入日常。探索数字时代的知识管理方法。",
      image: "/modern-workspace.png",
      favicon: "/sspai-favicon.png",
      domain: "sspai.com",
    },
    "github.com": {
      title: "GitHub - The world's leading software development platform",
      description: "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage Git repositories.",
      image: "/github-code-repository.png",
      favicon: "/github-favicon.png",
      domain: "github.com",
    },
    "medium.com": {
      title: "Medium - Where good ideas find you",
      description: "Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing on any topic.",
      image: "/article-writing-platform.png",
      favicon: "/medium-favicon.png",
      domain: "medium.com",
    },
  }

  return mockData[domain] || {
    title: `内容来自 ${domain}`,
    description: "这是链接内容的预览。实际实现会从URL获取真实的元数据。",
    image: "/webpage-preview.png",
    favicon: "/website-favicon.png",
    domain,
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

    const metadata = extractMetadata(url)

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