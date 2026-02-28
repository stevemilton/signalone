'use client'

import type { RiskFactor, RiskLevel } from '@/types/risk'

interface RiskFactorsBreakdownProps {
  factors: RiskFactor[]
  level: RiskLevel
  falseAlarmProbability: number
}

const LEVEL_BAR_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#f59e0b',
  elevated: '#f97316',
  high: '#ef4444',
}

function getBarColor(score: number): string {
  if (score >= 75) return '#ef4444'
  if (score >= 50) return '#f97316'
  if (score >= 25) return '#f59e0b'
  return '#22c55e'
}

export default function RiskFactorsBreakdown({ factors, level, falseAlarmProbability }: RiskFactorsBreakdownProps) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
    >
      <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        Risk Factors
      </h2>

      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-slate-300 font-medium">{factor.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  {Math.round(factor.weight * 100)}%
                </span>
                <span className="text-[12px] font-semibold text-slate-200">{factor.score}</span>
              </div>
            </div>
            {/* Bar */}
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${factor.score}%`,
                  backgroundColor: getBarColor(factor.score),
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{factor.description}</p>
          </div>
        ))}
      </div>

      {/* False alarm probability */}
      {falseAlarmProbability > 0 && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: '#334155' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">False alarm probability</span>
            <span className="text-[12px] font-semibold text-slate-300">
              {Math.round(falseAlarmProbability * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
