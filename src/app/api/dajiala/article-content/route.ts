import { NextResponse } from 'next/server'
import { callApi } from '@/lib/dajiala'

// 获取文章正文 HTML
export async function POST(req: Request) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  try {
    const result = await callApi('/fbmain/monitor/v3/article_html', { url })
    if (result.code !== 0) {
      return NextResponse.json({ error: result.msg || '获取失败' }, { status: 400 })
    }
    return NextResponse.json({
      title: result.data?.title || '',
      html: result.data?.html || '',
      author: result.data?.author || '',
      nickname: result.data?.nickname || '',
      postTime: result.data?.post_time || null,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
