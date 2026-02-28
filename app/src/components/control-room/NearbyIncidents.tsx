'use client'

import type { NearbyIncident } from '@/types/risk'

interface NearbyIncidentsProps {
  incidents: NearbyIncident[]
}

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  const diffMins = Math.floor(diffMs / (1000 * 60))
  return `${diffMins}m ago`
}

const CLASSIFICATION_BADGES: Record<string, { label: string; className: string }> = {
  genuine: { label: 'Genuine', className: 'text-green-400 border-green-500/30 bg-green-500/10' },
  false_alert: { label: 'False', className: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  malicious: { label: 'Malicious', className: 'text-red-400 border-red-500/30 bg-red-500/10' },
  unclear: { label: 'Unclear', className: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
}

export default function NearbyIncidents({ incidents }: NearbyIncidentsProps) {
  if (incidents.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
          Nearby Incidents
        </h2>
        <p className="text-[12px] text-slate-500">No recent incidents in this area</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
    >
      <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
        Nearby Incidents ({incidents.length})
      </h2>

      <div className="space-y-2.5">
        {incidents.map((incident) => (
          <div key={incident.alertId} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  incident.alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-slate-300 truncate">
                  {incident.locationName || 'Unknown location'}
                </span>
                {incident.classification && CLASSIFICATION_BADGES[incident.classification] && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${CLASSIFICATION_BADGES[incident.classification].className}`}
                  >
                    {CLASSIFICATION_BADGES[incident.classification].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500">
                  {incident.distanceMetres}m away
                </span>
                <span className="text-[10px] text-slate-600">|</span>
                <span className="text-[10px] text-slate-500">
                  {formatTimeAgo(incident.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
