'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAlertStore } from '@/stores/alert-store'
import { useRealtimeAlert } from '@/hooks/useRealtimeAlert'
import { formatTime } from '@/lib/utils/format'
import { Button } from '@/components/shared/Button'

interface TimelineStep {
  label: string
  icon: 'check' | 'hourglass' | 'search' | 'eye'
  status: 'complete' | 'active' | 'pending'
  timestamp: number | null
}

function TimelineIcon({ icon, status }: { icon: string; status: string }) {
  const isComplete = status === 'complete'
  const isActive = status === 'active'

  const bgColor = isComplete
    ? 'bg-green-100 border-green-400'
    : isActive
      ? 'bg-blue-100 border-blue-400'
      : 'bg-slate-100 border-slate-300'

  const iconColor = isComplete
    ? 'text-green-600'
    : isActive
      ? 'text-blue-600'
      : 'text-slate-400'

  return (
    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bgColor} ${isActive ? 'animate-pulse-opacity' : ''}`}>
      {icon === 'check' && (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {icon === 'hourglass' && (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {icon === 'search' && (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
      {icon === 'eye' && (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </div>
  )
}

export default function TrackingPage() {
  const router = useRouter()
  const { activeAlert, alertType, workflowStep, realtimeState } = useAlertStore()
  const { updateAdditionalInfo, markFeelsSafe } = useRealtimeAlert(activeAlert?.id || null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [infoSent, setInfoSent] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [showSafeDialog, setShowSafeDialog] = useState(false)

  const isRed = alertType === 'red'
  const alertTime = activeAlert?.createdAt || Date.now()

  // Build timeline steps based on workflow step
  const steps: TimelineStep[] = [
    {
      label: 'Alert received by control room',
      icon: 'check',
      status: workflowStep >= 2 ? 'complete' : workflowStep === 1 ? 'active' : 'pending',
      timestamp: workflowStep >= 1 ? alertTime : null,
    },
    {
      label: 'Awaiting operator review',
      icon: 'hourglass',
      status: workflowStep >= 3 ? 'complete' : workflowStep === 2 ? 'active' : 'pending',
      timestamp: workflowStep >= 2 ? alertTime + 5000 : null,
    },
    {
      label: 'Operator searching CCTV',
      icon: 'search',
      status: workflowStep >= 4 ? 'complete' : workflowStep === 3 ? 'active' : 'pending',
      timestamp: workflowStep >= 3 ? alertTime + 30000 : null,
    },
    {
      label: 'Visual confirmation',
      icon: 'eye',
      status: workflowStep >= 4 ? (realtimeState?.operatorStatus === 'visual_confirmed' ? 'complete' : 'active') : 'pending',
      timestamp: workflowStep >= 4 ? alertTime + 60000 : null,
    },
  ]

  // Auto-navigate to monitoring when visual confirmed
  useEffect(() => {
    if (realtimeState?.operatorStatus === 'visual_confirmed') {
      const timer = setTimeout(() => {
        router.push('/alert/monitoring')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [realtimeState?.operatorStatus, router])

  const handleSendInfo = useCallback(async () => {
    if (!additionalInfo.trim()) return
    await updateAdditionalInfo(additionalInfo.trim())
    setInfoSent(true)
    setTimeout(() => setInfoSent(false), 3000)
  }, [additionalInfo, updateAdditionalInfo])

  const handleFeelsSafe = useCallback(async () => {
    await markFeelsSafe()
    router.push('/alert/closed')
  }, [markFeelsSafe, router])

  return (
    <div className={`min-h-screen flex flex-col ${isRed ? 'bg-red-50' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`rounded-b-[2rem] px-5 pt-10 pb-6 ${
        isRed
          ? 'bg-gradient-to-b from-red-900 via-red-700 to-red-600'
          : 'bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800'
      }`}>
        <h1 className="text-[24px] font-extrabold text-white text-center mb-2">Live Status</h1>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mx-auto block w-fit ${
          isRed
            ? 'bg-red-400/30 text-red-100'
            : 'bg-blue-400/30 text-blue-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRed ? 'bg-red-300' : 'bg-blue-300'} animate-pulse`} />
          {isRed ? 'RED ALERT' : 'BLUE ALERT'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        {/* Timeline */}
        <div className="mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <TimelineIcon icon={step.icon} status={step.status} />
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 my-1 ${
                    step.status === 'complete' ? 'bg-green-300' : 'bg-slate-200'
                  }`} />
                )}
              </div>
              <div className="pb-4 flex-1 pt-2">
                <p className={`text-[14px] font-semibold ${
                  step.status === 'complete'
                    ? 'text-green-700'
                    : step.status === 'active'
                      ? 'text-slate-900'
                      : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                {step.timestamp && step.status !== 'pending' && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatTime(step.timestamp)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Send Additional Info */}
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => setInfoExpanded(!infoExpanded)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-[13px] font-bold text-slate-700">Send Additional Info</span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${infoExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {infoExpanded && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-3 animate-fade-in">
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any details to help the operator locate you faster"
                className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none h-20"
              />
              <Button
                fullWidth
                size="sm"
                className="mt-2"
                onClick={handleSendInfo}
                disabled={!additionalInfo.trim()}
              >
                Send to Operator
              </Button>
              {infoSent && (
                <div className="flex items-center gap-1.5 mt-2 animate-fade-in">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-green-600 font-semibold">Message sent to control room</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feel Safe Button */}
        <Button
          fullWidth
          size="lg"
          variant="success"
          onClick={() => setShowSafeDialog(true)}
        >
          I Feel Safe Now
        </Button>

        {/* Confirmation Dialog */}
        {showSafeDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-[14px] text-slate-600 mb-6">
                Are you sure you feel completely safe now? This will close your active alert.
              </p>
              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowSafeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="success"
                  onClick={handleFeelsSafe}
                >
                  Yes, I&apos;m Safe
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
