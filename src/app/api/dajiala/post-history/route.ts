import { NextResponse } from 'next/server'
import { getPostHistory } from '@/lib/dajiala'

export async function POST(req: Request) {
  const { accountName, page = 1 } = await req.json()
  if (!accountName) return NextResponse.json({ error: 'accountName required' }, { status: 400 })

  try {
    const result = await getPostHistory(accountName, page)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
