import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-'
  if (num >= 100001) return '10w+'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toLocaleString()
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}
