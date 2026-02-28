'use client'

import type { FalseAlarmPatterns } from '@/types/risk'

interface FalseAlarmPanelProps {
  data: FalseAlarmPatterns
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function FalseAlarmPanel({ data }: FalseAlarmPanelProps) {
  const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const maxByHour = Math.max(...data.falseAlarmByHour, 1)
  const maxByDay = Math.max(...data.falseAlarmByDayOfWeek, 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">False Alarm Analysis</h2>
      <p className="text-xs text-gray-400 mb-4">
        Overall false alarm rate: <span className="font-semibold text-amber-600">{Math.round(data.overallFalseAlarmRate * 100)}%</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* False alarms by location */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top False Alarm Locations</h3>
          {data.topFalseAlarmGeohashes.length === 0 ? (
            <p className="text-sm text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {data.topFalseAlarmGeohashes.slice(0, 5).map((geo) => (
                <div key={geo.geohash} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{geo.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                        <div
                          className="bg-amber-500 rounded-full h-1.5"
                          style={{ width: `${Math.min(geo.falseAlarmRate * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {geo.falseAlertCount}/{geo.totalAlerts} ({Math.round(geo.falseAlarmRate * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* False alarms by user */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top False Alarm Users</h3>
          {data.topFalseAlarmUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {data.topFalseAlarmUsers.slice(0, 5).map((user) => (
                <div key={user.userId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-mono truncate">{user.userId.substring(0, 12)}...</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                        <div
                          className="bg-red-500 rounded-full h-1.5"
                          style={{ width: `${Math.min(user.falseAlarmRate * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {user.falseAlertCount}/{user.totalAlerts} ({Math.round(user.falseAlarmRate * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* False alarms by time */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By hour */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">False Alarms by Hour</h3>
          <div className="flex items-end gap-0.5 h-20">
            {data.falseAlarmByHour.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-amber-400 rounded-t-sm transition-all"
                  style={{ height: `${(count / maxByHour) * 100}%`, minHeight: count > 0 ? '2px' : '0px' }}
                />
                {i % 4 === 0 && (
                  <span className="text-[8px] text-gray-400">{hourLabels[i]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* By day */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">False Alarms by Day</h3>
          <div className="flex items-end gap-1 h-20">
            {data.falseAlarmByDayOfWeek.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-gray-400">{count > 0 ? count : ''}</span>
                <div
                  className="w-full bg-amber-400 rounded-t-sm transition-all"
                  style={{ height: `${(count / maxByDay) * 100}%`, minHeight: count > 0 ? '2px' : '0px' }}
                />
                <span className="text-[9px] text-gray-400">{DAY_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
