'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAlertStore } from '@/stores/alert-store'
import { useRealtimeAlert } from '@/hooks/useRealtimeAlert'
import { Button } from '@/components/shared/Button'

export default function MonitoringPage() {
  const router = useRouter()
  const { activeAlert, alertType } = useAlertStore()
  const { updateAdditionalInfo, markFeelsSafe } = useRealtimeAlert(activeAlert?.id || null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [infoSent, setInfoSent] = useState(false)
  const [showSafeDialog, setShowSafeDialog] = useState(false)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  const isRed = alertType === 'red'

  // Auto-focus Cancel button and handle Escape when dialog opens
  useEffect(() => {
    if (!showSafeDialog) return
    cancelBtnRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSafeDialog(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSafeDialog])

  const handleSendInfo = useCallback(async () => {
    if (!additionalInfo.trim()) return
    await updateAdditionalInfo(additionalInfo.trim())
    setInfoSent(true)
    setAdditionalInfo('')
    setTimeout(() => setInfoSent(false), 3000)
  }, [additionalInfo, updateAdditionalInfo])

  const handleFeelsSafe = useCallback(async () => {
    await markFeelsSafe()
    router.push('/alert/closed')
  }, [markFeelsSafe, router])

  return (
    <div className={`min-h-screen flex flex-col ${isRed ? 'bg-red-50' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`rounded-b-[2rem] px-5 pt-10 pb-8 text-center ${
        isRed
          ? 'bg-gradient-to-b from-red-900 via-red-700 to-red-600'
          : 'bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800'
      }`}>
        {/* Eye Icon */}
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white animate-pulse-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>

        <h1 className="text-[24px] font-extrabold text-white mb-2">WE ARE WITH YOU</h1>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isRed
            ? 'bg-red-400/30 text-red-100'
            : 'bg-blue-400/30 text-blue-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRed ? 'bg-red-300' : 'bg-blue-300'} animate-pulse`} />
          Active Monitoring
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        {/* Info Cards */}
        <div className="space-y-3 mb-6">
          <div className={`rounded-xl p-4 border-2 ${
            isRed ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isRed ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-[14px] text-slate-700 leading-relaxed">
                The operator has confirmed your location and is <span className="font-bold">monitoring you on CCTV</span>.
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-4 border-2 ${
            isRed ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isRed ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-[14px] text-slate-700 leading-relaxed">
                The operator can see you and is <span className="font-bold">ready to alert emergency services</span> if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-[13px] font-bold text-slate-700 mb-3">Send Additional Information</p>
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

        {/* I Feel Safe Now */}
        <Button
          fullWidth
          size="lg"
          variant="success"
          onClick={() => setShowSafeDialog(true)}
        >
          I Feel Safe Now
        </Button>

        {/* Safe to close banner */}
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xs text-green-700 font-medium">
            You can safely close this app. The operator will continue monitoring you.
          </p>
        </div>

        {/* Confirmation Dialog */}
        {showSafeDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5" role="alertdialog" aria-modal="true" aria-labelledby="monitoring-safe-dialog-title">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in">
              <h3 id="monitoring-safe-dialog-title" className="text-lg font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-[14px] text-slate-600 mb-6">
                Are you sure you feel completely safe now? This will close your active alert and end operator monitoring.
              </p>
              <div className="flex gap-3">
                <Button
                  ref={cancelBtnRef}
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
