export interface PostImage {
  id: string
  url: string | null
  order: number
  expiresAt: string
  daysUntilExpiry: number | null
}

export interface EventDetail {
  id: string
  location: string | null
  startsAt: string
  endsAt: string | null
  goingCount: number
  rsvps: RSVP[]
}

export interface RSVP {
  id: string
  status: 'GOING' | 'MAYBE' | 'NOT_GOING'
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export type PostType = 'ANNOUNCEMENT' | 'EVENT' | 'MARKETPLACE' | 'DISCUSSION'

export interface PostAuthor {
  id: string
  name: string
  avatarUrl?: string | null
}

export interface Post {
  id: string
  type: PostType
  title: string
  body: string
  createdAt: string
  author: PostAuthor
  images: PostImage[]
  event: EventDetail | null
  price: number | null
  isFree: boolean | null
  condition: string | null
  rsvpCount: number | null
  myRsvp: 'GOING' | 'MAYBE' | 'NOT_GOING' | null
}

export const POST_TYPE_STYLES: Record<PostType, { label: string; className: string; sectionColor: string }> = {
  ANNOUNCEMENT: {
    label: 'Announcement',
    className: 'bg-blue-50 text-blue-800',
    sectionColor: 'text-blue-700',
  },
  EVENT: {
    label: 'Event',
    className: 'bg-teal-50 text-teal-800',
    sectionColor: 'text-teal-700',
  },
  MARKETPLACE: {
    label: 'Marketplace',
    className: 'bg-amber-50 text-amber-800',
    sectionColor: 'text-amber-700',
  },
  DISCUSSION: {
    label: 'Discussion',
    className: 'bg-purple-50 text-purple-800',
    sectionColor: 'text-purple-700',
  },
}