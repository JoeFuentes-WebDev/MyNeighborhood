'use client'

import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { CONVERSATIONS_QUERY } from '@/graphql/queries'
import type { Conversation } from '@/types'
import Image from 'next/image'
import { safeTimeAgo } from '@/lib/dates'
import { Edit } from 'lucide-react'

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2)

export default function MessagesPage() {
  const router = useRouter()
  const { data, loading } = useQuery(CONVERSATIONS_QUERY)
  const conversations: Conversation[] = data?.conversations ?? []

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="Messages"
        right={
          <button
            onClick={() => router.push('/neighbors')}
            className="text-gray-400 hover:text-gray-600"
          >
            <Edit size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full bg-white pb-24">
        {loading && (
          <div className="space-y-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 px-8 text-center">
            <div className="text-[15px] font-medium text-gray-900">No messages yet</div>
            <div className="text-[13px] text-gray-500 leading-relaxed">
              Find a neighbor and tap the message icon to start a conversation.
            </div>
            <button
              onClick={() => router.push('/neighbors')}
              className="mt-2 text-[13px] font-medium text-teal-700 border border-teal-200 bg-teal-50 px-4 py-2 rounded-xl"
            >
              Browse neighbors
            </button>
          </div>
        )}

        {!loading && conversations.map((convo: Conversation) => {
          const p = convo.participant
          const initials = getInitials(p.name)
          const isUnread = convo.unreadCount > 0
          const timeAgo = convo.lastMessage?.sentAt
            ? safeTimeAgo(convo.lastMessage.sentAt)
            : ''

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/messages/${p.id}`)}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 text-[13px] font-medium flex items-center justify-center overflow-hidden">
                  {p.avatarUrl ? (
                    <div className="relative w-10 h-10">
                      <Image src={p.avatarUrl} alt={p.name} fill className="object-cover rounded-full" />
                    </div>
                  ) : initials}
                </div>
                {isUnread && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-[13px] ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {p.name}
                  </span>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                    {timeAgo}
                  </span>
                </div>
                <div className={`text-[12px] truncate mt-0.5 ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {convo.lastMessage?.body ?? ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}