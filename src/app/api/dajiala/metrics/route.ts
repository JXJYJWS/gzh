import { NextResponse } from 'next/server'
import { batchGetMetrics } from '@/lib/dajiala'

export async function POST(req: Request) {
  const { articles } = await req.json()
  if (!Array.isArray(articles)) {
    return NextResponse.json({ error: 'articles must be array' }, { status: 400 })
  }

  try {
    const results = await batchGetMetrics(articles)
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
