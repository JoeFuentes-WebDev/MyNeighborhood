import type { User } from './user'

export interface DirectMessage {
  id: string
  from: Pick<User, 'id' | 'name' | 'avatarUrl'>
  to: Pick<User, 'id' | 'name' | 'avatarUrl'>
  body: string
  sentAt: string
  read: boolean
}

export interface Conversation {
  participant: Pick<User, 'id' | 'name' | 'avatarUrl'>
  lastMessage: DirectMessage
  unreadCount: number
}