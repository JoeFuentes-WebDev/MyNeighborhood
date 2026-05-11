'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import Image from 'next/image'

interface TopBarProps {
  buildingName?: string
  unitLabel?: string
  avatarInitials?: string
  avatarUrl?: string
  onAvatarClick?: () => void
  title?: string
  back?: boolean
  right?: React.ReactNode
}

export function TopBar({
  buildingName,
  unitLabel,
  avatarInitials,
  avatarUrl,
  onAvatarClick,
  title,
  back,
  right,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3">
      {avatarInitials ? (
        <button
          onClick={onAvatarClick}
          className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 text-xs font-medium flex items-center justify-center border-2 border-teal-300 flex-shrink-0"
        >
          {avatarUrl
            ? <Image src={avatarUrl} alt="avatar" width={32} height={32} className="object-cover" />
            : avatarInitials
          }
        </button>
      ) : back ? (
        <Link href=".." className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          ←
        </Link>
      ) : (
        <div className="w-8" />
      )}

      <div className="text-center flex-1 min-w-0">
        {buildingName ? (
          <>
            <div className="text-[15px] font-medium text-gray-900 truncate">{buildingName}</div>
            {unitLabel && <div className="text-[12px] text-gray-500">{unitLabel}</div>}
          </>
        ) : (
          <div className="text-[15px] font-medium text-gray-900">{title}</div>
        )}
      </div>

      {right ?? (
        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <Search size={20} strokeWidth={1.5} />
        </button>
      )}
    </header>
  )
}
