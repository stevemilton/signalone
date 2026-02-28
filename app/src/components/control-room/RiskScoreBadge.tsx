'use client'

import type { RiskLevel } from '@/types/risk'

interface RiskScoreBadgeProps {
  score: number
  level: RiskLevel
  size?: 'sm' | 'md' | 'lg'
}

const LEVEL_COLORS: Record<RiskLevel, { ring: string; text: string; bg: string; label: string }> = {
  low: { ring: '#22c55e', text: 'text-green-400', bg: 'bg-green-500/10', label: 'LOW' },
  moderate: { ring: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', label: 'MODERATE' },
  elevated: { ring: '#f97316', text: 'text-orange-400', bg: 'bg-orange-500/10', label: 'ELEVATED' },
  high: { ring: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/10', label: 'HIGH' },
}

const SIZES = {
  sm: { outer: 48, stroke: 3, fontSize: 14, labelSize: 8, showLabel: false },
  md: { outer: 72, stroke: 4, fontSize: 22, labelSize: 10, showLabel: true },
  lg: { outer: 96, stroke: 5, fontSize: 28, labelSize: 11, showLabel: true },
}

export default function RiskScoreBadge({ score, level, size = 'md' }: RiskScoreBadgeProps) {
  const colors = LEVEL_COLORS[level]
  const s = SIZES[size]
  const radius = (s.outer - s.stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        <svg width={s.outer} height={s.outer} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={s.stroke}
          />
          {/* Score ring */}
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={s.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-extrabold ${colors.text}`}
            style={{ fontSize: s.fontSize }}
          >
            {score}
          </span>
        </div>
      </div>
      {s.showLabel && (
        <span
          className={`font-semibold uppercase tracking-wider ${colors.text}`}
          style={{ fontSize: s.labelSize }}
        >
          {colors.label}
        </span>
      )}
    </div>
  )
}
