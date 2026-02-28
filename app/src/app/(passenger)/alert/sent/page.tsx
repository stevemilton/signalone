'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAlertStore } from '@/stores/alert-store'
import { useAuthStore } from '@/stores/auth-store'
import { formatTime } from '@/lib/utils/format'
import { Card } from '@/components/shared/Card'

export default function AlertSentPage() {
  const router = useRouter()
  const { activeAlert, alertType } = useAlertStore()
  const { user } = useAuthStore()
  const [autoAdvance, setAutoAdvance] = useState(3)

  const isRed = alertType === 'red'

  useEffect(() => {
    const timer = setInterval(() => {
      setAutoAdvance((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/alert/tracking')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const controlRoomName = 'Herts CCTV Partnership'
  const timestamp = activeAlert?.createdAt || Date.now()
  const emergencyContact = user?.emergencyContactName || 'Emergency Contact'
  const emergencyPhone = user?.emergencyContactPhone || ''

  return (
    <div className={`min-h-screen flex flex-col ${isRed ? 'bg-red-50' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`rounded-b-[2rem] px-5 pt-12 pb-10 text-center ${
        isRed
          ? 'bg-gradient-to-b from-red-900 via-red-700 to-red-600'
          : 'bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800'
      }`}>
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-fade-in">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-[24px] font-extrabold text-white mb-1">Alert Sent</h1>

        {/* Alert Type Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
          isRed
            ? 'bg-red-400/30 text-red-100'
            : 'bg-blue-400/30 text-blue-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRed ? 'bg-red-300' : 'bg-blue-300'}`} />
          {isRed ? 'RED ALERT — Identified' : 'BLUE ALERT — Anonymous'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <div className="animate-slide-up">
          {/* Sent To */}
          <Card variant={isRed ? 'red' : 'blue'} className="mb-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Alert sent to</p>
              <p className="text-lg font-bold text-slate-900">{controlRoomName}</p>
              <p className="text-xs text-slate-500 mt-1">{formatTime(timestamp)}</p>
            </div>
          </Card>

          {/* SMS Notification Card */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden mb-4">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm font-semibold text-white">SMS Notification</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-1">To: {emergencyContact} {emergencyPhone && `(${emergencyPhone})`}</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-700 leading-relaxed">
                  &quot;{user?.fullName || 'Someone you know'} has raised a safety alert via E-SAF Civic.
                  Location shared at {formatTime(timestamp)}. This is an automated message — please check in with them when safe to do so.&quot;
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[10px] text-green-600 font-semibold">SMS automatically sent to your emergency contact</p>
              </div>
            </div>
          </div>

          {/* Auto-advance indicator */}
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Redirecting to live tracking in {autoAdvance}s...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
