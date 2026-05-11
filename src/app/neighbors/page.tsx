'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { InterestTag } from '@/components/InterestTab'
import Image from 'next/image'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { NEIGHBORS_QUERY } from '@/graphql/queries'
import type { Neighbor } from '@/types'
import { getUnitNumber, getInitials } from '@/types/user'

function floorFromUnit(unitNumber: string): number {
  const match = unitNumber.match(/^(\d+)/)
  if (match) return parseInt(match[1])
  const letter = unitNumber.match(/^([A-Za-z]+)(\d+)/)
  if (letter) return parseInt(letter[2])
  return 0
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-blue-100 text-blue-800',
  'bg-red-100 text-red-800',
]

function avatarColor(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function NeighborsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set())
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  const buildingId = mounted
    ? localStorage.getItem('neighbors_building') ?? ''
    : ''

  const { data, loading } = useQuery(NEIGHBORS_QUERY, {
    variables: { buildingId },
    skip: !buildingId,
    onCompleted: (data) => {
      setFavoriteIds(new Set(data.myFavoriteIds))
    }
  })

  const neighbors: Neighbor[] = data?.neighbors ?? []
  const myInterests: string[] = data?.me?.interests ?? []
  const myId: string = data?.me?.id ?? ''

  const others = neighbors.filter(n => n.id !== myId)
  const useFloors = others.length > 10

  const byFloor = others.reduce((acc, n) => {
    const floor = floorFromUnit(getUnitNumber(n, buildingId))
    if (!acc[floor]) acc[floor] = []
    acc[floor].push(n)
    return acc
  }, {} as Record<number, Neighbor[]>)

  const floors = Object.keys(byFloor)
    .map(Number)
    .sort((a, b) => a - b)

  function toggleFloor(floor: number) {
    setExpandedFloors(prev => {
      const next = new Set(prev)
      if (next.has(floor)) { 
        next.delete(floor) 
      } else { 
        next.add(floor)
      }
      return next
    })
  }

  function sharedInterests(neighbor: Neighbor) {
    return neighbor.interests.filter(i => myInterests.includes(i))
  }

  function NeighborRow({ neighbor, indented = false }: { neighbor: Neighbor; indented?: boolean }) {
    const initials = getInitials(neighbor.name)
    const color = avatarColor(neighbor.name)
    const shared = sharedInterests(neighbor)
    const isFav = favoriteIds.has(neighbor.id)

    const handleMessageClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      router.push(`/messages/${neighbor.id}`)
    }

    return (
      <div
        onClick={() => router.push(`/neighbors/${neighbor.id}`)}
        className={`flex items-center gap-2 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
          ${indented ? 'pl-7 pr-4' : 'px-4'}`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 overflow-hidden ${color}`}>
          {neighbor.avatarUrl ? (
            <div className="relative w-7 h-7">
              <Image src={neighbor.avatarUrl} alt={neighbor.name} fill className="object-cover rounded-full" />
            </div>
          ) : initials}
        </div>

        <span className="text-[13px] font-medium text-gray-900 whitespace-nowrap">{neighbor.name}</span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">{getUnitNumber(neighbor, buildingId)}</span>

        <div className="flex gap-1 flex-1 overflow-hidden flex-wrap">
          {shared.map(i => <InterestTag key={i} interest={i} />)}
        </div>

        <button
          onClick={handleMessageClick}
          className="flex-shrink-0 p-1"
          aria-label="send message"
        >
          <i className={`ti ${isFav ? 'ti-message-filled' : 'ti-message'} text-[16px] ${isFav ? 'text-teal-600' : 'text-gray-300'}`} aria-hidden="true" />
        </button>
      </div>
    )
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Neighbors" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="Neighbors"
        unitLabel={`${others.length} residents`}
      />

      <div className="flex-1 max-w-lg mx-auto w-full pb-24 bg-white">

        {others.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 px-8 text-center">
            <div className="text-[15px] font-medium text-gray-900">No neighbors yet</div>
            <div className="text-[13px] text-gray-500 leading-relaxed">
              When other residents join your building they will appear here.
            </div>
          </div>
        )}

        {!useFloors && others.map(n => (
          <NeighborRow key={n.id} neighbor={n} />
        ))}

        {useFloors && floors.map(floor => {
          const floorNeighbors = byFloor[floor].sort((a, b) => {
            const aUnit = getUnitNumber(a, buildingId)
            const bUnit = getUnitNumber(b, buildingId)
            return aUnit.localeCompare(bUnit)
          })
          const favoritesOnFloor = floorNeighbors.filter(n => favoriteIds.has(n.id))
          const isExpanded = expandedFloors.has(floor)
          const showFavs = !isExpanded && favoritesOnFloor.length > 0
          const remaining = floorNeighbors.length - favoritesOnFloor.length

          return (
            <div key={floor}>
              <button
                onClick={() => toggleFloor(floor)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <span className="text-[12px] font-medium text-gray-600">
                  Floor {floor}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {floorNeighbors.length}
                  </span>
                  {isExpanded
                    ? <ChevronDown size={13} className="text-gray-400" />
                    : <ChevronRight size={13} className="text-gray-400" />
                  }
                </div>
              </button>

              {showFavs && favoritesOnFloor.map(n => (
                <NeighborRow key={n.id} neighbor={n} indented />
              ))}

              {showFavs && remaining > 0 && (
                <button
                  onClick={() => toggleFloor(floor)}
                  className="w-full text-left pl-7 py-1.5 text-[11px] text-gray-400 border-b border-gray-100 hover:text-gray-600"
                >
                  + {remaining} more on this floor
                </button>
              )}

              {isExpanded && floorNeighbors.map(n => (
                <NeighborRow key={n.id} neighbor={n} indented />
              ))}
            </div>
          )
        })}

      </div>
      <BottomNav />
    </div>
  )
}