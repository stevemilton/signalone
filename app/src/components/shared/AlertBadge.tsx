'use client'

import type { AlertType } from '@/types'

interface AlertBadgeProps {
  type: AlertType
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export function AlertBadge({ type, size = 'md', pulse = false }: AlertBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  const colorClasses = type === 'red'
    ? 'bg-red-100 text-red-700 border border-red-300'
    : 'bg-blue-100 text-blue-700 border border-blue-300'

  return (
    <span
      className={`
        inline-flex items-center font-bold uppercase rounded-full
        ${sizeClasses[size]} ${colorClasses}
        ${pulse ? 'animate-pulse-opacity' : ''}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${type === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
      {type === 'red' ? 'RED' : 'BLUE'}
    </span>
  )
}
