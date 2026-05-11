'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { POST_QUERY } from '@/graphql/queries'
import { RSVP_MUTATION } from '@/graphql/mutations'
import type { Post } from '@/types'
import { safeFormat, safeIsPast } from '@/lib/dates'
import { MapPin, Calendar, Users } from 'lucide-react'

const formatEventDate = (startsAt: string, endsAt?: string | null): string => {
  const start = safeFormat(startsAt, 'EEEE, MMMM d · h:mm a')
  if (!endsAt) return start
  const end = safeFormat(endsAt, 'h:mm a')
  return `${start} – ${end}`
}

type RSVPStatus = 'GOING' | 'MAYBE' | 'NOT_GOING'

interface RsvpButtonProps {
  label: string
  status: RSVPStatus
  current: RSVPStatus | null
  onClick: (status: RSVPStatus) => void
  disabled: boolean
}

const RsvpButton = ({ label, status, current, onClick, disabled }: RsvpButtonProps) => {
  const isActive = current === status
  return (
    <button
      onClick={() => onClick(status)}
      disabled={disabled}
      className={`flex-1 py-2.5 text-[13px] font-medium rounded-xl border transition-colors
        ${isActive
          ? 'bg-teal-50 text-teal-800 border-teal-300'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
        }
        disabled:opacity-40`}
    >
      {label}
    </button>
  )
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [myRsvp, setMyRsvp] = useState<RSVPStatus | null>(null)

  const { data, loading } = useQuery(POST_QUERY, {
    variables: { id },
    onCompleted: (d) => {
      if (d?.post?.myRsvp) setMyRsvp(d.post.myRsvp)
    }
  })

  const [rsvp, { loading: rsvping }] = useMutation(RSVP_MUTATION)

  const post: Post | null = data?.post ?? null
  const event = post?.event ?? null
  const isPastEvent = event ? safeIsPast(event.startsAt) : false

  const handleRsvp = async (status: RSVPStatus) => {
    if (!event) return
    setMyRsvp(status)
    await rsvp({ variables: { eventId: event.id, status } })
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Event" back />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
      <BottomNav />
    </div>
  )

  if (!post || !event) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Event" back />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Event not found.</div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Event" back />

      <div className="flex-1 max-w-lg mx-auto w-full pb-24">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
              Event
            </span>
            {isPastEvent && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Past
              </span>
            )}
          </div>
          <h1 className="text-[20px] font-medium text-gray-900 mb-3">{post.title}</h1>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">
                {formatEventDate(event.startsAt, event.endsAt)}
              </span>
            </div>
            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-gray-600">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">
                {event.goingCount} going
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
            About
          </div>
          <p className="text-[13px] text-gray-700 leading-relaxed">{post.body}</p>
        </div>

        {/* Images */}
        {post.images.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-4 py-4">
            <div className="flex gap-2">
              {post.images.map(img => (
                img.url && (
                  <div key={img.id} className="w-20 h-16 rounded-lg overflow-hidden border border-gray-100 relative flex-shrink-0">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Organizer */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
            Organized by
          </div>
          <button
            onClick={() => router.push(`/neighbors/${post.author.id}`)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 text-[11px] font-medium flex items-center justify-center">
              {post.author.name.charAt(0)}
            </div>
            <span className="text-[13px] font-medium text-gray-900">{post.author.name}</span>
          </button>
        </div>

        {/* RSVP */}
        {!isPastEvent && (
          <div className="bg-white border-b border-gray-100 px-4 py-4">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">
              Are you going?
            </div>
            <div className="flex gap-2">
              <RsvpButton
                label="Going"
                status="GOING"
                current={myRsvp}
                onClick={handleRsvp}
                disabled={rsvping}
              />
              <RsvpButton
                label="Maybe"
                status="MAYBE"
                current={myRsvp}
                onClick={handleRsvp}
                disabled={rsvping}
              />
              <RsvpButton
                label="Can't go"
                status="NOT_GOING"
                current={myRsvp}
                onClick={handleRsvp}
                disabled={rsvping}
              />
            </div>
            {myRsvp && (
              <p className="text-[11px] text-gray-400 text-center mt-2">
                {myRsvp === 'GOING' ? "You're going!" : myRsvp === 'MAYBE' ? "You might go." : "You can't make it."}
              </p>
            )}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}