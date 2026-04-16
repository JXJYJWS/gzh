import { NextResponse } from 'next/server'
import { getBalance } from '@/lib/dajiala'

export async function GET() {
  try {
    const balance = await getBalance()
    return NextResponse.json({ balance })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
