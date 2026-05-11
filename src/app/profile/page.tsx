'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { Settings, X, Plus, Camera } from 'lucide-react'
import { uploadImage, uploadAvatar } from '@/lib/cloudinary'
import { InterestTag } from '@/components/InterestTab' 
import Image from 'next/image'
import type { ProfilePhoto } from '@/types'
import { useQuery, useMutation } from '@apollo/client'
import { ME_QUERY } from '@/graphql/queries'
import {
  UPDATE_PROFILE_MUTATION,
  UPLOAD_AVATAR_MUTATION,
  ADD_PROFILE_PHOTO_MUTATION,
  UPDATE_PHOTO_LABEL_MUTATION,
  DELETE_PHOTO_MUTATION,
} from '@/graphql/mutations'
import { safeFormat } from '@/lib/dates'


function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${value ? 'bg-teal-400' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [newInterest, setNewInterest] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [labelValue, setLabelValue] = useState('')
  const avatarRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const { data, loading, refetch } = useQuery(ME_QUERY)
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION)
  const [uploadAvatarMutation] = useMutation(UPLOAD_AVATAR_MUTATION)
  const [addProfilePhoto] = useMutation(ADD_PROFILE_PHOTO_MUTATION)
  const [updatePhotoLabel] = useMutation(UPDATE_PHOTO_LABEL_MUTATION)
  const [deletePhoto] = useMutation(DELETE_PHOTO_MUTATION)

  const me = data?.me
  const initials = me?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'
  const canAddPhoto = (me?.photos?.length ?? 0) < 3

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(file)
      await uploadAvatarMutation({ variables: { url } })
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleAddPhoto(file: File) {
    setUploadingPhoto(true)
    try {
      const url = await uploadImage(file, 'profiles')
      await addProfilePhoto({ variables: { url } })
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSaveLabel(id: string) {
    await updatePhotoLabel({ variables: { id, label: labelValue } })
    setEditingLabel(null)
    await refetch()
  }

  async function handleDeletePhoto(id: string) {
    await deletePhoto({ variables: { id } })
    await refetch()
  }

  async function handleToggle(field: string, value: boolean) {
    await updateProfile({ variables: { [field]: value } })
    await refetch()
  }

  async function addInterest() {
    const trimmed = newInterest.trim().toLowerCase()
    if (!trimmed || me?.interests?.includes(trimmed)) return
    const updated = [...(me?.interests ?? []), trimmed]
    await updateProfile({ variables: { interests: updated } })
    setNewInterest('')
    await refetch()
  }

  async function removeInterest(interest: string) {
    const updated = me?.interests?.filter((i: string) => i !== interest) ?? []
    await updateProfile({ variables: { interests: updated } })
    await refetch()
  }

  function handleLogout() {
    localStorage.removeItem('neighbors_token')
    localStorage.removeItem('neighbors_building')
    router.push('/onboarding')
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="My profile" back />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="My profile"
        back
        right={
          <button onClick={() => setShowSettings(s => !s)} className="text-gray-400 hover:text-gray-600">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full pb-24">

        {/* Hero */}
        <div className="bg-white border-b border-gray-100 px-4 py-5 flex flex-col items-center gap-2">
          <div className="relative">
            <button
              onClick={() => avatarRef.current?.click()}
              className="w-16 h-16 rounded-full bg-teal-100 text-teal-800 text-xl font-medium flex items-center justify-center border-2 border-teal-300 overflow-hidden"
            >
              {uploadingAvatar ? (
                <span className="text-[10px] text-teal-600">...</span>
              ) : me?.avatarUrl ? (
                <Image src={me.avatarUrl} alt="avatar" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm"
            >
              <Camera size={10} className="text-gray-500" />
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
              }}
            />
          </div>
          <div className="text-[17px] font-medium text-gray-900">{me?.name}</div>
          <div className="text-[13px] text-gray-500">
            Unit {me?.buildings?.[0]?.unit?.unitNumber} · {me?.buildings?.[0]?.building?.name} · Member since {safeFormat(me?.joinedAt, 'MMMM yyyy')}
          </div>
        </div>

        {/* Profile photos */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">
            Photos ({me?.photos?.length ?? 0}/3)
          </div>
          <div className="flex gap-3">
            {me?.photos?.map((photo: ProfilePhoto) => (
              <div key={photo.id} className="flex-1 flex flex-col gap-1.5">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                  <Image
                    src={photo.url}
                    alt={photo.label ?? ''}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
                {editingLabel === photo.id ? (
                  <input
                    autoFocus
                    value={labelValue}
                    onChange={e => setLabelValue(e.target.value)}
                    onBlur={() => handleSaveLabel(photo.id)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveLabel(photo.id)}
                    className="text-[11px] text-center border-b border-teal-300 outline-none bg-transparent w-full"
                    placeholder="Add label..."
                  />
                ) : (
                  <button
                    onClick={() => { setEditingLabel(photo.id); setLabelValue(photo.label ?? '') }}
                    className="text-[11px] text-center text-gray-400 hover:text-gray-600 truncate"
                  >
                    {photo.label || 'tap to label'}
                  </button>
                )}
              </div>
            ))}

            {canAddPhoto && (
              <div className="flex-1 flex flex-col gap-1.5">
                <button
                  onClick={() => photoRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-300 flex flex-col items-center justify-center gap-1 text-gray-300 transition-colors"
                >
                  {uploadingPhoto ? (
                    <span className="text-[10px] text-gray-400">Uploading...</span>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span className="text-[10px]">add photo</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-center text-gray-300">—</span>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleAddPhoto(file)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">Interests</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {me?.interests?.map((interest: string) => (
              <div key={interest} className="flex items-center gap-1">
                <InterestTag interest={interest} />
                <button onClick={() => removeInterest(interest)} className="text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInterest()}
              placeholder="Add an interest..."
              className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-gray-200 bg-white"
            />
            <button
              onClick={addInterest}
              disabled={!newInterest.trim()}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">Privacy</div>
          <div className="space-y-4">
            {[
              { field: 'showPhotos',    label: 'Show my photos',        sub: 'Visible to building residents' },
              { field: 'showInterests', label: 'Show my interests',     sub: 'Visible to building residents' },
              { field: 'showUnit',      label: 'Show my unit number',   sub: 'Always shown on your posts' },
              { field: 'allowDMs',      label: 'Allow direct messages', sub: 'From building residents only' },
            ].map(({ field, label, sub }) => (
              <div key={field} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] text-gray-900">{label}</div>
                  <div className="text-[11px] text-gray-400">{sub}</div>
                </div>
                <Toggle
                  value={me?.[field as keyof typeof me] as boolean ?? true}
                  onChange={v => handleToggle(field, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="bg-white border-b border-gray-100 px-4 py-4">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">Settings</div>
            <div className="space-y-1">
              <div className="text-[13px] text-gray-500 py-2 border-b border-gray-50">
                <span className="text-gray-400 text-[11px] uppercase tracking-wide block mb-0.5">Email</span>
                {me?.email}
              </div>
              <div className="text-[13px] text-gray-500 py-2 border-b border-gray-50">
                <span className="text-gray-400 text-[11px] uppercase tracking-wide block mb-0.5">Building</span>
                {me?.buildings?.[0]?.building?.name}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-[13px] text-red-500 py-3 hover:text-red-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}