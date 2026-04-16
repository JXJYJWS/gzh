import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-[#E8E4DA] bg-white px-4 py-2 text-sm text-[#2D2A26] placeholder:text-[#6B6560] focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 focus:border-[#D97757] transition-all',
        className
      )}
      {...props}
    />
  )
}
