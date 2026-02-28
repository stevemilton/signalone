'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { useRiskInsights } from '@/hooks/useRiskInsights'
import RiskHeatmapGrid from '@/components/admin/RiskHeatmapGrid'
import TemporalHeatmap from '@/components/admin/TemporalHeatmap'
import HotspotTable from '@/components/admin/HotspotTable'
import FalseAlarmPanel from '@/components/admin/FalseAlarmPanel'

interface AnalyticsData {
  totalAlerts: number
  avgResponseTime: number
  genuineRate: number
  escalationRate: number
  alertsByHour: number[]
  alertsByDay: number[]
  classificationBreakdown: {
    genuine: number
    false_alert: number
    malicious: number
    unclear: number
  }
  alertTypeSplit: {
    blue: number
    red: number
  }
  controlRoomComparison: {
    id: string
    name: string
    alerts: number
    avgResponseTime: number
    genuineRate: number
  }[]
  welfareUptake: number
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function BarChart({ data, labels, color, maxBars }: { data: number[]; labels: string[]; color: string; maxBars?: number }) {
  const max = Math.max(...data, 1)
  const displayData = maxBars ? data.slice(0, maxBars) : data
  const displayLabels = maxBars ? labels.slice(0, maxBars) : labels

  return (
    <div className="flex items-end gap-1 h-40">
      {displayData.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-400 font-medium">{value > 0 ? value : ''}</span>
          <div
            className={`w-full rounded-t-sm ${color} transition-all duration-300`}
            style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '4px' : '0px' }}
          />
          <span className="text-[10px] text-gray-500 font-medium">{displayLabels[i]}</span>
        </div>
      ))}
    </div>
  )
}

function HorizontalBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-6">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-300 flex items-center justify-center`}
            style={{ width: `${(seg.value / total) * 100}%` }}
          >
            {(seg.value / total) * 100 > 10 && (
              <span className="text-[10px] font-bold text-white">{Math.round((seg.value / total) * 100)}%</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span className="text-xs text-gray-600">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  // Risk Intelligence
  const riskInsights = useRiskInsights()

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ dateFrom, dateTo })
      const res = await fetch(`/api/admin/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ dateFrom, dateTo, format: 'csv' })
      const res = await fetch(`/api/admin/analytics/export?${params}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${dateFrom}-to-${dateTo}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export Data
        </Button>
      </div>

      {error && (
        <Card variant="danger">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchAnalytics}>Retry</Button>
        </Card>
      )}

      {/* Date Range */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <Button variant="primary" size="sm" onClick={fetchAnalytics} loading={loading} className="shrink-0">
            Apply
          </Button>
        </div>
      </Card>

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Alerts</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data.totalAlerts.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Response Time</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{Math.round(data.avgResponseTime)}s</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Genuine Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{Math.round(data.genuineRate)}%</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Escalation Rate</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{Math.round(data.escalationRate)}%</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts by Hour */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts by Hour of Day</h2>
              <BarChart
                data={data.alertsByHour || Array(24).fill(0)}
                labels={hourLabels}
                color="bg-blue-500"
              />
            </Card>

            {/* Alerts by Day */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts by Day of Week</h2>
              <BarChart
                data={data.alertsByDay || Array(7).fill(0)}
                labels={dayLabels}
                color="bg-indigo-500"
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Breakdown */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification Breakdown</h2>
              <HorizontalBar
                segments={[
                  { label: 'Genuine', value: data.classificationBreakdown?.genuine ?? 0, color: 'bg-green-500' },
                  { label: 'False Alert', value: data.classificationBreakdown?.false_alert ?? 0, color: 'bg-amber-500' },
                  { label: 'Malicious', value: data.classificationBreakdown?.malicious ?? 0, color: 'bg-red-500' },
                  { label: 'Unclear', value: data.classificationBreakdown?.unclear ?? 0, color: 'bg-gray-400' },
                ]}
              />
            </Card>

            {/* Alert Type Split */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Type Split</h2>
              {(() => {
                const blue = data.alertTypeSplit?.blue ?? 0
                const red = data.alertTypeSplit?.red ?? 0
                const total = blue + red || 1
                const bluePercent = Math.round((blue / total) * 100)
                const redPercent = 100 - bluePercent

                return (
                  <div className="space-y-4">
                    {/* Simple "pie" using two semicircles */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <div className="absolute inset-0 rounded-full overflow-hidden flex">
                          <div className="bg-blue-500 transition-all duration-300" style={{ width: `${bluePercent}%` }} />
                          <div className="bg-red-500 transition-all duration-300" style={{ width: `${redPercent}%` }} />
                        </div>
                        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">{total}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm text-gray-600">Blue: {blue} ({bluePercent}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-600">Red: {red} ({redPercent}%)</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </Card>
          </div>

          {/* Control Room Comparison */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Control Room Comparison</h2>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Control Room</th>
                    <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Total Alerts</th>
                    <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Genuine Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.controlRoomComparison || data.controlRoomComparison.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">No data available</td>
                    </tr>
                  ) : (
                    data.controlRoomComparison.map((cr) => (
                      <tr key={cr.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-800">{cr.name}</td>
                        <td className="py-3 pr-4 text-gray-600">{cr.alerts}</td>
                        <td className="py-3 pr-4 text-gray-600">{Math.round(cr.avgResponseTime)}s</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-green-500 rounded-full h-2 transition-all duration-300"
                                style={{ width: `${Math.min(cr.genuineRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{Math.round(cr.genuineRate)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Welfare Uptake */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Welfare Check-in Uptake</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${data.welfareUptake}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-800">{Math.round(data.welfareUptake)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  of eligible users have booked a welfare check-in following an alert.
                </p>
                <p className="text-xs text-gray-400 mt-1">Based on data from {dateFrom} to {dateTo}</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Risk Intelligence Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Risk Intelligence</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pattern analysis from {riskInsights.data?.metadata ? `${riskInsights.data.metadata.alertsAnalyzed} alerts` : 'alert history'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {riskInsights.data?.metadata && (
              <span className="text-xs text-gray-400">
                Last computed: {new Date(riskInsights.data.metadata.lastComputedAt).toLocaleString('en-GB')}
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={riskInsights.recompute}
              loading={riskInsights.recomputing}
            >
              {riskInsights.recomputing ? 'Recomputing...' : 'Recompute Insights'}
            </Button>
          </div>
        </div>

        {riskInsights.error && (
          <Card variant="danger">
            <p className="text-sm text-red-700">{riskInsights.error}</p>
          </Card>
        )}

        {riskInsights.loading && !riskInsights.data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
                <div className="h-32 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {riskInsights.data && !riskInsights.data.computed && (
          <Card>
            <div className="text-center py-6">
              <p className="text-gray-600">Risk insights have not been computed yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click &quot;Recompute Insights&quot; to analyse your alert data.</p>
            </div>
          </Card>
        )}

        {riskInsights.data?.computed && (
          <div className="space-y-6">
            {/* Row 1: Heatmap Grid + Hotspot Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {riskInsights.data.spatial && (
                <RiskHeatmapGrid cells={riskInsights.data.spatial.cells} />
              )}
              {riskInsights.data.spatial && (
                <HotspotTable hotspots={riskInsights.data.spatial.hotspots} />
              )}
            </div>

            {/* Row 2: Temporal Heatmap */}
            {riskInsights.data.temporal && (
              <TemporalHeatmap
                hourDayHeatmap={riskInsights.data.temporal.hourDayHeatmap}
                hourlyProfile={riskInsights.data.temporal.hourlyProfile}
                dayOfWeekProfile={riskInsights.data.temporal.dayOfWeekProfile}
              />
            )}

            {/* Row 3: False Alarm Panel */}
            {riskInsights.data.falseAlarmPatterns && (
              <FalseAlarmPanel data={riskInsights.data.falseAlarmPatterns} />
            )}

            {/* Monthly Trends */}
            {riskInsights.data.temporal?.monthlyTrends && riskInsights.data.temporal.monthlyTrends.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Alerts</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Genuine Rate</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Red Rate</th>
                        <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Escalation Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskInsights.data.temporal.monthlyTrends.map((trend) => (
                        <tr key={trend.month} className="border-b border-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{trend.month}</td>
                          <td className="py-2.5 pr-4 text-gray-600">{trend.alertCount}</td>
                          <td className="py-2.5 pr-4 text-gray-600">{Math.round(trend.genuineRate * 100)}%</td>
                          <td className="py-2.5 pr-4 text-gray-600">{trend.avgResponseTimeSec}s</td>
                          <td className="py-2.5 pr-4 text-gray-600">{Math.round(trend.redAlertRate * 100)}%</td>
                          <td className="py-2.5 text-gray-600">{Math.round(trend.escalationRate * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
