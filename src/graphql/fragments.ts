import { gql } from '@apollo/client'

export const POST_IMAGE_FIELDS = gql`
  fragment PostImageFields on PostImage {
    id
    url
    order
    expiresAt
    daysUntilExpiry
  }
`

export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    id
    location
    startsAt
    endsAt
    goingCount
    rsvps {
      id
      status
      user { id name avatarUrl }
    }
  }
`

export const POST_FIELDS = gql`
  fragment PostFields on Post {
    id
    type
    title
    body
    createdAt
    price
    isFree
    condition
    rsvpCount
    author { id name avatarUrl }
    images { ...PostImageFields }
    event { ...EventFields }
  }
  ${POST_IMAGE_FIELDS}
  ${EVENT_FIELDS}
`

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    avatarUrl
    joinedAt
    role
    showPhotos
    showInterests
    showUnit
    allowDMs
    interests
    isFavorited
    photos { id url label order }
    buildings {
      id
      building { id name address zip }
      unit { unitNumber }
    }
  }
`

export const NEIGHBOR_FIELDS = gql`
  fragment NeighborFields on User {
    id
    name
    avatarUrl
    interests
    allowDMs
    isFavorited
    buildings {
      unit { unitNumber }
      building { id }
    }
  }
`

export const MESSAGE_FIELDS = gql`
  fragment MessageFields on DirectMessage {
    id
    body
    sentAt
    read
    from { id name avatarUrl }
    to { id name avatarUrl }
  }
`

export const CONVERSATION_FIELDS = gql`
  fragment ConversationFields on Conversation {
    participant { id name avatarUrl }
    unreadCount
    lastMessage { ...MessageFields }
  }
  ${MESSAGE_FIELDS}
`