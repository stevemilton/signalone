'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Card } from '@/components/shared/Card'

const MOCK_CAMERAS = [
  { id: '1', name: 'Stevenage Town Centre - High Street', status: 'online' as const },
  { id: '2', name: 'Stevenage Town Centre - Queensway', status: 'online' as const },
  { id: '3', name: 'Stevenage Railway Station - Entrance', status: 'online' as const },
  { id: '4', name: 'Stevenage Railway Station - Platform 1', status: 'online' as const },
  { id: '5', name: 'Stevenage Bus Interchange', status: 'online' as const },
  { id: '6', name: 'St Georges Way / Danestrete', status: 'online' as const },
  { id: '7', name: 'Lytton Way Underpass North', status: 'online' as const },
  { id: '8', name: 'Lytton Way Underpass South', status: 'offline' as const },
  { id: '9', name: 'The Forum - Main Entrance', status: 'online' as const },
  { id: '10', name: 'Westgate Centre - Car Park A', status: 'online' as const },
  { id: '11', name: 'Westgate Centre - Car Park B', status: 'online' as const },
  { id: '12', name: 'Fairlands Valley Park - Main Gate', status: 'online' as const },
  { id: '13', name: 'Fairlands Valley Park - Lake Path', status: 'online' as const },
  { id: '14', name: 'Gunnels Wood Road / Six Hills Way', status: 'online' as const },
  { id: '15', name: 'Roaring Meg Retail Park', status: 'online' as const },
  { id: '16', name: 'Leisure Park - Cinema Complex', status: 'online' as const },
  { id: '17', name: 'Leisure Park - Car Park', status: 'online' as const },
  { id: '18', name: 'Coreys Mill Lane / North Road', status: 'online' as const },
  { id: '19', name: 'Hitchin Road / Letchmore Road', status: 'offline' as const },
  { id: '20', name: 'Bedwell Crescent', status: 'online' as const },
  { id: '21', name: 'Monks Wood Way / Broadwater Crescent', status: 'online' as const },
  { id: '22', name: 'Popple Way / Chells Way', status: 'online' as const },
  { id: '23', name: 'Pin Green - Shopping Parade', status: 'online' as const },
  { id: '24', name: 'Shephall Green', status: 'online' as const },
  { id: '25', name: 'Broadhall Way / Monkswood Way', status: 'online' as const },
  { id: '26', name: 'Old Town - High Street North', status: 'online' as const },
  { id: '27', name: 'Old Town - High Street South', status: 'online' as const },
  { id: '28', name: 'Walkern Road / Rectory Lane', status: 'online' as const },
  { id: '29', name: 'Grace Way Underpass', status: 'online' as const },
  { id: '30', name: 'Martins Way / Scarborough Ave', status: 'online' as const },
  { id: '31', name: 'Symonds Green', status: 'online' as const },
  { id: '32', name: 'Chells Manor', status: 'online' as const },
  { id: '33', name: 'St Nicholas CE Primary - Pedestrian Crossing', status: 'online' as const },
  { id: '34', name: 'Bandley Hill Underpass', status: 'online' as const },
  { id: '35', name: 'York Road / London Road', status: 'online' as const },
  { id: '36', name: 'Almonds Lane / Sish Lane', status: 'online' as const },
  { id: '37', name: 'Corey Mill Lane / Webb Rise', status: 'online' as const },
  { id: '38', name: 'Rockingham Way / Todd Way', status: 'online' as const },
  { id: '39', name: 'Great Ashby - District Centre', status: 'online' as const },
  { id: '40', name: 'Great Ashby - Whitehorse Lane', status: 'online' as const },
  { id: '41', name: 'Poplars - Shopping Area', status: 'online' as const },
  { id: '42', name: 'Bedwell Park - Main Path', status: 'online' as const },
  { id: '43', name: 'King George V Playing Fields', status: 'online' as const },
  { id: '44', name: 'Ridlins Athletics Track', status: 'online' as const },
  { id: '45', name: 'Stevenage Arts & Leisure Centre', status: 'online' as const },
  { id: '46', name: 'Stevenage Swimming Centre', status: 'online' as const },
  { id: '47', name: 'Knebworth Park Road', status: 'online' as const },
  { id: '48', name: 'Woolenwick Junior School - Pedestrian Zone', status: 'online' as const },
]

export default function MapPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const onlineCameras = MOCK_CAMERAS.filter((c) => c.status === 'online')
  const offlineCameras = MOCK_CAMERAS.filter((c) => c.status === 'offline')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-10 pb-6 relative">
        <button
          onClick={() => router.push('/alert')}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-white text-center">CCTV Coverage</h1>
        <p className="text-blue-100 text-[14px] mt-1 text-center">
          {user?.safetyZone || user?.riskPostcode || 'Your safety zone'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-[100px]">
        {/* Stats */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-blue-700">{MOCK_CAMERAS.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total Cameras</p>
          </div>
          <div className="flex-1 bg-white border-2 border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-green-600">{onlineCameras.length}</p>
            <p className="text-xs text-slate-500 font-medium">Online</p>
          </div>
          <div className="flex-1 bg-white border-2 border-red-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-red-600">{offlineCameras.length}</p>
            <p className="text-xs text-slate-500 font-medium">Offline</p>
          </div>
        </div>

        {/* Planning Tip */}
        <Card variant="blue" className="mb-5">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold">Planning tip:</span> Where possible, plan your route to stay within camera coverage areas for maximum safety.
            </p>
          </div>
        </Card>

        {/* Camera List */}
        <div className="space-y-1.5">
          {MOCK_CAMERAS.map((camera) => (
            <div
              key={camera.id}
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl"
            >
              <span className="text-base flex-shrink-0">
                {camera.status === 'online' ? '📷' : '📷'}
              </span>
              <p className="text-xs text-slate-700 flex-1 leading-snug">{camera.name}</p>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                camera.status === 'online' ? 'bg-green-500' : 'bg-red-400'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
