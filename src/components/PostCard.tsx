'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import type { Post } from '@/types'
import { POST_TYPE_STYLES } from '@/types/post'
import { safeTimeAgo, safeFormat } from '@/lib/dates'

interface PostCardProps extends Post {
  pinned?: boolean
}

export const PostCard = (props: PostCardProps) => {
  const {
    id, type, title, body, createdAt, author,
    images, event, price, isFree, condition,
    pinned = false,
  } = props

  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const badge = POST_TYPE_STYLES[type]

  const expiringImages = images.filter(
    img => img.url && img.daysUntilExpiry !== null && img.daysUntilExpiry <= 10
  )

  const visibleImages = expanded ? images : images.slice(0, 2)

  const handleClick = () => {
    if (type === 'EVENT') {
      router.push(`/events/${id}`)
      return
    }
    setExpanded(e => !e)
  }

  const handleMessagePoster = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/messages/${author.id}`)
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/neighbors/${author.id}`)
  }

  return (
    <article
      onClick={handleClick}
      className={`bg-white rounded-xl border cursor-pointer transition-colors
        ${pinned
          ? 'border-l-2 border-l-blue-400 border-t-gray-100 border-r-gray-100 border-b-gray-100 rounded-l-none'
          : 'border-gray-100 hover:bg-gray-50'
        }`}
    >
      <div className="p-3">

        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
          {type !== 'EVENT' && (
            <span className="text-gray-300 flex-shrink-0">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>

        <h3 className="text-[13px] font-medium text-gray-900 mb-1">{title}</h3>

        <p className={`text-[12px] text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {body}
        </p>

        {type === 'EVENT' && event && (
          <div className="mt-1.5 text-[11px] text-teal-700 font-medium">
            {safeFormat(event.startsAt, 'EEE MMM d · h:mm a')}
            {event.location && ` · ${event.location}`}
          </div>
        )}

        {type === 'MARKETPLACE' && expanded && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-900">
              {isFree ? 'Free' : price ? `$${price}` : '—'}
            </span>
            {condition && (
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {condition}
              </span>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {visibleImages.map(img => (
              <div
                key={img.id}
                className="w-14 h-11 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative"
              >
                {img.url ? (
                  <Image src={img.url} alt="" fill className="object-cover" />
                ) : (
                  <span className="text-[9px] text-gray-400 text-center px-1">Expired</span>
                )}
              </div>
            ))}
            {!expanded && images.length > 2 && (
              <div className="w-14 h-11 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] text-gray-400">+{images.length - 2}</span>
              </div>
            )}
          </div>
        )}

        {expiringImages.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
            <Clock size={10} />
            Images expire in {expiringImages[0].daysUntilExpiry} days
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
          <button
            onClick={handleAuthorClick}
            className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-medium flex items-center justify-center flex-shrink-0"
          >
            {author.name.charAt(0)}
          </button>
          <button
            onClick={handleAuthorClick}
            className="text-[12px] font-medium text-gray-700 hover:text-teal-700 transition-colors"
          >
            {author.name}
          </button>
          <span className="text-[11px] text-gray-400 ml-auto">
            {safeTimeAgo(createdAt)}
          </span>
        </div>

        {expanded && type !== 'EVENT' && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
            <button
              onClick={handleMessagePoster}
              className="flex items-center gap-1.5 text-[12px] text-teal-700 font-medium"
            >
              <MessageCircle size={14} />
              Message {author.name.split(' ')[0]}
            </button>
          </div>
        )}

      </div>
    </article>
  )
}