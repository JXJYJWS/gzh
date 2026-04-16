import { NextResponse } from 'next/server'
import { callApi } from '@/lib/dajiala'

// 按关键词搜索文章 (使用极致了 kw_search 接口)
export async function POST(req: Request) {
  const { keyword, page = 1, sortType = 1, mode = 1, period = 7, fetchMetrics = false } = await req.json()

  if (!keyword) {
    return NextResponse.json({ error: 'keyword required' }, { status: 400 })
  }

  try {
    const result = await callApi('/fbmain/monitor/v3/kw_search', {
      kw: keyword,
      sort_type: sortType, // 1:按阅读数 2:按时间
      mode,              // 1:搜索标题 2:搜索正文 3:搜索标题和正文
      period,            // 搜索天数 (1-7天，正文最大30天)
      page,
    })

    if (result.code !== 0) {
      return NextResponse.json({ error: result.msg || '搜索失败' }, { status: 400 })
    }

    // 转换为标准格式
    let articles = (result.data || []).map((item: any) => ({
      id: `kw_${Date.now()}_${item.update_time}_${Math.random().toString(36).slice(2, 9)}`,
      accountName: item.wx_name,
      title: item.title,
      url: item.url,
      publishTime: new Date(item.publish_time * 1000).toISOString(),
      // kw_search 可能不返回阅读量，先尝试使用返回的值
      readCount: item.read || null,
      likeCount: item.praise || null,
      lookingCount: item.looking || null,
      shareCount: null,
      collectCount: null,
    }))

    // 如果需要获取详细数据且没有阅读量，则批量获取
    if (fetchMetrics && articles.length > 0) {
      const { getBasicMetrics } = await import('@/lib/dajiala')

      for (let i = 0; i < articles.length; i++) {
        try {
          const metrics = await getBasicMetrics(articles[i].url)
          if (metrics.data) {
            articles[i].readCount = metrics.data.read
            articles[i].likeCount = metrics.data.zan
            articles[i].lookingCount = metrics.data.looking
          }
        } catch {
          // 获取失败保持原值
        }
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return NextResponse.json({
      articles,
      total: result.total,
      totalPage: result.total_page,
      currentPage: result.page,
      hasMore: result.page < result.total_page,
      message: `找到 ${result.data_number || articles.length} 篇包含"${keyword}"的文章`
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
