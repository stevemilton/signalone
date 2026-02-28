'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { ensureSignedIn } from '@/lib/auth/ensure-signed-in'
import { uploadIdDocument } from '@/lib/firebase/storage-upload'

type DocumentType = 'passport' | 'driving-licence'
type VerificationState = 'select' | 'capture' | 'uploading' | 'submitted'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType | null>(null)
  const [state, setState] = useState<VerificationState>('select')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const selectDocType = (type: DocumentType) => {
    setDocType(type)
    setState('capture')
    // Trigger file input after state update
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) {
      // User cancelled the file picker — go back to select
      if (!file) setState('select')
      return
    }

    setFile(selected)
    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(selected)
  }

  const handleUpload = async () => {
    if (!file) return

    setState('uploading')
    setError(null)

    try {
      const uid = await ensureSignedIn()
      if (!uid) {
        setError('Unable to authenticate. Please try again.')
        setState('capture')
        return
      }

      const { promise } = uploadIdDocument(uid, file, setUploadProgress)
      const downloadUrl = await promise

      const idToken = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken()
      await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idDocumentUrl: downloadUrl }),
      })

      setState('submitted')
    } catch {
      setError('Upload failed. Please try again.')
      setState('capture')
    }
  }

  const handleRetake = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    router.push('/register/terms')
  }

  const docLabel = docType === 'passport' ? 'Passport' : 'Driving Licence'

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
        <p className="text-blue-100 text-[14px] mt-1">Upload a document for review</p>
      </div>

      {/* Hidden file input — always in DOM */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

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
                    Upload a photo of your document &mdash; an admin will review it.
                  </p>
                </div>
              </div>
            </Card>

            <p className="text-[13px] font-semibold text-slate-700 mb-3">Choose your document type</p>

            <div className="space-y-3">
              <button
                onClick={() => selectDocType('passport')}
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
                onClick={() => selectDocType('driving-licence')}
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
              <p className="text-xs text-slate-500">Your document is stored securely for admin review only</p>
            </div>
          </div>
        )}

        {state === 'capture' && (
          <div className="animate-fade-in">
            {error && (
              <p className="text-[13px] text-red-600 font-medium mb-4 text-center">{error}</p>
            )}

            {preview ? (
              <div className="text-center">
                <p className="text-[14px] font-semibold text-slate-700 mb-4">
                  Preview &mdash; {docLabel}
                </p>
                <div className="rounded-xl overflow-hidden border-2 border-slate-200 mb-6">
                  <img src={preview} alt="Document preview" className="w-full" />
                </div>
                <div className="space-y-3">
                  <Button fullWidth size="lg" onClick={handleUpload}>
                    Upload Document
                  </Button>
                  <Button fullWidth size="md" variant="secondary" onClick={handleRetake}>
                    Retake Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[14px] text-slate-600 mb-6">
                  Take a clear photo of your {docLabel.toLowerCase()}
                </p>
                <Button fullWidth size="lg" onClick={() => fileInputRef.current?.click()}>
                  Open Camera
                </Button>
                <button
                  onClick={() => { setState('select'); setDocType(null) }}
                  className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Choose a different document
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'uploading' && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-6" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Uploading your {docLabel}</h2>
            <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden mt-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{Math.round(uploadProgress)}%</p>
          </div>
        )}

        {state === 'submitted' && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Document Submitted for Review</h2>
            <p className="text-[14px] text-slate-500 mb-8">
              Your {docLabel.toLowerCase()} has been uploaded. An admin will review it shortly.
              You&apos;ll be notified once verification is complete.
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
