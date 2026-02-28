'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

export default function NotCoveredPage() {
  const router = useRouter()

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
        <h1 className="text-[24px] font-extrabold text-white">Area Not Covered</h1>
        <p className="text-blue-100 text-[14px] mt-1">We&apos;re not in your area yet</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        {/* Warning Icon */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Your area is not yet covered</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            E-SAF Civic is currently available in select areas with CCTV control room partnerships. We are expanding to new areas regularly.
          </p>
        </div>

        <Card variant="warning" className="mb-6">
          <p className="text-[14px] font-bold text-amber-900 mb-2">How coverage expansion works</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            We partner with local CCTV control rooms to provide coverage. When your local authority partners with E-SAF, your area will become available. You can help by contacting your local council to express interest in the service.
          </p>
        </Card>

        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            variant="outline"
            onClick={() => router.push('/register/safety-zone')}
          >
            Try a Different Postcode
          </Button>

          <a
            href="mailto:coverage@esaf.co.uk?subject=Coverage%20Request"
            className="block w-full text-center px-6 py-4 bg-gradient-to-br from-blue-700 to-blue-500 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all"
          >
            Contact Your Local Authority
          </a>
        </div>

        <div className="mt-8 bg-slate-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold">Currently covered:</span> Hertfordshire (SG, AL, WD, EN, HP postcode areas). More areas will be announced soon. Follow us for updates.
          </p>
        </div>
      </div>
    </div>
  )
}
