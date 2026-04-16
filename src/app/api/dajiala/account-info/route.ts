import { NextResponse } from 'next/server'
import { getAccountInfo } from '@/lib/dajiala'

// 获取公众号基本信息
export async function POST(req: Request) {
  const { accountName } = await req.json()

  if (!accountName) {
    return NextResponse.json({ error: 'accountName required' }, { status: 400 })
  }

  try {
    const result = await getAccountInfo(accountName)
    if (result.code !== 0) {
      return NextResponse.json({ error: result.msg || '获取失败' }, { status: 400 })
    }
    return NextResponse.json({
      name: result.data.name,
      ghid: result.data.ghid,
      wxid: result.data.wxid,
      avatar: result.data.avatar,
      qrcode: result.data.qrcode,
      fans: result.data.fans,
      avgTopRead: result.data.avg_top_read,
      avgTopZan: result.data.avg_top_zan,
      weekArticles: result.data.week_articles,
      latestPublishTime: result.data.latest_publish_time,
      jzlIndex: result.data.jzl_index,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
