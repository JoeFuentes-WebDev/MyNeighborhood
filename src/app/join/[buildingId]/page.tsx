'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@apollo/client'
import { Illustration } from '@/components/Illustration'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const buildingId = params.buildingId as string

  const { data } = useQuery(BUILDING_QUERY, { variables: { id: buildingId } })
  const building = data?.building

  const handleJoin = () => {
    if (!building) return
    const params = new URLSearchParams({
      address: building.address,
      zip: building.zip,
      buildingId: building.id,
    })
    router.push(`/onboarding?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      <Illustration variant="onboarding" className="h-44 rounded-none" />

      <div className="flex-1 px-5 py-8 flex flex-col items-center text-center gap-6">
        <div>
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
            You've been invited to join
          </div>
          <h1 className="text-[24px] font-medium text-gray-900 mb-1">
            {building?.name ?? 'Your building'}
          </h1>
          <div className="text-[13px] text-gray-400">
            {building?.address} · {building?.zip}
          </div>
        </div>

        <div className="text-[13px] text-gray-500 leading-relaxed max-w-xs">
          Connect with your neighbors. Share what's happening. Build a real community where you live.
        </div>

        <button
          onClick={handleJoin}
          disabled={!building}
          className="w-full bg-teal-500 text-white rounded-xl py-3 text-[14px] font-medium disabled:opacity-40"
        >
          Join the building →
        </button>

        <div className="text-[11px] text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/onboarding')}
            className="text-teal-600 font-medium"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}