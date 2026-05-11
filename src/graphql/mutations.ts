import { gql } from '@apollo/client'
import { USER_FIELDS, POST_FIELDS, MESSAGE_FIELDS } from './fragments'

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id buildings { id building { id } } }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register(
    $name: String! $email: String! $password: String!
    $address: String! $unitNumber: String! $zip: String!
  ) {
    register(
      name: $name email: $email password: $password
      address: $address unitNumber: $unitNumber zip: $zip
    ) {
      token
      user { id buildings { id building { id } } }
    }
  }
`

export const LEAVE_BUILDING_MUTATION = gql`
  mutation LeaveBuilding($buildingId: ID!) {
    leaveBuilding(buildingId: $buildingId)
  }
`

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost(
    $buildingId: ID! $type: PostType! $title: String! $body: String!
    $startsAt: String $endsAt: String $location: String
    $price: Float $isFree: Boolean $condition: String
  ) {
    createPost(
      buildingId: $buildingId type: $type title: $title body: $body
      startsAt: $startsAt endsAt: $endsAt location: $location
      price: $price isFree: $isFree condition: $condition
    ) { ...PostFields }
  }
  ${POST_FIELDS}
`

export const RSVP_MUTATION = gql`
  mutation Rsvp($eventId: ID!, $status: RSVPStatus!) {
    rsvp(eventId: $eventId, status: $status) {
      id status
      user { id name }
    }
  }
`

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($toId: ID!, $body: String!) {
    sendMessage(toId: $toId, body: $body) { ...MessageFields }
  }
  ${MESSAGE_FIELDS}
`

export const MARK_MESSAGES_READ_MUTATION = gql`
  mutation MarkMessagesRead($fromId: ID!) {
    markMessagesRead(fromId: $fromId)
  }
`

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $interests: [String!]
    $showPhotos: Boolean
    $showInterests: Boolean
    $showUnit: Boolean
    $allowDMs: Boolean
  ) {
    updateProfile(
      interests: $interests
      showPhotos: $showPhotos
      showInterests: $showInterests
      showUnit: $showUnit
      allowDMs: $allowDMs
    ) { ...UserFields }
  }
  ${USER_FIELDS}
`

export const UPLOAD_AVATAR_MUTATION = gql`
  mutation UploadAvatar($url: String!) {
    uploadAvatar(url: $url) { id avatarUrl }
  }
`

export const ADD_PROFILE_PHOTO_MUTATION = gql`
  mutation AddProfilePhoto($url: String!, $label: String) {
    addProfilePhoto(url: $url, label: $label) {
      id url label order
    }
  }
`

export const UPDATE_PHOTO_LABEL_MUTATION = gql`
  mutation UpdateProfilePhotoLabel($id: ID!, $label: String!) {
    updateProfilePhotoLabel(id: $id, label: $label) {
      id label
    }
  }
`

export const DELETE_PHOTO_MUTATION = gql`
  mutation DeleteProfilePhoto($id: ID!) {
    deleteProfilePhoto(id: $id)
  }
`

export const ADD_FAVORITE_MUTATION = gql`
  mutation AddFavorite($favoritedId: ID!) {
    addFavorite(favoritedId: $favoritedId)
  }
`

export const REMOVE_FAVORITE_MUTATION = gql`
  mutation RemoveFavorite($favoritedId: ID!) {
    removeFavorite(favoritedId: $favoritedId)
  }
`

export const UPLOAD_POST_IMAGE_MUTATION = gql`
  mutation UploadPostImage($postId: ID!, $url: String!, $order: Int!) {
    uploadPostImage(postId: $postId, url: $url, order: $order) {
      id url order expiresAt
    }
  }
`