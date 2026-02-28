'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'

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

interface TermsSectionProps {
  title: string
  content: React.ReactNode
  checked: boolean
  scrolledToBottom: boolean
  onCheck: (checked: boolean) => void
  onScrollToBottom: () => void
}

function TermsSection({ title, content, checked, scrolledToBottom, onCheck, onScrollToBottom }: TermsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      onScrollToBottom()
    }
  }, [onScrollToBottom])

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[160px] overflow-y-auto px-4 py-3 text-xs text-slate-600 leading-relaxed scroll-smooth"
      >
        {content}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <label className={`flex items-center gap-2.5 ${!scrolledToBottom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={!scrolledToBottom}
            onChange={(e) => onCheck(e.target.checked)}
            className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <span className="text-xs font-medium text-slate-700">
            I have read and agree to these terms
          </span>
          {!scrolledToBottom && (
            <span className="text-[10px] text-slate-400 ml-auto">(scroll to enable)</span>
          )}
        </label>
      </div>
    </div>
  )
}

export default function TermsPage() {
  const router = useRouter()

  const [scrolled, setScrolled] = useState([false, false, false])
  const [checked, setChecked] = useState([false, false, false])

  const handleScrollToBottom = (index: number) => {
    setScrolled((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }

  const handleCheck = (index: number, value: boolean) => {
    setChecked((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const allChecked = checked.every(Boolean)

  const handleContinue = () => {
    if (!allChecked) return
    router.push('/register/photo')
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
        <h1 className="text-[24px] font-extrabold text-white">Terms & Conditions</h1>
        <p className="text-blue-100 text-[14px] mt-1">Please read and accept all sections</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <ProgressBar step={3} total={5} />

        <div className="space-y-4">
          {/* Section 1: General Terms */}
          <TermsSection
            title="1. General Terms of Use & Privacy"
            scrolledToBottom={scrolled[0]}
            checked={checked[0]}
            onScrollToBottom={() => handleScrollToBottom(0)}
            onCheck={(v) => handleCheck(0, v)}
            content={
              <>
                <p className="mb-3 font-semibold">Data Protection & Privacy</p>
                <p className="mb-2">E-SAF Civic processes your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
                <p className="mb-2"><span className="font-semibold">Data we collect:</span> Your name, contact details, emergency contact information, photograph, postcode, and location data when you raise an alert.</p>
                <p className="mb-2"><span className="font-semibold">How we use your data:</span> To connect you with your local CCTV control room when you feel unsafe, and to notify your emergency contact when an alert is raised.</p>
                <p className="mb-2"><span className="font-semibold">Data retention:</span> Your personal data is retained for 12 months from the date of your last activity. Alert records are retained for 12 months from the incident date for audit purposes.</p>
                <p className="mb-2"><span className="font-semibold">Your rights:</span> You have the right to access, rectify, erase, restrict, and port your personal data. You may also object to processing.</p>
                <p className="mb-2"><span className="font-semibold">Data controller:</span> E-SAF Ltd is the data controller. For data enquiries, contact <span className="text-blue-600">data@esaf.co.uk</span>.</p>
                <p className="mb-2">We use end-to-end encryption for data in transit and at rest. Your identity verification documents are processed by a third-party provider and are not stored by E-SAF.</p>
                <p className="mb-2">By creating an account, you consent to the processing of your personal data as described above.</p>
                <p className="mb-2">We may share anonymised, aggregated data with local authorities and police forces for the purpose of improving public safety.</p>
                <p>For full details, please refer to our Privacy Policy available at esaf.co.uk/privacy.</p>
              </>
            }
          />

          {/* Section 2: Limitations */}
          <TermsSection
            title="2. Limitations of Service & Emergency Protocol"
            scrolledToBottom={scrolled[1]}
            checked={checked[1]}
            onScrollToBottom={() => handleScrollToBottom(1)}
            onCheck={(v) => handleCheck(1, v)}
            content={
              <>
                <p className="mb-3 font-semibold">Important: E-SAF Civic is NOT an Emergency Service</p>
                <p className="mb-2">E-SAF Civic is a supplementary personal safety tool. It is <span className="font-bold">NOT</span> a replacement for the emergency services (999/112).</p>
                <p className="mb-2"><span className="font-semibold">Always call 999 first</span> if you are in immediate danger, witnessing a crime in progress, or require emergency medical attention.</p>
                <p className="mb-2">E-SAF Civic connects you to your local CCTV control room. The control room operators will attempt to locate you on CCTV and monitor your situation. However:</p>
                <ul className="list-disc list-inside mb-2 space-y-1">
                  <li>Control rooms operate during specific hours and may not be available 24/7</li>
                  <li>CCTV coverage is not universal &mdash; there may be areas without camera coverage</li>
                  <li>Operators can observe but cannot physically intervene</li>
                  <li>Response times may vary depending on operator availability</li>
                </ul>
                <p className="mb-2">E-SAF Ltd accepts <span className="font-bold">no legal obligation</span> for the safety of users. The service is provided on a best-efforts basis.</p>
                <p className="mb-2">E-SAF Ltd is not liable for any loss, injury, or damage arising from the use or inability to use this service, including but not limited to service outages, operator errors, or CCTV limitations.</p>
                <p className="mb-2">By using this service, you acknowledge that you have read and understood these limitations.</p>
                <p>The service may be suspended or terminated at any time for maintenance, upgrades, or at E-SAF Ltd&apos;s discretion.</p>
              </>
            }
          />

          {/* Section 3: Acceptable Use */}
          <TermsSection
            title="3. Acceptable Use & Misuse Policy"
            scrolledToBottom={scrolled[2]}
            checked={checked[2]}
            onScrollToBottom={() => handleScrollToBottom(2)}
            onCheck={(v) => handleCheck(2, v)}
            content={
              <>
                <p className="mb-3 font-semibold">Use E-SAF Civic Responsibly</p>
                <p className="mb-2">E-SAF Civic is for <span className="font-bold">genuine personal safety concerns only</span>. The service must not be used for non-safety purposes, testing, pranks, or any malicious intent.</p>
                <p className="mb-2"><span className="font-semibold">Alert limits:</span> Each user is limited to a maximum of <span className="font-bold">2 alerts per 24-hour period</span>. This limit exists to prevent system abuse and ensure resources are available for genuine safety concerns.</p>
                <p className="mb-3 font-semibold">Graduated Sanctions for Misuse</p>
                <p className="mb-2">Alerts classified as false or malicious by control room operators will result in the following progressive sanctions:</p>
                <ul className="list-disc list-inside mb-2 space-y-1">
                  <li><span className="font-semibold">First offence:</span> Written warning via email</li>
                  <li><span className="font-semibold">Second offence:</span> Final warning via email</li>
                  <li><span className="font-semibold">Third offence:</span> Account restricted &mdash; reduced functionality</li>
                  <li><span className="font-semibold">Fourth offence:</span> Account suspended for 3 months</li>
                  <li><span className="font-semibold">Fifth offence or serious misuse:</span> Permanent account ban</li>
                </ul>
                <p className="mb-2">Serious misuse (including but not limited to coordinated false alerts, threats, or harassment of operators) may result in immediate permanent ban and referral to law enforcement.</p>
                <p className="mb-2">Sanctions are applied at the discretion of E-SAF Ltd and are final. Appeals may be submitted in writing to appeals@esaf.co.uk.</p>
                <p>By using this service, you agree to use it only for genuine safety concerns and accept the sanctions policy above.</p>
              </>
            }
          />
        </div>

        <div className="mt-6">
          <Button
            fullWidth
            size="lg"
            disabled={!allChecked}
            onClick={handleContinue}
          >
            Continue
          </Button>
          {!allChecked && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Please read and accept all three sections to continue
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
