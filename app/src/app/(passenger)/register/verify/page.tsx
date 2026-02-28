'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

type VerificationMethod = 'passport' | 'driving-licence' | null
type VerificationState = 'select' | 'processing' | 'success'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < step ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
      <span className="text-xs text-slate-400 font-medium ml-1 whitespace-nowrap">
        Step {step} of {total}
      </span>
    </div>
  )
}

export default function VerifyPage() {
  const router = useRouter()
  const [method, setMethod] = useState<VerificationMethod>(null)
  const [state, setState] = useState<VerificationState>('select')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (state !== 'processing') return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setState('success')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state])

  const startVerification = (selectedMethod: VerificationMethod) => {
    setMethod(selectedMethod)
    setState('processing')
    setCountdown(3)
  }

  const handleContinue = () => {
    router.push('/register/terms')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-white">Identity Verification</h1>
        <p className="text-blue-100 text-[14px] mt-1">Quick and secure verification</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <ProgressBar step={2} total={5} />

        {state === 'select' && (
          <div className="animate-fade-in">
            <Card variant="blue" className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900 mb-1">Why we verify your identity</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Identity verification helps keep the community safe and prevents misuse of the alert system.
                    This is a one-time check that takes 2-3 minutes.
                  </p>
                </div>
              </div>
            </Card>

            <p className="text-[13px] font-semibold text-slate-700 mb-3">Choose your document type</p>

            <div className="space-y-3">
              <button
                onClick={() => startVerification('passport')}
                className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[14px] font-bold text-slate-900">Passport</p>
                  <p className="text-xs text-slate-500">UK or international passport</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => startVerification('driving-licence')}
                className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[14px] font-bold text-slate-900">Driving Licence</p>
                  <p className="text-xs text-slate-500">UK driving licence</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-slate-500">E-SAF never stores your identity document</p>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-6" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Verifying your {method === 'passport' ? 'Passport' : 'Driving Licence'}</h2>
            <p className="text-[14px] text-slate-500 mb-4">This usually takes 2-3 minutes</p>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <svg className="w-4 h-4 text-blue-600 animate-pulse-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">Estimated time: {countdown}s</span>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Identity Verified</h2>
            <p className="text-[14px] text-slate-500 mb-8">
              Your {method === 'passport' ? 'passport' : 'driving licence'} has been successfully verified
            </p>

            <Button fullWidth size="lg" onClick={handleContinue}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
