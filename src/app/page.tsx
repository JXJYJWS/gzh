'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import {
  getStoredArticles,
  setStoredArticles,
  addStoredArticles,
  updateStoredArticle,
  type Article
} from '@/lib/client-store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CLAUDE_COLORS = ['#D97757', '#E8B4A0', '#6B9B7A', '#7B9DBF', '#C9A86C', '#8B7B6E', '#A8B5A0', '#D4A574']

type SearchMode = 'account' | 'keyword'
type SortBy = 'publishTime' | 'readCount' | 'likeCount' | 'shareCount' | 'collectCount'

export default function HomePage() {
  const [balance, setBalance] = useState<number>(0)
  const [articles, setArticles] = useState<Article[]>([])
  const [searchResults, setSearchResults] = useState<Article[]>([]) // 关键词搜索结果（不存储）
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('publishTime')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [syncLoading, setSyncLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [newAccount, setNewAccount] = useState('')
  const [message, setMessage] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('account')
  const [searchKeyword, setSearchKeyword] = useState('') // 当前搜索的关键词
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotalPage, setSearchTotalPage] = useState(0)
  const [searchTotal, setSearchTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [accountFilter, setAccountFilter] = useState<string>('all') // 公众号筛选
  const [fetchingAllMetrics, setFetchingAllMetrics] = useState(false)
  const [syncTotalPage, setSyncTotalPage] = useState(1)
  const [currentSyncAccount, setCurrentSyncAccount] = useState('')
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountResults, setAccountResults] = useState<Article[]>([]) // 公众号搜索的临时结果

  // 视频号相关状态
  const [videoId, setVideoId] = useState('')
  const [videoMetrics, setVideoMetrics] = useState<{
    comment_count: number
    like_count: number
    forward_count: number
    fav_count: number
    data_version: number
  } | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState('')

  // 视频号作品列表状态
  const [videoListId, setVideoListId] = useState('')
  const [videoList, setVideoList] = useState<any[]>([])
  const [videoListLoading, setVideoListLoading] = useState(false)
  const [videoListError, setVideoListError] = useState('')
  const [videoListMeta, setVideoListMeta] = useState<{
    feeds_count: number
    original_count: number
    last_buffer: string
    continue_flag: number
  } | null>(null)

  // 视频号搜索状态
  const [videoSearchKeyword, setVideoSearchKeyword] = useState('')
  const [videoSearchResults, setVideoSearchResults] = useState<any[]>([])
  const [videoSearchLoading, setVideoSearchLoading] = useState(false)
  const [videoSearchError, setVideoSearchError] = useState('')

  // 时间范围筛选
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // 获取余额
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/balance')
        const data = await res.json()
        setBalance(data.balance)
      } catch {}
    }
    fetchBalance()
  }, [])

  // 从 localStorage 加载数据
  useEffect(() => {
    if (searchMode === 'account') {
      setArticles(getStoredArticles())
    }
  }, [searchMode])

  // 当前显示的文章列表
  const currentArticles = searchMode === 'keyword' ? searchResults : (accountResults.length > 0 ? accountResults : articles)

  // 过滤和排序
  const filteredArticles = useMemo(() => {
    let result = [...currentArticles]

    // 本地搜索（仅对已存储的文章有效）
    if (searchMode === 'account' && search.trim()) {
      const keywords = search.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0)
      result = result.filter(a => {
        const title = a.title.toLowerCase()
        const account = a.accountName.toLowerCase()
        return keywords.every(k => title.includes(k) || account.includes(k))
      })
    }

    // 公众号筛选（关键词搜索模式）
    if (searchMode === 'keyword' && accountFilter !== 'all') {
      result = result.filter(a => a.accountName === accountFilter)
    }

    // 时间范围筛选
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter(a => new Date(a.publishTime) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter(a => new Date(a.publishTime) <= end)
    }

    // 排序
    result.sort((a, b) => {
      let aVal: any, bVal: any
      if (sortBy === 'publishTime') {
        aVal = new Date(a.publishTime).getTime()
        bVal = new Date(b.publishTime).getTime()
      } else if (sortBy === 'readCount') {
        aVal = a.readCount || 0
        bVal = b.readCount || 0
      } else if (sortBy === 'likeCount') {
        aVal = a.likeCount || 0
        bVal = b.likeCount || 0
      } else if (sortBy === 'shareCount') {
        aVal = a.shareCount || 0
        bVal = b.shareCount || 0
      } else if (sortBy === 'collectCount') {
        aVal = a.collectCount || 0
        bVal = b.collectCount || 0
      }
      return order === 'desc' ? bVal - aVal : aVal - bVal
    })

    return result
  }, [currentArticles, search, sortBy, order, searchMode, accountFilter, startDate, endDate])

  // 统计数据（仅基于已存储的文章）
  const stats = useMemo(() => {
    const byAccount = new Map<string, Article[]>()
    for (const a of articles) {
      if (!byAccount.has(a.accountName)) byAccount.set(a.accountName, [])
      byAccount.get(a.accountName)!.push(a)
    }

    return Array.from(byAccount.entries()).map(([name, arts]) => {
      const withMetrics = arts.filter(a => a.readCount != null)
      const avgRead = withMetrics.length > 0
        ? Math.round(withMetrics.reduce((sum, a) => sum + (a.readCount || 0), 0) / withMetrics.length)
        : 0
      return { accountName: name, count: arts.length, avgRead }
    })
  }, [articles])

  const articlesWithMetrics = articles.filter(a => a.readCount != null)
  const avgRead = articlesWithMetrics.length > 0
    ? Math.round(articlesWithMetrics.reduce((sum, a) => sum + (a.readCount || 0), 0) / articlesWithMetrics.length)
    : 0

  // 关键词搜索结果的公众号列表（用于筛选）
  const accountOptions = useMemo(() => {
    const accounts = new Set(searchResults.map(a => a.accountName))
    return Array.from(accounts).sort()
  }, [searchResults])

  // 按公众号同步
  const handleSync = async (loadMore = false) => {
    const account = loadMore ? currentSyncAccount : newAccount
    if (!account?.trim()) return

    const page = loadMore ? (syncTotalPage + 1) : 1

    if (loadMore) setLoadingMore(true)
    else setSyncLoading(true)

    setMessage('')
    try {
      const res = await fetch('/api/dajiala/post-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName: account, page }),
      })
      const result = await res.json()

      if (result.error) {
        setMessage(result.error)
      } else {
        const newArticles: Article[] = result.data
          .filter((item: any) => item.msg_status === 2 && item.is_deleted !== '1')
          .map((item: any) => ({
            id: `art_${Date.now()}_${item.post_time}_${item.position}`,
            accountName: account,
            title: item.title,
            url: item.url,
            publishTime: new Date(item.post_time * 1000).toISOString(),
            readCount: null,
            likeCount: null,
            collectCount: null,
            lookingCount: null,
            shareCount: null,
            commentCount: null,
          }))

        const updated = addStoredArticles(newArticles)
        setArticles(updated)

        if (loadMore) {
          setSyncTotalPage(page)
          setAccountResults(prev => [...prev, ...newArticles])
          setMessage(`又添加 ${newArticles.length} 篇（当前第 ${page} 页）`)
        } else {
          setSyncTotalPage(page)
          setCurrentSyncAccount(account)
          setAccountResults(newArticles)
          setMessage(`成功添加 ${newArticles.length} 篇文章`)
          setNewAccount('')
          // 获取公众号信息
          try {
            const infoRes = await fetch('/api/dajiala/account-info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accountName: account }),
            })
            const infoData = await infoRes.json()
            if (!infoData.error) {
              setAccountInfo(infoData)
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      setMessage((e as Error).message)
    } finally {
      if (loadMore) setLoadingMore(false)
      else setSyncLoading(false)
    }
  }

  // 按关键词搜索文章
  const handleKeywordSearch = async (loadMore = false) => {
    const keyword = loadMore ? searchKeyword : newAccount
    if (!keyword?.trim()) return

    const page = loadMore ? searchPage + 1 : 1

    if (loadMore) setLoadingMore(true)
    else setSearchLoading(true)

    setMessage('')
    try {
      const res = await fetch('/api/dajiala/search-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, page }),
      })
      const data = await res.json()

      if (data.error) {
        setMessage(data.error)
      } else {
        if (loadMore) {
          // 追加结果
          setSearchResults(prev => [...prev, ...(data.articles || [])])
          setSearchPage(page)
          setMessage(`又加载了 ${data.articles?.length || 0} 篇，共 ${data.total || '?'} 篇`)
        } else {
          // 新搜索，重置状态
          setSearchResults(data.articles || [])
          setSearchPage(1)
          setSearchTotalPage(data.totalPage || 0)
          setSearchTotal(data.total || 0)
          setSearchKeyword(keyword)
          setAccountFilter('all')
          setMessage(data.message || `找到 ${data.articles?.length || 0} 篇文章${data.total ? `（共 ${data.total} 篇）` : ''}`)
        }
      }
    } catch (e: unknown) {
      setMessage((e as Error).message)
    } finally {
      if (loadMore) setLoadingMore(false)
      else setSearchLoading(false)
    }
  }

  // 获取视频号互动数据
  const handleGetVideoMetrics = async () => {
    if (!videoId.trim()) return

    setVideoLoading(true)
    setVideoError('')
    setVideoMetrics(null)

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: videoId.trim() }),
      })
      const data = await res.json()

      if (data.error) {
        setVideoError(data.error)
      } else if (data.code === 0) {
        setVideoMetrics(data.count_info)
        setBalance(data.remain_money)
      } else {
        setVideoError(data.msg || `错误码: ${data.code}`)
      }
    } catch (e: unknown) {
      setVideoError((e as Error).message)
    } finally {
      setVideoLoading(false)
    }
  }

  // 获取视频号作品列表
  const handleGetVideoList = async (loadMore = false) => {
    if (!videoListId.trim() && !loadMore) return

    setVideoListLoading(true)
    setVideoListError('')

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'list',
          v2Name: videoListId.trim(),
          lastBuffer: loadMore ? (videoListMeta?.last_buffer || '') : ''
        }),
      })
      const data = await res.json()

      if (data.error) {
        setVideoListError(data.error)
      } else if (data.code === 0) {
        if (loadMore) {
          setVideoList(prev => [...prev, ...(data.object || [])])
        } else {
          setVideoList(data.object || [])
        }
        setVideoListMeta({
          feeds_count: data.feeds_count,
          original_count: data.original_count,
          last_buffer: data.last_buffer,
          continue_flag: data.continue_flag
        })
        setBalance(data.remain_money)
      } else {
        setVideoListError(data.msg || `错误码: ${data.code}`)
      }
    } catch (e: unknown) {
      setVideoListError((e as Error).message)
    } finally {
      setVideoListLoading(false)
    }
  }

  // 搜索视频号
  const handleSearchVideoAccount = async () => {
    const keyword = videoSearchKeyword.trim()
    if (!keyword) return

    setVideoSearchLoading(true)
    setVideoSearchError('')
    setVideoSearchResults([])

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'search',
          keyword: keyword
        }),
      })
      const data = await res.json()

      if (data.error) {
        setVideoSearchError(data.error)
      } else if (data.code === 0) {
        const results = Array.isArray(data.v2_info_list) ? data.v2_info_list : []
        setVideoSearchResults(results)
        if (data.remain_money !== undefined) {
          setBalance(data.remain_money)
        }
      } else {
        setVideoSearchError(data.msg || `错误码: ${data.code}`)
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '请求失败'
      setVideoSearchError(errorMessage)
    } finally {
      setVideoSearchLoading(false)
    }
  }

  // 统一的添加/搜索按钮处理
  const handleAction = () => {
    if (searchMode === 'account') {
      handleSync()
    } else {
      handleKeywordSearch()
    }
  }

  // 保存选中的文章到 localStorage
  const handleSaveSelected = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setSaving(true)
    try {
      const articlesToSave = searchResults.filter(a => ids.includes(a.id))
      const updated = addStoredArticles(articlesToSave)
      setArticles(updated)
      setMessage(`成功保存 ${articlesToSave.length} 篇文章`)
      setSelectedIds(new Set())
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // 导出文章为 CSV
  const handleExportCSV = () => {
    const dataToExport = searchMode === 'keyword' ? searchResults : articles
    if (dataToExport.length === 0) {
      setMessage('没有数据可导出')
      return
    }

    const headers = ['账号', '标题', '发布时间', '阅读量', '点赞数', '在看数', '链接']
    const rows = dataToExport.map(a => [
      a.accountName,
      `"${a.title.replace(/"/g, '""')}"`,
      new Date(a.publishTime).toLocaleDateString(),
      a.readCount ?? '',
      a.likeCount ?? '',
      a.lookingCount ?? '',
      a.url,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `公众号文章_${new Date().toLocaleDateString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(`已导出 ${dataToExport.length} 篇文章`)
  }

  // 导出文章为 JSON
  const handleExportJSON = () => {
    const dataToExport = searchMode === 'keyword' ? searchResults : articles
    if (dataToExport.length === 0) {
      setMessage('没有数据可导出')
      return
    }

    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `公众号文章_${new Date().toLocaleDateString()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(`已导出 ${dataToExport.length} 篇文章`)
  }

  // HTML 转纯文本
  function htmlToText(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    // 移除 script 和 style 标签
    tmp.querySelectorAll('script, style').forEach(el => el.remove())
    // 将段落和换行符转换为换行
    tmp.querySelectorAll('p, br, div').forEach(el => {
      el.after('\n')
    })
    let text = tmp.textContent || tmp.innerText || ''
    // 清理多余的空白行
    return text.replace(/\n{3,}/g, '\n\n').trim()
  }

  // 导出为 TXT（含全文）- 每篇文章单独一个文件
  const handleExportTXT = async () => {
    const dataToExport = searchMode === 'keyword' ? searchResults : articles
    if (dataToExport.length === 0) {
      setMessage('没有数据可导出')
      return
    }

    setExporting(true)
    setMessage('正在获取文章内容...')

    try {
      for (let i = 0; i < dataToExport.length; i++) {
        const article = dataToExport[i]
        setMessage(`获取第 ${i + 1}/${dataToExport.length} 篇...`)

        let fullText = `${article.title}\n`
        fullText += `公众号：${article.accountName}\n`
        fullText += `发布时间：${new Date(article.publishTime).toLocaleString()}\n`
        fullText += `阅读：${article.readCount ?? '?'}  点赞：${article.likeCount ?? '?'}\n`
        fullText += `链接：${article.url}\n`
        fullText += `${'='.repeat(50)}\n\n`

        try {
          const res = await fetch('/api/dajiala/article-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: article.url }),
          })
          const data = await res.json()
          if (data.html) {
            fullText += htmlToText(data.html)
          } else {
            fullText += `[无法获取正文内容]`
          }
        } catch {
          fullText += `[获取正文失败]`
        }

        // 生成安全的文件名
        const safeTitle = article.title.replace(/[\/\\:*?"<>|]/g, '').slice(0, 30)
        const dateStr = new Date(article.publishTime).toISOString().slice(0, 10)

        // 下载文件
        const blob = new Blob(['\ufeff' + fullText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dateStr}_${safeTitle}.txt`
        a.click()
        URL.revokeObjectURL(url)

        await new Promise(resolve => setTimeout(resolve, 300))
      }

      setMessage(`已导出 ${dataToExport.length} 篇文章`)
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  // 批量更新数据
  const handleUpdateMetrics = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setMetricsLoading(true)
    try {
      const targetArticles = currentArticles.filter(a => ids.includes(a.id))
      const res = await fetch('/api/dajiala/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: targetArticles.map(a => ({ id: a.id, url: a.url })) }),
      })
      const data = await res.json()

      const updateArticle = (article: any) => {
        const result = data.results.find((r: any) => r.id === article.id)
        if (result && result.success && result.data) {
          return {
            ...article,
            readCount: result.data.read,
            likeCount: result.data.zan,
            lookingCount: result.data.looking,
            shareCount: result.data.share_num,
            collectCount: result.data.collect_num,
            commentCount: result.data.comment_count,
          }
        }
        return article
      }

      if (searchMode === 'account' && accountResults.length > 0) {
        // 公众号搜索模式 - 更新临时结果
        setAccountResults(prev => prev.map(updateArticle))
      } else if (searchMode === 'account') {
        // 已存储的文章
        for (const result of data.results) {
          if (result.success && result.data) {
            updateStoredArticle(result.id, {
              readCount: result.data.read,
              likeCount: result.data.zan,
              lookingCount: result.data.looking,
              shareCount: result.data.share_num,
              collectCount: result.data.collect_num,
              commentCount: result.data.comment_count,
            })
          }
        }
        setArticles(getStoredArticles())
      } else {
        // 关键词搜索模式
        setSearchResults(prev => prev.map(updateArticle))
      }

      setSelectedIds(new Set())
      setMessage(`已更新 ${data.results.filter(r => r.success).length} 篇文章的数据`)
    } finally {
      setMetricsLoading(false)
    }
  }

  // 一键获取所有阅读量
  const handleFetchAllMetrics = async () => {
    if (currentArticles.length === 0) return

    setFetchingAllMetrics(true)
    setMessage('正在获取阅读量...')
    try {
      const res = await fetch('/api/dajiala/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: currentArticles.map(a => ({ id: a.id, url: a.url })) }),
      })
      const data = await res.json()
      const updatedCount = data.results.filter((r: any) => r.success).length

      // 统一更新函数
      const updateArticle = (article: any) => {
        const result = data.results.find((r: any) => r.id === article.id)
        if (result && result.success) {
          return {
            ...article,
            readCount: result.data.read,
            likeCount: result.data.zan,
            lookingCount: result.data.looking,
            shareCount: result.data.share_num,
            collectCount: result.data.collect_num,
            commentCount: result.data.comment_count,
          }
        }
        return article
      }

      if (searchMode === 'account' && accountResults.length > 0) {
        // 公众号搜索模式 - 更新临时结果
        setAccountResults(prev => prev.map(updateArticle))
      } else if (searchMode === 'account') {
        // 已存储的文章模式 - 同时更新 localStorage 和 state
        for (const result of data.results) {
          if (result.success) {
            updateStoredArticle(result.id, {
              readCount: result.data.read,
              likeCount: result.data.zan,
              lookingCount: result.data.looking,
              shareCount: result.data.share_num,
              collectCount: result.data.collect_num,
              commentCount: result.data.comment_count,
            })
          }
        }
        setArticles(getStoredArticles())
      } else {
        // 关键词搜索模式 - 更新搜索结果
        setSearchResults(prev => prev.map(updateArticle))
      }

      setMessage(`已获取 ${updatedCount}/${currentArticles.length} 篇文章的阅读量`)
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setFetchingAllMetrics(false)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredArticles.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredArticles.map(a => a.id)))
  }

  const handleSort = (col: SortBy) => {
    if (sortBy === col) setOrder(order === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setOrder('desc' as const) }
  }

  // 输入框提示文字
  const getPlaceholder = () => {
    return searchMode === 'account'
      ? '输入公众号名称或微信号...'
      : '输入关键词搜索文章...'
  }

  // 按钮文字
  const getButtonText = () => {
    if (searchMode === 'account') {
      return syncLoading ? '添加中...' : '添加公众号'
    }
    return searchLoading ? '搜索中...' : '搜索文章'
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DA] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-[#2D2A26]">微信公众号分析</h1>
              <p className="text-sm text-[#6B6560]">追踪文章数据，发现优质内容</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#6B6560]">API 余额</div>
                <div className="text-lg font-semibold text-[#D97757]">¥{balance.toFixed(2)}</div>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  const res = await fetch('/api/balance')
                  const data = await res.json()
                  setBalance(data.balance)
                } catch {}
              }}>刷新</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-[#D97757]">{stats.length}</div>
              <div className="text-xs text-[#6B6560]">已添加账号</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-[#D97757]">{articles.length}</div>
              <div className="text-xs text-[#6B6560]">收藏文章</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-[#D97757]">{formatNumber(avgRead)}</div>
              <div className="text-xs text-[#6B6560]">平均阅读</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-[#D97757]">{filteredArticles.length}</div>
              <div className="text-xs text-[#6B6560]">当前显示</div>
            </CardContent>
          </Card>
        </div>

        {/* 公众号信息卡片 */}
        {searchMode === 'account' && accountInfo && (
          <Card className="mb-6 bg-gradient-to-r from-[#FFF8F0] to-white border-[#D97757]/20">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  {accountInfo.avatar && (
                    <img src={accountInfo.avatar} alt={accountInfo.name} className="w-12 h-12 rounded-full" />
                  )}
                  <div>
                    <div className="font-semibold text-[#2D2A26]">{accountInfo.name}</div>
                    <div className="text-xs text-[#6B6560]">{accountInfo.wxid}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-[#D97757]">{formatNumber(accountInfo.fans)}</div>
                    <div className="text-xs text-[#6B6560]">预估粉丝</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#D97757]">{formatNumber(accountInfo.avgTopRead)}</div>
                    <div className="text-xs text-[#6B6560]">头条平均阅读</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#D97757]">{formatNumber(accountInfo.avgTopZan)}</div>
                    <div className="text-xs text-[#6B6560]">头条平均点赞</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#D97757]">{accountInfo.weekArticles}</div>
                    <div className="text-xs text-[#6B6560]">周发文量</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#D97757]">{accountInfo.jzlIndex?.toFixed(2)}</div>
                    <div className="text-xs text-[#6B6560]">极致了指数</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 视频号专区 */}
        <Card className="mb-6 bg-gradient-to-r from-[#FFF8F0] to-white border-[#6B9B7A]/20">
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* 搜索视频号 */}
              <div className="bg-white rounded-lg p-4 border border-[#E8E4DA]">
                <div className="flex items-center gap-2 mb-3">
                  <span>🔍</span>
                  <span className="font-semibold text-[#2D2A26]">搜索视频号</span>
                  <span className="text-xs text-[#6B6560]">输入名字查找</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="输入视频号名字 (如: 人民日报)"
                    value={videoSearchKeyword}
                    onChange={e => setVideoSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchVideoAccount()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchVideoAccount} disabled={videoSearchLoading} variant="outline">
                    {videoSearchLoading ? '搜索中...' : '搜索'}
                  </Button>
                </div>
                {videoSearchError && (
                  <div className="text-sm text-red-500 mt-2">{videoSearchError}</div>
                )}
                {videoSearchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {videoSearchResults.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FFF8F0] transition-colors cursor-pointer" onClick={() => { setVideoListId(item.contact?.username || ''); setVideoSearchResults([]) }}>
                        <div>
                          <div className="font-medium text-[#2D2A26]">{item.contact?.nickname || '未知'}</div>
                          <div className="text-xs text-[#6B6560]">{item.contact?.signature || '无简介'}</div>
                          {item.contact?.ext_info && (
                            <div className="text-xs text-[#D97757]">IP属地: {item.contact.ext_info}</div>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setVideoListId(item.contact?.username || ''); handleGetVideoList() }}>
                          查看作品
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-[#6B6560] mt-2">💡 每次搜索消耗 ¥0.5</div>
              </div>

              {/* 单个视频数据查询 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span>🎬</span>
                  <span className="font-semibold text-[#2D2A26]">单个视频数据</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="输入视频 object_id (如: 14462543356698040491)"
                    value={videoId}
                    onChange={e => setVideoId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGetVideoMetrics()}
                    className="flex-1"
                  />
                  <Button onClick={handleGetVideoMetrics} disabled={videoLoading} variant="outline">
                    {videoLoading ? '查询中...' : '查询'}
                  </Button>
                </div>
                {videoMetrics && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-[#E8E4DA]">
                      <div className="text-xl font-semibold text-[#D97757]">{formatNumber(videoMetrics.like_count)}</div>
                      <div className="text-xs text-[#6B6560]">❤️ 喜欢</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-[#E8E4DA]">
                      <div className="text-xl font-semibold text-[#6B9B7A]">{formatNumber(videoMetrics.fav_count)}</div>
                      <div className="text-xs text-[#6B6560]">👍 点赞</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-[#E8E4DA]">
                      <div className="text-xl font-semibold text-[#7B9DBF]">{formatNumber(videoMetrics.forward_count)}</div>
                      <div className="text-xs text-[#6B6560]">↗️ 转发</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-[#E8E4DA]">
                      <div className="text-xl font-semibold text-[#C9A86C]">{formatNumber(videoMetrics.comment_count)}</div>
                      <div className="text-xs text-[#6B6560]">💬 评论</div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-[#6B6560] mt-2">💡 每次查询消耗 ¥0.04</div>
              </div>

              <div className="border-t border-[#E8E4DA] pt-4">
                {/* 作品列表查询 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span>📋</span>
                    <span className="font-semibold text-[#2D2A26]">视频号作品列表</span>
                    {videoListMeta && (
                      <span className="text-xs text-[#6B6560]">共 {videoListMeta.feeds_count} 个作品 · {videoListMeta.original_count} 个原创</span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="输入视频号 v2_name (如: v2_060000231003b20...)"
                      value={videoListId}
                      onChange={e => setVideoListId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGetVideoList()}
                      className="flex-1"
                    />
                    <Button onClick={() => handleGetVideoList()} disabled={videoListLoading} variant="outline">
                      {videoListLoading ? '加载中...' : '获取列表'}
                    </Button>
                  </div>

                  {/* 作品列表展示 */}
                  {videoList.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {videoList.map((video, index) => (
                        <div key={video.object_id || index} className="bg-white rounded-lg p-3 border border-[#E8E4DA]">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  video.media_type === '直播' ? 'bg-red-100 text-red-600' :
                                  video.media_type === '视频' ? 'bg-blue-100 text-blue-600' :
                                  'bg-green-100 text-green-600'
                                )}>
                                  {video.media_type}
                                </span>
                                {video.sticky_time && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">置顶</span>
                                )}
                                <span className="text-xs text-[#6B6560]">
                                  {video.publish_time ? formatDate(new Date(video.publish_time * 1000).toISOString()) : '-'}
                                </span>
                              </div>
                              <div className="text-xs text-[#6B6560] font-mono cursor-pointer hover:text-[#D97757]" onClick={() => { setVideoId(video.object_id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="点击复制并查询">ID: {video.object_id}</div>
                            </div>
                            <div className="flex gap-3 text-sm">
                              <span className="text-[#D97757]" title="喜欢数">❤️ {formatNumber(video.like_count)}</span>
                              <span className="text-[#6B9B7A]" title="点赞数">👍 {formatNumber(video.fav_count)}</span>
                              <span className="text-[#7B9DBF]" title="转发数">↗️ {formatNumber(video.forward_count)}</span>
                              <span className="text-[#C9A86C]" title="评论数">💬 {formatNumber(video.comment_count)}</span>
                            </div>
                          </div>
                          {video.video_play_len && (
                            <div className="text-xs text-[#6B6560] mt-1">
                              视频长度: {Math.floor(video.video_play_len / 60)}:{String(video.video_play_len % 60).padStart(2, '0')}
                              {video.file_size && ` · ${(video.file_size / 1024 / 1024).toFixed(1)}MB`}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* 加载更多 */}
                      {videoListMeta?.continue_flag === 1 && (
                        <Button onClick={() => handleGetVideoList(true)} disabled={videoListLoading} variant="outline" className="w-full">
                          {videoListLoading ? '加载中...' : '加载更多'}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-[#6B6560] mt-2">💡 每次查询消耗 ¥0.2</div>
                </div>
              </div>

              {(videoError || videoListError) && (
                <div className="text-sm text-red-500">{videoError || videoListError}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search/Add Section */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 模式切换 */}
              <select
                value={searchMode}
                onChange={e => setSearchMode(e.target.value as SearchMode)}
                className="h-10 px-4 rounded-lg border border-[#E8E4DA] bg-white text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
              >
                <option value="account">按公众号</option>
                <option value="keyword">按关键词搜索</option>
              </select>

              <Input
                placeholder={getPlaceholder()}
                value={newAccount}
                onChange={e => setNewAccount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAction()}
                className="flex-1"
              />

              <Button onClick={handleAction} disabled={syncLoading || searchLoading}>
                {getButtonText()}
              </Button>

              {/* 加载更多按钮 */}
              {searchMode === 'keyword' && searchKeyword && searchPage < searchTotalPage && (
                <Button onClick={() => handleKeywordSearch(true)} disabled={loadingMore} variant="outline">
                  {loadingMore ? '加载中...' : `加载更多 (第${searchPage + 1}/${searchTotalPage}页)`}
                </Button>
              )}
              {searchMode === 'account' && currentSyncAccount && (
                <Button onClick={() => handleSync(true)} disabled={loadingMore} variant="outline">
                  {loadingMore ? '加载中...' : '加载更多'}
                </Button>
              )}

              {message && (
                <span className={cn(
                  'text-sm self-center px-3 py-1 rounded-full',
                  message.includes('成功') || message.includes('找到') || message.includes('加载')
                    ? 'bg-[#6B9B7A]/20 text-[#4A7B5A]'
                    : 'bg-red-100 text-red-600'
                )}>{message}</span>
              )}
            </div>

            {/* 关键词搜索提示 */}
            {searchMode === 'keyword' && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-[#6B6560]">
                  💡 每页20条，支持多页翻阅 · 搜索结果直接包含阅读量和点赞数据
                </p>
                {searchTotal > 0 && (
                  <span className="text-xs text-[#D97757]">共 {searchTotal} 篇</span>
                )}
              </div>
            )}

            {/* 时间范围筛选 */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E8E4DA]">
              <span className="text-xs text-[#6B6560]">时间范围：</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E8E4DA] bg-white text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
              />
              <span className="text-xs text-[#6B6560]">至</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E8E4DA] bg-white text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
              />
              {(startDate || endDate) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setStartDate(''); setEndDate('') }}
                  className="text-xs h-9 px-2 text-[#6B6560]"
                >
                  清除筛选
                </Button>
              )}

              {/* 快速日期选择 */}
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant={startDate === '' && endDate === '' ? 'outline' : 'ghost'}
                  onClick={() => { setStartDate(''); setEndDate('') }}
                  className="h-8 text-xs px-2"
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setStartDate(weekAgo.toISOString().slice(0, 10))
                    setEndDate(now.toISOString().slice(0, 10))
                  }}
                  className="h-8 text-xs px-2"
                >
                  近7天
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const now = new Date()
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setStartDate(monthAgo.toISOString().slice(0, 10))
                    setEndDate(now.toISOString().slice(0, 10))
                  }}
                  className="h-8 text-xs px-2"
                >
                  近30天
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const now = new Date()
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                    setStartDate(yearAgo.toISOString().slice(0, 10))
                    setEndDate(now.toISOString().slice(0, 10))
                  }}
                  className="h-8 text-xs px-2"
                >
                  近1年
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle>
                    {searchMode === 'keyword' ? '搜索结果' : '文章列表'}
                    {searchMode === 'keyword' && filteredArticles.length > 0 && (
                      <span className="text-sm font-normal text-[#6B6560] ml-2">({filteredArticles.length} 篇)</span>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {searchMode === 'account' && (
                      <Input
                        placeholder="筛选已保存文章..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-36 h-9"
                      />
                    )}
                    {selectedIds.size > 0 && (
                      <>
                        <Button size="sm" onClick={handleUpdateMetrics} disabled={metricsLoading}>
                          {metricsLoading ? '更新中...' : `获取数据 (${selectedIds.size})`}
                        </Button>
                        {searchMode === 'keyword' && (
                          <Button size="sm" onClick={handleSaveSelected} disabled={saving} variant="outline">
                            {saving ? '保存中...' : `保存选中 (${selectedIds.size})`}
                          </Button>
                        )}
                      </>
                    )}
                    <Button size="sm" onClick={handleExportCSV} variant="outline">
                      导出 CSV
                    </Button>
                    <Button size="sm" onClick={handleExportJSON} variant="outline">
                      导出 JSON
                    </Button>
                    <Button size="sm" onClick={handleExportTXT} disabled={exporting} variant="outline">
                      {exporting ? '获取中...' : '导出 TXT(全文)'}
                    </Button>
                    {currentArticles.length > 0 && (
                      <Button size="sm" onClick={handleFetchAllMetrics} disabled={fetchingAllMetrics} variant="outline">
                        {fetchingAllMetrics ? '获取中...' : '一键获取阅读量'}
                      </Button>
                    )}
                    {searchMode === 'keyword' && accountOptions.length > 1 && (
                      <select
                        value={accountFilter}
                        onChange={e => setAccountFilter(e.target.value)}
                        className="h-8 px-3 rounded-lg border border-[#E8E4DA] bg-white text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
                      >
                        <option value="all">全部公众号 ({searchResults.length})</option>
                        {accountOptions.map(acc => (
                          <option key={acc} value={acc}>
                            {acc} ({searchResults.filter(a => a.accountName === acc).length})
                          </option>
                        ))}
                      </select>
                    )}
                    {/* 排序选择 */}
                    <select
                      value={`${sortBy}-${order}`}
                      onChange={e => {
                        const [field, dir] = e.target.value.split('-')
                        setSortBy(field as SortBy)
                        setOrder(dir as 'asc' | 'desc')
                      }}
                      className="h-8 px-3 rounded-lg border border-[#E8E4DA] bg-white text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
                    >
                      <option value="publishTime-desc">时间 ↓</option>
                      <option value="publishTime-asc">时间 ↑</option>
                      <option value="readCount-desc">阅读 ↓</option>
                      <option value="readCount-asc">阅读 ↑</option>
                      <option value="likeCount-desc">点赞 ↓</option>
                      <option value="likeCount-asc">点赞 ↑</option>
                      <option value="shareCount-desc">转发 ↓</option>
                      <option value="shareCount-asc">转发 ↑</option>
                      <option value="collectCount-desc">收藏 ↓</option>
                      <option value="collectCount-asc">收藏 ↑</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredArticles.length && filteredArticles.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>账号</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>阅读</TableHead>
                      <TableHead>点赞</TableHead>
                      <TableHead>在看</TableHead>
                      <TableHead className="text-xs">转发/收藏/评</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-[#6B6560] py-8">
                        {searchMode === 'keyword'
                          ? '输入关键词搜索文章'
                          : (search ? '没有找到匹配的文章' : '添加公众号开始同步文章')
                        }
                      </TableCell></TableRow>
                    ) : filteredArticles.map(article => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(article.id)}
                            onChange={() => toggleSelect(article.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="text-[#6B6560] whitespace-nowrap text-xs">
                          {formatDate(article.publishTime)}
                        </TableCell>
                        <TableCell className="font-medium text-[#2D2A26] text-xs">{article.accountName}</TableCell>
                        <TableCell>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener"
                            className="text-[#D97757] hover:underline line-clamp-1 max-w-[150px] sm:max-w-xs block text-sm"
                          >
                            {article.title}
                          </a>
                        </TableCell>
                        <TableCell className={cn(
                          'font-medium text-sm',
                          article.readCount && article.readCount > 10000 ? 'text-[#D97757]' : '',
                          article.readCount === null ? 'text-[#6B6560]' : ''
                        )}>
                          {formatNumber(article.readCount)}
                        </TableCell>
                        <TableCell className={cn(
                          'text-sm',
                          article.likeCount === null ? 'text-[#6B6560]' : 'text-[#2D2A26]'
                        )}>
                          {formatNumber(article.likeCount)}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B6560]">
                          {article.lookingCount != null ? formatNumber(article.lookingCount) : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-[#6B6560]">
                          {article.shareCount != null || article.collectCount != null || article.commentCount != null
                            ? `${formatNumber(article.shareCount)}/${formatNumber(article.collectCount)}/${article.commentCount === -1 ? '-' : formatNumber(article.commentCount)}`
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chart */}
            <Card>
              <CardHeader><CardTitle>平均阅读量</CardTitle></CardHeader>
              <CardContent>
                {stats.length === 0 ? (
                  <p className="text-[#6B6560] text-sm py-4 text-center">暂无数据</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats} layout="horizontal" margin={{ top: 5, right: 20, bottom: 5, left: 70 }}>
                      <XAxis type="number" stroke="#6B6560" />
                      <YAxis dataKey="accountName" type="category" width={70} tick={{ fontSize: 11, fill: '#6B6560' }} stroke="#6B6560" />
                      <Tooltip
                        formatter={(val) => [val.toLocaleString(), '平均阅读']}
                        contentStyle={{ backgroundColor: '#FFF8F0', border: '1px solid #E8E4DA', borderRadius: '8px' }}
                      />
                      <Bar dataKey="avgRead" radius={[0, 4, 4, 0]}>
                        {stats.map((_, i) => <Cell key={i} fill={CLAUDE_COLORS[i % CLAUDE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Account List */}
            <Card>
              <CardHeader><CardTitle>账号统计</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {stats.length === 0 ? (
                    <p className="text-[#6B6560] text-sm py-4 text-center">暂无数据</p>
                  ) : (
                    stats.map(s => (
                      <div key={s.accountName} className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#FFF8F0] transition-colors">
                        <span className="text-sm font-medium text-[#2D2A26]">{s.accountName}</span>
                        <span className="text-sm text-[#6B6560]">{s.count} 篇</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hot Articles */}
            {articlesWithMetrics.length > 0 && (
              <Card>
                <CardHeader><CardTitle>热门文章</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {articlesWithMetrics
                      .sort((a, b) => (b.readCount || 0) - (a.readCount || 0))
                      .slice(0, 5)
                      .map(article => (
                        <a
                          key={article.id}
                          href={article.url}
                          target="_blank"
                          rel="noopener"
                          className="block py-2 px-2 rounded-lg hover:bg-[#FFF8F0] transition-colors"
                        >
                          <div className="text-sm font-medium text-[#2D2A26] line-clamp-2">{article.title}</div>
                          <div className="text-xs text-[#6B6560] mt-1">
                            {article.accountName} · {formatNumber(article.readCount)} 阅读
                          </div>
                        </a>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
