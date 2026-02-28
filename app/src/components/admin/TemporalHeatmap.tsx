'use client'

interface TemporalHeatmapProps {
  hourDayHeatmap: number[][] // 7x24 [day][hour]
  hourlyProfile: number[]
  dayOfWeekProfile: number[]
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCellColor(value: number, max: number): string {
  if (max === 0) return 'bg-gray-100'
  const intensity = value / max
  if (intensity >= 0.75) return 'bg-red-500'
  if (intensity >= 0.5) return 'bg-orange-400'
  if (intensity >= 0.25) return 'bg-amber-300'
  if (intensity > 0) return 'bg-blue-200'
  return 'bg-gray-100'
}

function getCellOpacity(value: number, max: number): number {
  if (max === 0) return 0.3
  return 0.3 + (value / max) * 0.7
}

export default function TemporalHeatmap({ hourDayHeatmap, hourlyProfile, dayOfWeekProfile }: TemporalHeatmapProps) {
  const max = Math.max(...hourDayHeatmap.flat(), 1)
  const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

  if (hourDayHeatmap.every(row => row.every(v => v === 0))) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temporal Risk Heatmap</h2>
        <div className="py-8 text-center text-gray-400 text-sm">
          No temporal data available. Run a risk recomputation to populate.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Temporal Risk Heatmap</h2>
      <p className="text-xs text-gray-400 mb-4">Alert density by day of week and hour of day</p>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="w-12" />
              {hourLabels.map(h => (
                <th key={h} className="text-[9px] text-gray-400 font-medium pb-1 text-center w-6">
                  {parseInt(h) % 3 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_LABELS.map((day, dayIdx) => (
              <tr key={day}>
                <td className="text-[11px] text-gray-500 font-medium pr-2 text-right">{day}</td>
                {hourLabels.map((_, hourIdx) => {
                  const value = hourDayHeatmap[dayIdx]?.[hourIdx] ?? 0
                  return (
                    <td key={hourIdx} className="p-0.5">
                      <div
                        className={`w-full aspect-square rounded-sm ${getCellColor(value, max)}`}
                        style={{ opacity: getCellOpacity(value, max), minWidth: '16px', minHeight: '16px' }}
                        title={`${day} ${String(hourIdx).padStart(2, '0')}:00 — ${value} alerts`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[10px] text-gray-400">Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-blue-200" />
          <div className="w-3 h-3 rounded-sm bg-amber-300" />
          <div className="w-3 h-3 rounded-sm bg-orange-400" />
          <div className="w-3 h-3 rounded-sm bg-red-500" />
        </div>
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  )
}
