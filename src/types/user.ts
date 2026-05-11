export interface Unit {
  id: string
  unitNumber: string
}

export interface Building {
  id: string
  name: string | null
  address: string
  city: string
  state: string
  zip: string
  createdAt: string
}

export interface UserBuilding {
  id: string
  building: Building
  unit: Unit
  joinedAt: string
}

export interface ProfilePhoto {
  id: string
  url: string
  label: string | null
  order: number
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  photos: ProfilePhoto[]
  buildings: UserBuilding[]
  role: 'RESIDENT' | 'BUILDING_ADMIN'
  joinedAt: string
  showPhotos: boolean
  showInterests: boolean
  showUnit: boolean
  allowDMs: boolean
  interests: string[]
  isFavorited: boolean
}

export interface Neighbor {
  id: string
  name: string
  avatarUrl: string | null
  buildings: {
    unit: { unitNumber: string }
    building: { id: string }
  }[]
  interests: string[]
  allowDMs: boolean
}

export function getUnitNumber(neighbor: Neighbor, buildingId: string): string {
  const membership = neighbor.buildings.find(b => b.building.id === buildingId)
  return membership?.unit.unitNumber ?? ''
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}