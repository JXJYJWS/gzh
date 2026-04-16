// dajiala.com API client with mock mode
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
  if (data.code === 101) throw new Error('Article deleted')
  if (data.code !== 0) throw new Error(data.msg || `API error: ${data.code}`)
  return data
}

function mock(endpoint: string, body: Record<string, unknown>) {
  const now = Date.now()
  const keyword = (body.kw as string) || '关键词'

  switch (endpoint) {
    case '/fbmain/monitor/v3/get_remain_money':
      return { code: 0, remain_money: 1000 }
    case '/fbmain/monitor/v3/post_history':
      const page = (body.page as number) || 1
      return {
        code: 0,
        data: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          url: `https://mp.weixin.qq.com/s/mock_${now}_${i}`,
          post_time: now / 1000 - i * 86400,
          post_time_str: new Date(now - i * 86400000).toLocaleDateString(),
          cover_url: '',
          original: i % 2,
          item_show_type: 0,
          digest: 'Mock digest',
          title: `Mock Article ${page}-${i + 1}: ${['AI', 'Tech', 'Life', 'Work', 'Health'][i]} Trends`,
          msg_status: 2,
          is_deleted: '0',
        })),
        total_page: 5,
        now_page: page,
      }
    case '/fbmain/monitor/v3/kw_search':
      return {
        code: 0,
        data: Array.from({ length: 5 }, (_, i) => ({
          title: `关于"${keyword}"的文章 ${i + 1}`,
          url: `https://mp.weixin.qq.com/s/kw_${now}_${i}`,
          short_link: `https://mp.weixin.qq.cn/s?${now}${i}`,
          content: `这是关于${keyword}的正文内容...`,
          avatar: 'https://mmbiz.qpic.cn/mock.jpg',
          publish_time: now / 1000 - i * 86400,
          publish_time_str: new Date(now - i * 86400000).toLocaleDateString(),
          update_time: now / 1000 - i * 86400,
          update_time_str: new Date(now - i * 86400000).toLocaleDateString(),
          wx_name: `测试公众号${i + 1}`,
          wx_id: `test_wxid_${i}`,
          ghid: `gh_test_${i}`,
          read: Math.floor(Math.random() * 50000) + 1000,
          praise: Math.floor(Math.random() * 500) + 50,
          looking: Math.floor(Math.random() * 200) + 20,
          ip_wording: '北京',
          classify: '科技',
          is_original: i % 2,
          item_show_type: 0,
          has_notifier: 0,
        })),
        total: 5,
        total_page: 1,
        page: 1,
        cut_words: keyword,
        data_number: 5,
      }
    case '/fbmain/monitor/v3/read_zan':
    case '/fbmain/monitor/v3/read_zan_pro':
      return { code: 0, data: { read: Math.floor(Math.random() * 50000) + 1000, zan: Math.floor(Math.random() * 500) + 50, looking: Math.floor(Math.random() * 200) + 20, share_num: Math.floor(Math.random() * 50), collect_num: Math.floor(Math.random() * 30), comment_count: Math.random() > 0.3 ? Math.floor(Math.random() * 20) : -1 }, cost_money: 0.04, remain_money: 999.96 }
    case '/fbmain/monitor/v3/article_html':
      return { code: 0, data: { title: 'Mock Article', html: '<p>Mock content</p>', author: 'Mock Author', nickname: 'Mock Account', post_time: now / 1000 } }
    case '/fbmain/monitor/v3/Keyverifycode':
      const name = (body.name as string) || '公众号'
      return {
        code: 0,
        data: {
          name,
          ghid: `gh_${name.charCodeAt(0)}`,
          wxid: `wxid_${name}`,
          avatar: 'https://mmbiz.qpic.cn/mock.jpg',
          qrcode: 'https://open.weixin.qq.com/qr/code',
          fans: Math.floor(Math.random() * 5000000) + 100000,
          avg_top_read: Math.floor(Math.random() * 100000) + 10000,
          avg_top_zan: Math.floor(Math.random() * 5000) + 500,
          week_articles: Math.floor(Math.random() * 30) + 5,
          latest_publish_time: new Date(now).toLocaleString(),
          jzl_index: Math.floor(Math.random() * 10000) + 1000,
        }
      }
    default:
      return { code: 0 }
  }
}

export async function getBalance(): Promise<number> {
  const res = await call<{ code: number; remain_money: number }>('/fbmain/monitor/v3/get_remain_money', {})
  return res.remain_money
}

export async function getPostHistory(accountName: string, page = 1) {
  return call('/fbmain/monitor/v3/post_history', { name: accountName, page })
}

// 获取基础互动数据 (阅读/点赞/在看) - 0.04元/次
export async function getBasicMetrics(url: string) {
  return call('/fbmain/monitor/v3/read_zan', { url })
}

// 获取完整互动数据 (阅读/点赞/在看/转发/收藏/评论) - 0.06元/次
export async function getMetrics(url: string) {
  return call('/fbmain/monitor/v3/read_zan_pro', { url })
}

export async function batchGetMetrics(items: { id: string; url: string }[]) {
  const results = []
  for (const item of items) {
    try {
      const data = await getMetrics(item.url) // 使用 Pro 版本获取完整数据
      results.push({ id: item.id, success: true, data })
    } catch (e) {
      results.push({ id: item.id, success: false, error: (e as Error).message })
    }
    await sleep(300)
  }
  return results
}

// 导出通用的 API 调用函数
export { call as callApi }

export { IS_MOCK }

// 获取公众号基本信息 (粉丝、头条平均阅读、极致了指数等)
export async function getAccountInfo(accountName: string) {
  return call('/fbmain/monitor/v3/Keyverifycode', { name: accountName, url: '', verifycode: '' })
}
