'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { validatePostcode, formatPostcode, findControlRoom } from '@/lib/utils/postcode'

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

export default function SafetyZonePage() {
  const router = useRouter()
  const [postcode, setPostcode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckCoverage = async () => {
    setError('')

    if (!postcode.trim()) {
      setError('Please enter your postcode')
      return
    }

    if (!validatePostcode(postcode)) {
      setError('Please enter a valid UK postcode')
      return
    }

    setLoading(true)

    // Store postcode in session
    const formatted = formatPostcode(postcode)
    try {
      sessionStorage.setItem('esaf_reg_postcode', formatted)
    } catch {
      // Ignore storage errors
    }

    // Check coverage
    const controlRoom = findControlRoom(postcode)

    if (controlRoom) {
      try {
        sessionStorage.setItem('esaf_reg_control_room_id', controlRoom.id)
        sessionStorage.setItem('esaf_reg_control_room_name', controlRoom.name)
      } catch {
        // Ignore
      }
      router.push('/register/linked')
    } else {
      router.push('/register/not-covered')
    }
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
        <h1 className="text-[24px] font-extrabold text-white">Safety Zone</h1>
        <p className="text-blue-100 text-[14px] mt-1">Find your local control room</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <ProgressBar step={5} total={5} />

        <Card variant="blue" className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900 mb-1">Set your safety zone</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your postcode to check if your area is covered by a CCTV control room. This determines which control room receives your alerts.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Input
            label="Postcode"
            placeholder="e.g. SG1 1AA"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value.toUpperCase())
              if (error) setError('')
            }}
            error={error}
            hint="Enter your home postcode or the area you spend the most time in"
          />

          <Button
            fullWidth
            size="lg"
            onClick={handleCheckCoverage}
            loading={loading}
          >
            Check Coverage
          </Button>
        </div>

        <div className="mt-8 bg-slate-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold">Currently covered areas:</span> Hertfordshire (SG, AL, WD, EN, HP postcode areas). More areas are being added regularly.
          </p>
        </div>
      </div>
    </div>
  )
}
