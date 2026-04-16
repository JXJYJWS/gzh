// 简单的内存存储（本地开发用）
// Vercel 上使用 Vercel KV 或 Postgres

let memoryStore: {
  articles: any[]
  lastUpdate: number
} = {
  articles: [],
  lastUpdate: Date.now()
}

export async function getArticles(): Promise<any[]> {
  return memoryStore.articles
}

export async function addArticles(newArticles: any[]): Promise<any[]> {
  for (const art of newArticles) {
    const exists = memoryStore.articles.find(a => a.url === art.url)
    if (!exists) {
      memoryStore.articles.push(art)
    }
  }
  return memoryStore.articles
}

export async function updateArticle(id: string, data: any): Promise<void> {
  const idx = memoryStore.articles.findIndex(a => a.id === id)
  if (idx >= 0) {
    memoryStore.articles[idx] = { ...memoryStore.articles[idx], ...data }
  }
}

export async function getArticleById(id: string): Promise<any | null> {
  return memoryStore.articles.find(a => a.id === id) || null
}
