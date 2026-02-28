'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'

export default function WelfareSchedulePage() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const days = useMemo(() => {
    const result: { label: string; value: string }[] = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      let label: string
      if (i === 0) {
        label = 'Today'
      } else if (i === 1) {
        label = 'Tomorrow'
      } else {
        label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      }

      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      result.push({
        label,
        value: date.toISOString().split('T')[0],
      })
    }

    return result
  }, [])

  const times = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '2:00 PM',
    '4:00 PM',
    '6:00 PM',
  ]

  const handleConfirm = async () => {
    if (!selectedDay || !selectedTime) {
      setError('Please select a day and time')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Store the booking details
      sessionStorage.setItem('esaf_welfare_day', selectedDay)
      sessionStorage.setItem('esaf_welfare_time', selectedTime)

      router.push('/alert/welfare/confirmed')
    } catch {
      setError('Failed to schedule. Please try again.')
      setLoading(false)
    }
  }

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
        <h1 className="text-[24px] font-extrabold text-white">Schedule Call</h1>
        <p className="text-blue-100 text-[14px] mt-1">Pick a time that works for you</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4 animate-fade-in">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Day Picker */}
        <div className="mb-6">
          <p className="text-[13px] font-bold text-slate-700 mb-3">Select a Day</p>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day.value}
                onClick={() => {
                  setSelectedDay(day.value)
                  setError('')
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                  selectedDay === day.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Picker */}
        <div className="mb-8">
          <p className="text-[13px] font-bold text-slate-700 mb-3">Select a Time</p>
          <div className="grid grid-cols-3 gap-2">
            {times.map((time) => (
              <button
                key={time}
                onClick={() => {
                  setSelectedTime(time)
                  setError('')
                }}
                className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                  selectedTime === time
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Summary */}
        {selectedDay && selectedTime && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 animate-fade-in">
            <p className="text-xs text-blue-600 font-semibold mb-1">Selected</p>
            <p className="text-[14px] font-bold text-slate-900">
              {days.find((d) => d.value === selectedDay)?.label} at {selectedTime}
            </p>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          disabled={!selectedDay || !selectedTime}
          loading={loading}
          onClick={handleConfirm}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  )
}
