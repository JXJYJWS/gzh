// 客户端存储工具（用于浏览器 localStorage）

const STORAGE_KEY = 'wechat_articles'

export interface Article {
  id: string
  accountName: string
  title: string
  url: string
  publishTime: string
  readCount: number | null
  likeCount: number | null
  collectCount: number | null
  lookingCount: number | null
  shareCount: number | null
  commentCount: number | null
}

export function getStoredArticles(): Article[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function setStoredArticles(articles: Article[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  } catch (e) {
    console.error('Failed to save articles:', e)
  }
}

export function addStoredArticles(newArticles: Article[]): Article[] {
  const existing = getStoredArticles()
  const existingUrls = new Set(existing.map(a => a.url))
  const filtered = newArticles.filter(a => !existingUrls.has(a.url))
  const updated = [...existing, ...filtered]
  setStoredArticles(updated)
  return updated
}

export function updateStoredArticle(id: string, data: Partial<Article>): void {
  const articles = getStoredArticles()
  const idx = articles.findIndex(a => a.id === id)
  if (idx >= 0) {
    articles[idx] = { ...articles[idx], ...data }
    setStoredArticles(articles)
  }
}

export function clearStoredArticles(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
