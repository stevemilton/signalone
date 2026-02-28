'use client'

import type { Hotspot } from '@/types/risk'

interface HotspotTableProps {
  hotspots: Hotspot[]
}

function getRiskBadge(score: number): { label: string; className: string } {
  if (score >= 75) return { label: 'HIGH', className: 'text-red-600 bg-red-50 border-red-200' }
  if (score >= 50) return { label: 'ELEVATED', className: 'text-orange-600 bg-orange-50 border-orange-200' }
  if (score >= 25) return { label: 'MODERATE', className: 'text-amber-600 bg-amber-50 border-amber-200' }
  return { label: 'LOW', className: 'text-green-600 bg-green-50 border-green-200' }
}

export default function HotspotTable({ hotspots }: HotspotTableProps) {
  const top10 = hotspots.slice(0, 10)

  if (top10.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotspot Locations</h2>
        <div className="py-8 text-center text-gray-400 text-sm">
          No hotspot data available. Run a risk recomputation to populate.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Hotspot Locations</h2>
      <p className="text-xs text-gray-400 mb-4">Top {top10.length} areas ranked by risk score</p>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">Risk</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">Alerts</th>
              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Genuine Rate</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((hotspot, idx) => {
              const badge = getRiskBadge(hotspot.riskScore)
              return (
                <tr key={hotspot.geohash} className="border-b border-gray-50">
                  <td className="py-2.5 pr-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                  <td className="py-2.5 pr-3">
                    <p className="text-sm font-medium text-gray-800">{hotspot.label}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{hotspot.geohash}</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${badge.className}`}>
                      <span className="font-bold">{hotspot.riskScore}</span>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-sm text-gray-600">{hotspot.alertCount}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                        <div
                          className="bg-green-500 rounded-full h-1.5 transition-all"
                          style={{ width: `${Math.min(hotspot.genuineRate * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(hotspot.genuineRate * 100)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
