'use client'

import type { ReactNode } from 'react'

type CardVariant = 'default' | 'blue' | 'red' | 'warning' | 'success' | 'danger' | 'dark'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border-2 border-slate-200',
  blue: 'bg-blue-50 border-2 border-blue-400',
  red: 'bg-red-50 border-2 border-red-400',
  warning: 'bg-amber-50 border-2 border-amber-400',
  success: 'bg-green-50 border-2 border-green-400',
  danger: 'bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400',
  dark: 'bg-slate-800 border border-slate-700 text-slate-200',
}

export function Card({ children, variant = 'default', className = '', onClick, hoverable }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl p-5
        ${variantClasses[variant]}
        ${hoverable ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
