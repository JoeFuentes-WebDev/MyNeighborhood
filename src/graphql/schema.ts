import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Building {
    id: ID!
    name: String
    address: String!
    city: String!
    state: String!
    zip: String!
    createdAt: String!
    units: [Unit!]!
    members: [UserBuilding!]!
    posts: [Post!]!
  }

  type Unit {
    id: ID!
    unitNumber: String!
    building: Building!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
    photos: [ProfilePhoto!]!
    buildings: [UserBuilding!]!
    role: Role!
    joinedAt: String!
    showPhotos: Boolean!
    showInterests: Boolean!
    showUnit: Boolean!
    allowDMs: Boolean!
    interests: [String!]!
    posts: [Post!]!
    isFavorited: Boolean!
  }

  type UserBuilding {
    id: ID!
    user: User!
    building: Building!
    unit: Unit!
    joinedAt: String!
  }  

  type ProfilePhoto {
    id: ID!
    url: String!
    label: String
    order: Int!
    createdAt: String!
  }

  enum Role {
    RESIDENT
    BUILDING_ADMIN
  }

  type Post {
    id: ID!
    author: User!
    building: Building!
    type: PostType!
    title: String!
    body: String!
    createdAt: String!
    images: [PostImage!]!
    event: Event
    price: Float
    isFree: Boolean
    condition: String
    rsvpCount: Int
    myRsvp: RSVPStatus
  }

  enum PostType {
    ANNOUNCEMENT
    EVENT
    MARKETPLACE
    DISCUSSION
  }

  type PostImage {
    id: ID!
    url: String
    order: Int!
    expiresAt: String!
    expiredAt: String
    daysUntilExpiry: Int
  }

  type Event {
    id: ID!
    location: String
    startsAt: String!
    endsAt: String
    rsvps: [RSVP!]!
    goingCount: Int!
  }

  type RSVP {
    id: ID!
    user: User!
    status: RSVPStatus!
  }

  enum RSVPStatus {
    GOING
    MAYBE
    NOT_GOING
  }

  type DirectMessage {
    id: ID!
    from: User!
    to: User!
    body: String!
    sentAt: String!
    read: Boolean!
  }

  type Conversation {
    participant: User!
    lastMessage: DirectMessage!
    unreadCount: Int!
  }

  type AuthPayload {
    token: String
    user: User!
  }

  type Query {
    me: User
    myBuildings: [UserBuilding!]!
    myFavoriteIds: [ID!]!
    building(id: ID!): Building
    feed(buildingId: ID!, type: PostType, limit: Int, offset: Int): [Post!]!
    post(id: ID!): Post
    neighbors(buildingId: ID!): [User!]!
    neighbor(id: ID!): User
    conversations: [Conversation!]!
    messages(withUserId: ID!): [DirectMessage!]!
    events(buildingId: ID!): [Post!]!
  }

  type Mutation {
    register(
      name: String!
      email: String!
      password: String!
      address: String!
      unitNumber: String!
      zip: String!
    ): AuthPayload!

    leaveBuilding(buildingId: ID!): Boolean!

    login(email: String!, password: String!): AuthPayload!

    createPost(
      buildingId: ID!
      type: PostType!
      title: String!
      body: String!
      startsAt: String
      endsAt: String
      location: String
      price: Float
      isFree: Boolean
      condition: String
    ): Post!

    rsvp(eventId: ID!, status: RSVPStatus!): RSVP!

    sendMessage(toId: ID!, body: String!): DirectMessage!

    markMessagesRead(fromId: ID!): Boolean!

    updateProfile(
      name: String
      interests: [String!]
      showPhotos: Boolean
      showInterests: Boolean
      showUnit: Boolean
      allowDMs: Boolean
    ): User!

    uploadPostImage(postId: ID!, url: String!, order: Int!): PostImage!

    uploadAvatar(url: String!): User!
    addProfilePhoto(url: String!, label: String): ProfilePhoto!
    updateProfilePhotoLabel(id: ID!, label: String!): ProfilePhoto!
    deleteProfilePhoto(id: ID!): Boolean!

    addFavorite(favoritedId: ID!): Boolean!
    removeFavorite(favoritedId: ID!): Boolean!
  }
`
