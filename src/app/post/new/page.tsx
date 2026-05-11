'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { X } from 'lucide-react'
import Image from 'next/image'
import { CREATE_POST_MUTATION, UPLOAD_POST_IMAGE_MUTATION } from '@/graphql/mutations'
import { uploadImage } from '@/lib/cloudinary'
import { FEED_QUERY } from '@/graphql/queries'

const POST_TYPES = [
  { value: '',              label: 'Select type...' },
  { value: 'DISCUSSION',   label: 'Discussion' },
  { value: 'EVENT',        label: 'Event' },
  { value: 'MARKETPLACE',  label: 'Marketplace' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
]

const CONDITIONS = ['New', 'Good', 'Fair']

interface UploadedImage {
  url: string
  order: number
}

export default function NewPostPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [condition, setCondition] = useState('Good')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION)
  const [uploadPostImage] = useMutation(UPLOAD_POST_IMAGE_MUTATION)

  const buildingId = typeof window !== 'undefined'
    ? localStorage.getItem('neighbors_building') ?? ''
    : ''

  const canSubmit = type && title && body &&
    (type !== 'EVENT' || startsAt) &&
    (type !== 'MARKETPLACE' || isFree || price)

  const handleAddImage = async (file: File) => {
    if (images.length >= 4) return
    setUploadingImage(true)
    try {
      const url = await uploadImage(file, 'posts')
      setImages(prev => [...prev, { url, order: prev.length }])
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (order: number) => {
    setImages(prev =>
      prev
        .filter(img => img.order !== order)
        .map((img, i) => ({ ...img, order: i }))
    )
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      const { data } = await createPost({
        variables: {
          buildingId,
          type,
          title,
          body,
          startsAt: startsAt || undefined,
          location: location || undefined,
          price: price ? parseFloat(price) : undefined,
          isFree: isFree || undefined,
          condition: condition || undefined,
        },
        refetchQueries: [
          { query: FEED_QUERY, variables: { buildingId } },
          { query: FEED_QUERY, variables: { buildingId, type: 'EVENT' } },
          { query: FEED_QUERY, variables: { buildingId, type: 'MARKETPLACE' } },
          { query: FEED_QUERY, variables: { buildingId, type: 'DISCUSSION' } },
        ]
      })

      const postId = data.createPost.id

      for (const img of images) {
        await uploadPostImage({
          variables: { postId, url: img.url, order: img.order }
        })
      }

      router.push('/feed')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="New post"
        back
        right={
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading || uploadingImage}
            className={`text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors
              ${canSubmit && !loading && !uploadingImage
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-gray-300 cursor-not-allowed'}`}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Type <span className="text-red-400">*</span>
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className={`w-full text-[13px] px-3 py-2.5 rounded-lg border bg-white transition-colors
              ${type
                ? 'border-teal-300 text-teal-800 bg-teal-50'
                : 'border-gray-200 text-gray-400'}`}
          >
            {POST_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give it a clear title..."
            className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Details, context, anything helpful..."
            rows={4}
            className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200 bg-white resize-none leading-relaxed"
          />
        </div>

        {type === 'EVENT' && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-3">
            <div className="text-[11px] font-medium text-teal-700 uppercase tracking-wide">
              Event details
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">
                  Date & time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-teal-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Rooftop deck"
                  className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-teal-200 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {type === 'MARKETPLACE' && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-3">
            <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
              Listing details
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Price <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={isFree ? '' : price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="$0.00"
                  disabled={isFree}
                  className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-amber-200 bg-white disabled:opacity-40"
                />
                <button
                  onClick={() => setIsFree(f => !f)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] whitespace-nowrap transition-colors
                    ${isFree
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'border-amber-200 bg-white text-gray-500'}`}
                >
                  <span className={`w-7 h-4 rounded-full relative transition-colors ${isFree ? 'bg-teal-400' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isFree ? 'right-0.5' : 'left-0.5'}`} />
                  </span>
                  Free
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Condition</label>
              <div className="flex gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={`flex-1 py-2 text-[11px] rounded-lg border transition-colors
                      ${condition === c
                        ? 'bg-teal-50 text-teal-800 border-teal-300'
                        : 'border-amber-200 bg-white text-gray-500'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Photos (optional, max 4)
          </label>
          <div className="flex gap-2 flex-wrap">
            {images.map(img => (
              <div
                key={img.order}
                className="relative w-14 h-11 rounded-lg overflow-hidden border border-gray-200"
              >
                <Image src={img.url} alt="" fill className="object-cover" />
                <button
                  onClick={() => handleRemoveImage(img.order)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X size={8} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="w-14 h-11 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 text-gray-300 hover:border-gray-300 transition-colors disabled:opacity-40"
              >
                {uploadingImage
                  ? <span className="text-[9px]">...</span>
                  : <span className="text-[18px]">+</span>
                }
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleAddImage(file)
              e.target.value = ''
            }}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            Images are removed after 90 days.
          </p>
        </div>

      </div>
    </div>
  )
}