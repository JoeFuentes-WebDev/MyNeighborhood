import { gql } from '@apollo/client'
import {
  POST_FIELDS,
  USER_FIELDS,
  NEIGHBOR_FIELDS,
  MESSAGE_FIELDS,
  CONVERSATION_FIELDS,
} from './fragments'

export const ME_QUERY = gql`
  query Me {
    me { ...UserFields }
  }
  ${USER_FIELDS}
`

export const MY_BUILDINGS_QUERY = gql`
  query MyBuildings {
    myBuildings {
      id
      building { id name address zip }
      unit { unitNumber }
    }
  }
`

export const MY_FAVORITE_IDS_QUERY = gql`
  query MyFavoriteIds {
    myFavoriteIds
  }
`

export const FEED_QUERY = gql`
  query Feed($buildingId: ID!, $type: PostType) {
    feed(buildingId: $buildingId, type: $type) { ...PostFields }
    me {
      id name avatarUrl
      buildings {
        id
        building { id name }
        unit { unitNumber }
      }
    }
  }
  ${POST_FIELDS}
`

export const POST_QUERY = gql`
  query Post($id: ID!) {
    post(id: $id) { ...PostFields }
  }
  ${POST_FIELDS}
`

export const NEIGHBORS_QUERY = gql`
  query Neighbors($buildingId: ID!) {
    neighbors(buildingId: $buildingId) { ...NeighborFields }
    myFavoriteIds
    me { id interests }
  }
  ${NEIGHBOR_FIELDS}
`

export const NEIGHBOR_QUERY = gql`
  query Neighbor($id: ID!) {
    neighbor(id: $id) {
      ...UserFields
      posts { ...PostFields }
    }
  }
  ${USER_FIELDS}
  ${POST_FIELDS}
`

export const CONVERSATIONS_QUERY = gql`
  query Conversations {
    conversations { ...ConversationFields }
  }
  ${CONVERSATION_FIELDS}
`

export const MESSAGES_QUERY = gql`
  query Messages($withUserId: ID!) {
    messages(withUserId: $withUserId) { ...MessageFields }
  }
  ${MESSAGE_FIELDS}
`

export const EVENTS_QUERY = gql`
  query Events($buildingId: ID!) {
    events(buildingId: $buildingId) { ...PostFields }
  }
  ${POST_FIELDS}
`
export const BUILDING_QUERY = gql`
  query Building($id: ID!) {
    building(id: $id) {
      id
      name
      address
      zip
    }
  }
`