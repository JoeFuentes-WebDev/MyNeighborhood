'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { PostCard } from '@/components/PostCard'
import { Illustration } from '@/components/Illustration'
import type { UserBuildingItem } from '../onboarding/page'
import { FEED_QUERY } from '@/graphql/queries'
import type { Post } from '@/types/post'

const TABS = ['All', 'Events', 'Marketplace', 'Discussion'] as const
type Tab = typeof TABS[number]

const TAB_TYPE: Record<Tab, string | undefined> = {
  All: undefined,
  Events: 'EVENT',
  Marketplace: 'MARKETPLACE',
  Discussion: 'DISCUSSION',
}

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>('All')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  const buildingId = mounted
    ? localStorage.getItem('neighbors_building') ?? ''
    : ''

  const { data, loading } = useQuery(FEED_QUERY, {
    variables: { buildingId, type: TAB_TYPE[tab] },
    skip: !buildingId,
  })

  const me = data?.me
  const currentBuilding = me?.buildings?.find(
    (ub: UserBuildingItem) => ub.building.id === buildingId
  )
  const buildingName = currentBuilding?.building?.name ?? 'Your building'
  const unitNumber = currentBuilding?.unit?.unitNumber ?? ''

  const initials = me?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2) ?? '?'

  const posts = data?.feed ?? []

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        buildingName={buildingName}
        unitLabel={unitNumber ? `Unit ${unitNumber}` : ''}
        avatarInitials={initials}
        avatarUrl={me?.avatarUrl}
        onAvatarClick={() => router.push('/profile')}
      />

      <div className="flex overflow-x-auto border-b border-gray-100 bg-white px-4 gap-0 sticky top-[57px] z-20">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 px-3 text-[12px] whitespace-nowrap border-b-2 transition-colors
              ${tab === t
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-3 pb-24">
        <button
          onClick={() => router.push('/post/new')}
          className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5 mb-3 text-[13px] text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-300">✏</span>
          Share something with the building...
        </button>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <Illustration variant="feed" className="w-full h-40" />
            <div className="text-center">
              <div className="text-[15px] font-medium text-gray-900 mb-1">
                Start the conversation
              </div>
              <div className="text-[13px] text-gray-500 leading-relaxed max-w-xs">
                You are the first one here. Post an intro, share a tip, or organize something fun.
              </div>
            </div>
            <button
              onClick={() => router.push('/post/new')}
              className="flex items-center gap-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl px-5 py-2.5 text-[13px] font-medium"
            >
              Make the first post
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post: Post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}