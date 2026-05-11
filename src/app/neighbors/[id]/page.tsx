'use client'

import { useQuery } from '@apollo/client'
import { useRouter, useParams } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { MessageCircle } from 'lucide-react'
import { PostCard } from '@/components/PostCard'
import Image from 'next/image'
import type { Post, ProfilePhoto } from '@/types'
import { NEIGHBOR_QUERY } from '@/graphql/queries'

const NOW = Date.now()

const calculateMonthsAgo = (joinedAt: string): number =>
  Math.floor((NOW - new Date(joinedAt).getTime()) / (30 * 24 * 60 * 60 * 1000))

export default function NeighborProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data, loading } = useQuery(NEIGHBOR_QUERY, { variables: { id } })
  const neighbor = data?.neighbor

  const initials = neighbor?.name?.split(' ')
    .map((n: string) => n[0]).join('').slice(0, 2) ?? '?'

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Neighbor" back />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </div>
  )

  const monthsAgo = neighbor?.joinedAt ? calculateMonthsAgo(neighbor.joinedAt) : 0

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={neighbor?.name ?? 'Neighbor'} back />

      <div className="flex-1 max-w-lg mx-auto w-full pb-24">

        {/* Hero */}
        <div className="bg-white border-b border-gray-100 px-4 py-5 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-800 text-xl font-medium flex items-center justify-center border-2 border-purple-200 overflow-hidden">
            {neighbor?.avatarUrl ? (
              <Image
                src={neighbor.avatarUrl}
                alt={neighbor.name}
                fill
                className="object-cover rounded-full"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="text-[17px] font-medium text-gray-900 text-center">
              {neighbor?.name}
            </div>
            <div className="text-[13px] text-gray-500 text-center mt-0.5">
              {neighbor?.showUnit ? `Unit ${neighbor?.unit?.unitNumber} · ` : ''}
              Member for {monthsAgo} month{monthsAgo !== 1 ? 's' : ''}
            </div>
          </div>

          {neighbor?.allowDMs && (
            <button
              onClick={() => router.push(`/messages/${neighbor.id}`)}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle size={16} strokeWidth={1.5} />
              Send message
            </button>
          )}
        </div>

        {/* Photos */}
        {neighbor?.showPhotos && neighbor?.photos?.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-4 py-4">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">Photos</div>
            <div className="flex gap-3">
              {neighbor.photos.map((photo: ProfilePhoto) => (
                <div key={photo.id} className="flex-1 flex flex-col gap-1.5">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                    <Image
                      src={photo.url}
                      alt={photo.label ?? ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {photo.label && (
                    <div className="text-[11px] text-center text-gray-400 truncate">
                      {photo.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {neighbor?.showInterests && neighbor?.interests?.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-4 py-4">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">Interests</div>
            <div className="flex flex-wrap gap-2">
              {neighbor.interests.map((interest: string) => (
                <span
                  key={interest}
                  className="text-[12px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent posts */}
        {neighbor?.posts?.length > 0 && (
          <div className="px-4 py-4">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">
              Recent posts
            </div>
            <div className="space-y-3">
              {neighbor.posts.slice(0, 3).map((post: Post) => (
                <PostCard
                  key={post.id}
                  {...post}
                />
              ))}
            </div>
          </div>
        )}

        {neighbor?.posts?.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-gray-400">
            No posts yet.
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}