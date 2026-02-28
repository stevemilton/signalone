'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useAlertStore } from '@/stores/alert-store'
import { Button } from '@/components/shared/Button'

export default function WelfareConfirmedPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { reset } = useAlertStore()
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    try {
      const storedDay = sessionStorage.getItem('esaf_welfare_day')
      const storedTime = sessionStorage.getItem('esaf_welfare_time')

      if (storedDay) {
        const date = new Date(storedDay)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) {
          setDay('Today')
        } else if (date.toDateString() === tomorrow.toDateString()) {
          setDay('Tomorrow')
        } else {
          setDay(date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))
        }
      }

      if (storedTime) setTime(storedTime)

      // Cleanup
      sessionStorage.removeItem('esaf_welfare_day')
      sessionStorage.removeItem('esaf_welfare_time')
    } catch {
      // Ignore
    }
  }, [])

  const handleReturnHome = () => {
    reset()
    router.push('/alert')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-4 animate-fade-in">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[24px] font-extrabold text-white">Welfare Call Booked</h1>
        <p className="text-blue-100 text-[14px] mt-1">We&apos;ll be in touch</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        <div className="animate-slide-up">
          {/* Booking Details */}
          <div className="bg-white border-2 border-green-400 rounded-2xl p-6 mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Day</p>
                <p className="text-lg font-bold text-slate-900">{day || 'Scheduled'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Time</p>
                <p className="text-lg font-bold text-slate-900">{time || 'Confirmed'}</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4" />

            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-[14px] text-slate-600">
                We&apos;ll call you at <span className="font-bold">{user?.phone || 'your registered number'}</span>
              </p>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleReturnHome}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
