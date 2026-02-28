'use client'

export default function OfflinePage() {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        {/* Shield icon matching app branding */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 192 192"
          className="mx-auto"
          aria-hidden="true"
        >
          <path
            d="M 96 15.36 L 163.2 30.34 Q 163.2 35.25 163.2 40.15 L 163.2 86.89 Q 163.2 119.42 96 157.38 Q 28.8 119.42 28.8 86.89 L 28.8 40.15 Q 28.8 35.25 28.8 30.34 Z"
            fill="#1d4ed8"
          />
          <text
            x="96"
            y="104"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="54"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            S1
          </text>
        </svg>
      </div>

      <h1 className="text-xl font-bold text-slate-900 mb-2">You&apos;re offline</h1>
      <p className="text-sm text-slate-600 mb-8">
        Signal One needs an internet connection to contact your local control room. Please check your connection and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-800 active:bg-blue-900 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
