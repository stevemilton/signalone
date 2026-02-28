'use client'

import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
  dark?: boolean
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md', dark = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`
          relative ${maxWidth} w-full rounded-2xl p-6 shadow-2xl animate-slide-up
          ${dark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-900'}
        `}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
