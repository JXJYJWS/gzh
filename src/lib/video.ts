// 视频号 API 客户端 with mock mode
const BASE_URL = 'https://www.dajiala.com'
const KEY = process.env.DAJIALA_KEY || 'mock'
const IS_MOCK = KEY === 'mock'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function call<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  if (IS_MOCK) return mock(endpoint, body) as T

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, key: process.env.DAJIALA_KEY }),
  })
  const data = await res.json()
  if (data.code === -1) throw new Error('Rate limit exceeded')
  if (data.code === 20001) throw new Error('Insufficient balance')
  if (data.code === 101) throw new Error('object_id 错误')
  if (data.code === 102) throw new Error('last_buffer 错误')
  if (data.code === 103) throw new Error('获取留言失败')
  if (data.code === 105) throw new Error('请求类型不存在')
  if (data.code === 50000) throw new Error('服务器内部错误')
  if (data.code !== 0) throw new Error(data.msg || `API error: ${data.code}`)
  return data
}

function mock(endpoint: string, body: Record<string, unknown>) {
  const now = Date.now()
  const type = body.type as string
  const keyword = body.keywords as string

  switch (endpoint) {
    case '/fbmain/monitor/v3/wxvideo':
      if (type === '9') {
        // 单个视频互动数据
        return {
          code: 0,
          count_info: {
            comment_count: Math.floor(Math.random() * 500) + 50,
            like_count: Math.floor(Math.random() * 5000) + 500,
            forward_count: Math.floor(Math.random() * 1000) + 100,
            fav_count: Math.floor(Math.random() * 2000) + 200,
            version_data: {
              data_version: Math.floor(now / 1000)
            }
          },
          last_buffer: `mock_buffer_${now}`,
          down_continue_flag: 1,
          cost: 0.04,
          remain_money: 999.96
        }
      } else if (type === '1') {
        // 作品列表
        const page = (body.page as number) || 1
        return {
          code: 0,
          object: Array.from({ length: 15 }, (_, i) => ({
            media_type: i === 0 ? '视频' : ['视频', '视频', '视频', '图片'][i % 4],
            object_id: `${now + i}`,
            export_id: `export_${now + i}`,
            object_nonce_id: `nonce_${now + i}`,
            fav_count: Math.floor(Math.random() * 5000) + 100,
            like_count: Math.floor(Math.random() * 20000) + 1000,
            forward_count: Math.floor(Math.random() * 1000) + 50,
            comment_count: Math.floor(Math.random() * 500) + 20,
            sticky_time: i === 0 ? now / 1000 : null,
            publish_time: now / 1000 - i * 86400 * Math.floor(Math.random() * 10 + 1),
            cover_url: '',
            thumb_url: '',
            file_size: Math.floor(Math.random() * 50000000) + 1000000,
            video_play_len: Math.floor(Math.random() * 300) + 10,
          })),
          feeds_count: 100,
          original_count: 80,
          last_buffer: `mock_list_buffer_${now}`,
          continue_flag: page < 3 ? 1 : 0,
          cost: 0.2,
          remain_money: 999.8
        }
      } else if (type === '4' || type === '6') {
        // 搜索视频号 / 获取指定视频号ID
        const names = ['官方账号', '资讯频道', '热点追踪', '视频精选']
        return {
          code: 0,
          v2_info_list: Array.from({ length: 5 }, (_, i) => ({
            contact: {
              username: `v2_mock_${keyword || 'account'}_${i}_${now}`,
              nickname: `${keyword || '视频号'}${names[i % names.length]}${i + 1}`,
              signature: `这是关于${keyword || '话题'}的视频号简介`,
              ext_info: ['北京', '上海', '广东', '浙江', '四川'][i % 5]
            },
            video_object_list: [{
              id: `${now + i}`,
              nickname: `${keyword || '视频号'}${names[i % names.length]}${i + 1}`,
              username: `v2_mock_${keyword || 'account'}_${i}_${now}`,
              object_nonce_id: `nonce_${now + i}`
            }]
          })),
          cost: type === '4' ? 0.5 : 0.2,
          remain_money: 999.5
        }
      }
      return { code: 0 }
    default:
      return { code: 0 }
  }
}

// 视频号互动数据接口
export interface VideoMetrics {
  comment_count: number  // 评论数
  like_count: number      // 喜欢数（小心心）
  forward_count: number   // 转发数
  fav_count: number       // 点赞数（大拇指）
  data_version: number    // 数据版本时间
}

export interface VideoMetricsResponse {
  code: number
  count_info: VideoMetrics
  last_buffer: string
  down_continue_flag: number
  cost: number
  remain_money: number
}

// 获取视频号视频互动数据 (点赞、评论、转发、收藏)
export async function getVideoMetrics(objectId: string, objectNonceId = '', lastBuffer = ''): Promise<VideoMetricsResponse> {
  return call('/fbmain/monitor/v3/wxvideo', {
    object_id: objectId,
    object_nonce_id: objectNonceId,
    type: '9',
    last_buffer: lastBuffer,
  })
}

// 获取余额
export async function getBalance(): Promise<number> {
  if (IS_MOCK) return 1000
  const res = await fetch(`${BASE_URL}/fbmain/monitor/v3/get_remain_money`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: process.env.DAJIALA_KEY }),
  })
  const data = await res.json()
  return data.remain_money || 0
}

// 视频号作品列表项
export interface VideoItem {
  media_type: string      // 直播、视频、图片
  object_id: string       // 作品唯一id
  export_id: string       // 加密后的id
  object_nonce_id: string // 临时id
  fav_count: number       // 点赞数（大拇指）
  like_count: number      // 喜欢数（小心心）
  forward_count: number   // 转发数
  comment_count: number   // 评论数
  sticky_time: number | null // 置顶时间
  publish_time: number    // 发布时间
  cover_url: string      // 封面
  thumb_url: string       // 缩略图
  file_size: number       // 视频大小
  video_play_len: number  // 视频长度（秒）
}

// 作品列表响应
export interface VideoListResponse {
  code: number
  object: VideoItem[]
  feeds_count: number     // 总作品数
  original_count: number  // 原创作品数
  last_buffer: string    // 翻页参数
  continue_flag: number   // 1可继续翻页，0不能
  cost: number
  remain_money: number
}

// 获取视频号作品列表 (type=1, 0.2元/次)
export async function getVideoList(v2Name: string, lastBuffer = ''): Promise<VideoListResponse> {
  return call('/fbmain/monitor/v3/wxvideo', {
    v2_name: v2Name,
    type: '1',
    last_buffer: lastBuffer,
  })
}

// 搜索到的视频号信息
export interface SearchedVideoAccount {
  username: string    // v2_name
  nickname: string    // 视频号昵称
  signature: string   // 视频号简介
  ext_info: string    // IP信息
  object_nonce_id: string
}

// 关键词搜索视频号响应 (type=4, 0.5元/次)
export interface SearchVideoAccountsResponse {
  code: number
  v2_info_list: {
    contact: {
      username: string
      nickname: string
      signature: string
      ext_info: string
    }
    video_object_list: {
      id: string
      nickname: string
      username: string
      object_nonce_id: string
    }[]
  }[]
  cost: number
  remain_money: number
}

// 获取指定视频号ID响应 (type=6, 0.2元/次)
export interface GetVideoAccountIdResponse {
  code: number
  v2_info_list: {
    contact: {
      username: string
      nickname: string
      signature: string
      ext_info: string
    }
    video_object_list: {
      id: string
      nickname: string
      username: string
      object_nonce_id: string
    }[]
  }[]
  cost: number
  remain_money: number
}

// 关键词搜索视频号 (type=4, 0.5元/次)
export async function searchVideoAccounts(keyword: string): Promise<SearchVideoAccountsResponse> {
  return call('/fbmain/monitor/v3/wxvideo', {
    type: '4',
    keywords: keyword,
    verifycode: '',
  })
}

// 获取指定视频号ID (type=6, 0.2元/次)
export async function getVideoAccountId(keyword: string): Promise<GetVideoAccountIdResponse> {
  return call('/fbmain/monitor/v3/wxvideo', {
    type: '6',
    keywords: keyword,
  })
}

export { IS_MOCK, sleep }
