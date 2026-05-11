'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, PlusCircle, Users, MessageCircle } from 'lucide-react'

const tabs = [
  { href: '/feed',      label: 'Feed',      Icon: Home },
  { href: '/events',    label: 'Events',    Icon: Calendar },
  { href: '/post/new',  label: 'Post',      Icon: PlusCircle, center: true },
  { href: '/neighbors', label: 'Neighbors', Icon: Users },
  { href: '/messages',  label: 'Messages',  Icon: MessageCircle },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon, center }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
                ${center ? 'relative -top-2' : ''}
                ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon
                size={center ? 32 : 22}
                strokeWidth={active ? 2 : 1.5}
                className={center ? 'text-gray-900' : ''}
              />
              <span className={`text-[10px] ${active ? 'font-medium' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
