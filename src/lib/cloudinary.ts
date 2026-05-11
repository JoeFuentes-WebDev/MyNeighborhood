import imageCompression from 'browser-image-compression'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

const PHOTO_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
}

const AVATAR_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
}

async function compress(file: File, options: typeof PHOTO_OPTIONS) {
  return imageCompression(file, options)
}

export async function uploadImage(file: File, folder: 'posts' | 'profiles'): Promise<string> {
  const compressed = await compress(file, PHOTO_OPTIONS)

  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', UPLOAD_PRESET!)
  formData.append('folder', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.secure_url as string
}

export async function uploadAvatar(file: File): Promise<string> {
  const compressed = await compress(file, AVATAR_OPTIONS)

  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', UPLOAD_PRESET!)
  formData.append('folder', 'avatars')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Avatar upload failed')
  const data = await res.json()
  return data.secure_url as string
}