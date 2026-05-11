'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { MESSAGES_QUERY, NEIGHBOR_QUERY } from '@/graphql/queries'
import { SEND_MESSAGE_MUTATION, MARK_MESSAGES_READ_MUTATION } from '@/graphql/mutations'
import type { DirectMessage } from '@/types'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { safeTimeAgo } from '@/lib/dates'

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2)

export default function MessageThreadPage() {
  const params = useParams()
  const router = useRouter()
  const withUserId = params.id as string
  const [body, setBody] = useState('')
  const [myId, setMyId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.resolve().then(() => {
      const id = localStorage.getItem('neighbors_user') ?? ''
      setMyId(id)
    })
  }, [])

  const { data: neighborData } = useQuery(NEIGHBOR_QUERY, {
    variables: { id: withUserId },
  })

  const { data, loading, refetch } = useQuery(MESSAGES_QUERY, {
    variables: { withUserId },
    pollInterval: 5000,
  })

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION)
  const [markRead] = useMutation(MARK_MESSAGES_READ_MUTATION)

  const neighbor = neighborData?.neighbor;
  const messages: DirectMessage[] = useMemo(
    () => data?.messages ?? [],
    [data?.messages]
  )

  useEffect(() => {
    if (messages.length > 0 && withUserId) {
      markRead({ variables: { fromId: withUserId } })
    }
  }, [messages.length, withUserId, markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    setBody('')
    await sendMessage({ variables: { toId: withUserId, body: trimmed } })
    await refetch()
    inputRef.current?.focus()
  }

  const initials = neighbor ? getInitials(neighbor.name) : '?'

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar
        title={neighbor?.name ?? '...'}
        back
        right={
          neighbor ? (
            <button
              onClick={() => router.push(`/neighbors/${withUserId}`)}
              className="flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 text-xs font-medium flex items-center justify-center overflow-hidden">
                {neighbor.avatarUrl ? (
                  <div className="relative w-8 h-8">
                    <Image
                      src={neighbor.avatarUrl}
                      alt={neighbor.name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                ) : initials}
              </div>
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center pt-8">
            <div className="text-[13px] text-gray-400">Loading...</div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-12 text-center">
            <div className="text-[14px] font-medium text-gray-900">
              Start a conversation
            </div>
            <div className="text-[12px] text-gray-400">
              Say hi to {neighbor?.name?.split(' ')[0] ?? 'your neighbor'}
            </div>
          </div>
        )}

        {messages.map((msg: DirectMessage, i: number) => {
          const isMe = msg.from.id === myId
          const showTime = i === messages.length - 1 ||
            new Date(messages[i + 1].sentAt).getTime() -
            new Date(msg.sentAt).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-[9px] font-medium flex items-center justify-center flex-shrink-0 overflow-hidden mb-0.5">
                    {msg.from.avatarUrl ? (
                      <div className="relative w-6 h-6">
                        <Image
                          src={msg.from.avatarUrl}
                          alt={msg.from.name}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    ) : getInitials(msg.from.name)}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed
                    ${isMe
                      ? 'bg-teal-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                    }`}
                >
                  {msg.body}
                </div>
              </div>
              {showTime && (
                <div className="text-[10px] text-gray-400 mt-1 px-2">
                  {safeTimeAgo(msg.sentAt)}
                </div>
              )}
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <input
          ref={inputRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Message ${neighbor?.name?.split(' ')[0] ?? 'neighbor'}...`}
          className="flex-1 text-[13px] px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 outline-none focus:border-teal-300 focus:bg-white transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
        >
          <Send size={16} className="text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}