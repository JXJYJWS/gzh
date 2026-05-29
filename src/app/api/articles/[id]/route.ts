import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

// 更新文章数据
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const article = await db.article.update({
      where: { id },
      data: {
        title: body.title,
        accountName: body.accountName,
        publishTime: body.publishTime ? new Date(body.publishTime) : undefined,
        readCount: body.readCount,
        likeCount: body.likeCount,
        collectCount: body.collectCount,
        lookingCount: body.lookingCount,
        shareCount: body.shareCount,
        commentCount: body.commentCount,
      }
    })
    return NextResponse.json(article)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.article.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
