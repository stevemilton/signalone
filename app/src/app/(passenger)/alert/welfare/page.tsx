'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'

export default function WelfarePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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
        <h1 className="text-[24px] font-extrabold text-white">Welfare Check-In</h1>
        <p className="text-blue-100 text-[14px] mt-1">We care about your wellbeing</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        <div className="text-center mb-8 animate-fade-in">
          {/* Caring Icon */}
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-3">
            Would you like a welfare check-in call?
          </h2>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-xs mx-auto mb-8">
            After a safety incident, it can help to talk to someone. We can arrange a brief welfare call from a trained member of our team to check how you&apos;re doing and offer support resources.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push('/alert/welfare/schedule')}
          >
            Yes, Schedule a Call
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => router.push('/alert')}
          >
            No Thanks
          </Button>
        </div>

        <div className="mt-8 bg-slate-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold">What to expect:</span> A friendly 5-10 minute call from a trained welfare officer. They can provide information about local support services, victim support, and other resources that may help.
          </p>
        </div>
      </div>
    </div>
  )
}
