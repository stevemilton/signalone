'use client'

type DotStatus = 'online' | 'idle' | 'offline' | 'active'

interface StatusDotProps {
  status: DotStatus
  label?: string
  size?: 'sm' | 'md'
}

const dotClasses: Record<DotStatus, string> = {
  online: 'bg-green-500',
  idle: 'bg-amber-400 animate-blink',
  offline: 'bg-red-500',
  active: 'bg-green-500 animate-pulse',
}

const labelText: Record<DotStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  offline: 'Offline',
  active: 'Active',
}

export function StatusDot({ status, label, size = 'sm' }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${sizeClass} rounded-full ${dotClasses[status]}`} />
      {label !== undefined ? (
        <span className="text-xs text-slate-500">{label}</span>
      ) : (
        <span className="text-xs text-slate-500">{labelText[status]}</span>
      )}
    </span>
  )
}
