import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`

async function deleteFromCloudinary(url: string) {
  if (!url) return
  const publicId = url.split('/').pop()?.split('.')[0]
  if (!publicId) return
  await fetch(CLOUDINARY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
    }),
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const warningThreshold = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

  const toWarn = await prisma.postImage.findMany({
    where: {
      expiresAt: { lte: warningThreshold },
      warningAt: null,
      expiredAt: null,
      url: { not: null },
    },
    include: { post: { include: { author: true } } },
  })

  for (const img of toWarn) {
    await prisma.postImage.update({
      where: { id: img.id },
      data: { warningAt: now },
    })

    await prisma.notification.create({
      data: {
        userId: img.post.authorId,
        type: 'IMAGE_EXPIRING',
        payload: {
          postId: img.post.id,
          postTitle: img.post.title,
          expiresAt: img.expiresAt.toISOString(),
        },
      },
    })
  }

  const toExpire = await prisma.postImage.findMany({
    where: {
      expiresAt: { lte: now },
      expiredAt: null,
      url: { not: null },
    },
  })

  for (const img of toExpire) {
    if (img.url) await deleteFromCloudinary(img.url)
    await prisma.postImage.update({
      where: { id: img.id },
      data: { url: null, expiredAt: now },
    })
  }

  return NextResponse.json({
    warned: toWarn.length,
    expired: toExpire.length,
    timestamp: now.toISOString(),
  })
}
