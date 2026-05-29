import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 获取所有文章
export async function GET() {
  try {
    const articles = await db.article.findMany({
      orderBy: { publishTime: 'desc' }
    })
    return NextResponse.json(articles)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// 保存文章（批量）
export async function POST(req: Request) {
  try {
    const { articles } = await req.json()
    if (!Array.isArray(articles)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const results = []
    for (const article of articles) {
      const result = await db.article.upsert({
        where: { url: article.url },
        update: {
          title: article.title,
          accountName: article.accountName,
          publishTime: new Date(article.publishTime),
          readCount: article.readCount,
          likeCount: article.likeCount,
          collectCount: article.collectCount,
          lookingCount: article.lookingCount,
          shareCount: article.shareCount,
          commentCount: article.commentCount,
        },
        create: {
          url: article.url,
          accountName: article.accountName,
          title: article.title,
          publishTime: new Date(article.publishTime),
          readCount: article.readCount,
          likeCount: article.likeCount,
          collectCount: article.collectCount,
          lookingCount: article.lookingCount,
          shareCount: article.shareCount,
          commentCount: article.commentCount,
        }
      })
      results.push(result)
    }

    return NextResponse.json({ success: true, count: results.length, articles: results })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
