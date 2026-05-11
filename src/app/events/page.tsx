'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { EVENTS_QUERY } from '@/graphql/queries'
import { Illustration } from '@/components/Illustration'
import type { Post } from '@/types'
import { POST_TYPE_STYLES } from '@/types/post'
import { safeTimeAgo, safeFormat, safeIsPast } from '@/lib/dates'

const isUpcoming = (post: Post): boolean =>
  post.event ? !safeIsPast(post.event.startsAt) : false

interface EventCardProps {
  post: Post
  onClick: () => void
}

const EventCard = ({ post, onClick }: EventCardProps) => {
  const badge = POST_TYPE_STYLES.EVENT

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
            {post.event && (
              <span className="text-[11px] text-teal-700 font-medium">
                {safeFormat(post.event.startsAt, 'EEE MMM d · h:mm a')}
              </span>
            )}
          </div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-1">{post.title}</h3>
          <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{post.body}</p>
          {post.event?.location && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[11px] text-gray-400">{post.event.location}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-[13px] font-medium text-teal-700">
            {post.event?.goingCount ?? 0} going
          </div>
          <div className="text-[11px] text-gray-400">
            {safeTimeAgo(post.createdAt)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-medium flex items-center justify-center">
          {post.author.name.charAt(0)}
        </div>
        <span className="text-[12px] text-gray-500">{post.author.name}</span>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  const buildingId = mounted
    ? localStorage.getItem('neighbors_building') ?? ''
    : ''

  const { data, loading } = useQuery(EVENTS_QUERY, {
    variables: { buildingId },
    skip: !buildingId,
  })

  const events: Post[] = data?.events ?? []
  const upcoming = events.filter(isUpcoming)
  const past = events.filter(e => !isUpcoming(e))

  const handleEventClick = (id: string) => {
    router.push(`/events/${id}`)
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Events" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="Events"
        right={
          <button
            onClick={() => router.push('/post/new')}
            className="text-[13px] font-medium text-teal-700"
          >
            + Event
          </button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-3">

        {events.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <Illustration variant="events" className="w-full h-40" />
            <div className="text-center">
              <div className="text-[15px] font-medium text-gray-900 mb-1">No events yet</div>
              <div className="text-[13px] text-gray-500 leading-relaxed max-w-xs">
                Organize something for the building. A rooftop hang, a bulk order, anything.
              </div>
            </div>
            <button
              onClick={() => router.push('/post/new')}
              className="flex items-center gap-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl px-5 py-2.5 text-[13px] font-medium"
            >
              Plan something
            </button>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">
              Upcoming
            </div>
            <div className="space-y-3">
              {upcoming.map(post => (
                <EventCard
                  key={post.id}
                  post={post}
                  onClick={() => handleEventClick(post.id)}
                />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">
              Past
            </div>
            <div className="space-y-3 opacity-60">
              {past.map(post => (
                <EventCard
                  key={post.id}
                  post={post}
                  onClick={() => handleEventClick(post.id)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}