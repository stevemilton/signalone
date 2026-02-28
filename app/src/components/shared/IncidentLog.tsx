'use client'

import { formatTime } from '@/lib/utils/format'
import type { IncidentLogEntry } from '@/types'

interface IncidentLogProps {
  entries: IncidentLogEntry[]
  dark?: boolean
}

export function IncidentLog({ entries, dark = false }: IncidentLogProps) {
  const bgClass = dark ? 'bg-slate-900/50' : 'bg-slate-50'
  const textClass = dark ? 'text-slate-300' : 'text-slate-600'
  const timeClass = dark ? 'text-slate-500' : 'text-slate-400'
  const labelClass = dark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`${bgClass} rounded-xl p-4`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${labelClass} mb-3`}>
        Incident Log
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {entries.length === 0 ? (
          <p className={`text-xs ${timeClass}`}>No entries yet</p>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`${timeClass} font-mono shrink-0`}>
                {formatTime(entry.timestamp)}
              </span>
              <span className={textClass}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
