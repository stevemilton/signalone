'use client'

import { formatTime } from '@/lib/utils/format'

export interface TimelineStep {
  label: string
  icon: string
  completedAt: number | null
  isActive: boolean
}

interface TimelineProps {
  steps: TimelineStep[]
  alertType?: 'blue' | 'red'
}

export function Timeline({ steps, alertType = 'blue' }: TimelineProps) {
  const accentColor = alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'
  const accentBorder = alertType === 'red' ? 'border-red-400' : 'border-blue-400'

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isComplete = step.completedAt !== null
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex gap-3">
            {/* Icon column with connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0
                  ${isComplete
                    ? 'bg-green-500 text-white'
                    : step.isActive
                      ? `${accentColor} text-white animate-pulse-opacity`
                      : 'bg-slate-200 text-slate-400'
                  }
                `}
              >
                {isComplete ? '✓' : step.icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-8 ${isComplete ? 'bg-green-300' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* Label and timestamp */}
            <div className="pt-1.5 pb-4">
              <p className={`text-sm font-medium ${isComplete || step.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </p>
              {isComplete && step.completedAt && (
                <p className="text-xs text-green-600 mt-0.5">{formatTime(step.completedAt)}</p>
              )}
              {step.isActive && !isComplete && (
                <p className="text-xs text-slate-400 mt-0.5">In progress...</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
