'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAlertStore } from '@/stores/alert-store'
import { formatTime, formatDate, formatDuration, generateReferenceNumber } from '@/lib/utils/format'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

export default function ClosedPage() {
  const router = useRouter()
  const { activeAlert, alertType, alertStartTime, reset } = useAlertStore()

  const closedAt = Date.now()
  const startedAt = alertStartTime || activeAlert?.createdAt || closedAt - 300000
  const durationSeconds = Math.floor((closedAt - startedAt) / 1000)
  const controlRoomName = 'Herts CCTV Partnership'

  const referenceNumber = useMemo(() => generateReferenceNumber(), [])

  const handleReturnHome = () => {
    reset()
    router.push('/alert')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-4 animate-fade-in">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[24px] font-extrabold text-white">Alert Closed</h1>
        <p className="text-blue-100 text-[14px] mt-1">Glad you&apos;re safe</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        {/* Summary Card */}
        <Card className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Incident Summary</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Time Closed</p>
              <p className="text-[14px] font-semibold text-slate-900">{formatTime(closedAt)}, {formatDate(closedAt)}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-[14px] font-semibold text-slate-900">{formatDuration(durationSeconds)}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Control Room</p>
              <p className="text-[14px] font-semibold text-slate-900">{controlRoomName}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Reference</p>
              <p className="text-[14px] font-mono font-semibold text-slate-900">{referenceNumber}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Alert Type</p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                alertType === 'red'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                {alertType === 'red' ? 'Red' : 'Blue'}
              </div>
            </div>
          </div>
        </Card>

        {/* Welfare Check-in */}
        <Card variant="blue" className="mb-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-slate-900 mb-1">Would you like a welfare check-in?</p>
            <p className="text-xs text-slate-600 mb-4">We can arrange a follow-up call to check on your wellbeing</p>
            <Button
              fullWidth
              size="md"
              onClick={() => router.push('/alert/welfare')}
            >
              Schedule Welfare Call
            </Button>
          </div>
        </Card>

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={handleReturnHome}
        >
          Return Home
        </Button>
      </div>
    </div>
  )
}
