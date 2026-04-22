import { NextResponse } from 'next/server'
import { getVideoMetrics, getVideoList, searchVideoAccounts, getVideoAccountId } from '@/lib/video'

export async function POST(req: Request) {
  const { type, objectId, objectNonceId, lastBuffer, v2Name, keyword } = await req.json()

  try {
    let data

    if (type === 'list') {
      // 获取视频号作品列表
      if (!v2Name) {
        return NextResponse.json({ error: 'v2Name is required for list type' }, { status: 400 })
      }
      data = await getVideoList(v2Name, lastBuffer || '')
    } else if (type === 'search') {
      // 关键词搜索视频号
      if (!keyword) {
        return NextResponse.json({ error: 'keyword is required for search type' }, { status: 400 })
      }
      data = await searchVideoAccounts(keyword)
    } else if (type === 'getId') {
      // 获取指定视频号ID
      if (!keyword) {
        return NextResponse.json({ error: 'keyword is required for getId type' }, { status: 400 })
      }
      data = await getVideoAccountId(keyword)
    } else {
      // 获取单个视频互动数据 (默认)
      if (!objectId) {
        return NextResponse.json({ error: 'objectId is required' }, { status: 400 })
      }
      data = await getVideoMetrics(objectId, objectNonceId || '', lastBuffer || '')
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
