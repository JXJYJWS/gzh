import { NextResponse } from 'next/server'
import { batchGetMetrics } from '@/lib/dajiala'

export async function POST(req: Request) {
  const { articles } = await req.json()
  if (!Array.isArray(articles)) {
    return NextResponse.json({ error: 'articles must be array' }, { status: 400 })
  }

  try {
    const results = await batchGetMetrics(articles)
    const normalized = results.map((r: any) => {
      if (r.success && r.data) {
        // 兼容嵌套格式 { code, data: { read, ... } } 和扁平格式 { read, ... }
        const metrics = r.data.data || r.data
        return { ...r, data: metrics }
      }
      return r
    })
    return NextResponse.json({ results: normalized })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
