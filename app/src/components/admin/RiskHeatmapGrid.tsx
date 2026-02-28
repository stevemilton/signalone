'use client'

import type { GeohashCell } from '@/types/risk'

interface RiskHeatmapGridProps {
  cells: Record<string, GeohashCell>
}

function getCellColor(score: number): string {
  if (score >= 75) return 'bg-red-500'
  if (score >= 50) return 'bg-orange-500'
  if (score >= 25) return 'bg-amber-400'
  return 'bg-green-500'
}

function getCellOpacity(score: number): number {
  return 0.3 + (score / 100) * 0.7
}

export default function RiskHeatmapGrid({ cells }: RiskHeatmapGridProps) {
  const entries = Object.entries(cells)
    .sort(([, a], [, b]) => b.riskScore - a.riskScore)
    .slice(0, 50)

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Spatial Risk Heatmap</h2>
        <div className="py-8 text-center text-gray-400 text-sm">
          No spatial data available. Run a risk recomputation to populate.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Spatial Risk Heatmap</h2>
      <p className="text-xs text-gray-400 mb-4">{entries.length} cells with alert data (top 50 by risk)</p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-[10px] text-gray-500">Low (0-25)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-[10px] text-gray-500">Moderate (26-50)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <span className="text-[10px] text-gray-500">Elevated (51-75)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-[10px] text-gray-500">High (76-100)</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1">
        {entries.map(([geohash, cell]) => (
          <div
            key={geohash}
            className={`w-10 h-10 rounded-md ${getCellColor(cell.riskScore)} flex items-center justify-center cursor-default group relative`}
            style={{ opacity: getCellOpacity(cell.riskScore) }}
            title={`${geohash}: ${cell.alertCount} alerts, risk ${cell.riskScore}`}
          >
            <span className="text-[10px] font-bold text-white">{cell.riskScore}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[11px] whitespace-nowrap shadow-lg">
                <p className="font-semibold">{geohash}</p>
                <p>{cell.alertCount} alerts | {cell.genuineRate * 100}% genuine</p>
                <p>{cell.redAlertCount} red | {cell.blueAlertCount} blue</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
