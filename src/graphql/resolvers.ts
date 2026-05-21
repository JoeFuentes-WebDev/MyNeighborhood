import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'
type PostParent = { id: string; authorId: string; buildingId: string; type?: string; images?: unknown[]; event?: unknown }

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'

function getUser(context: { userId?: string }) {
  if (!context.userId) throw new GraphQLError('Not authenticated', {
    extensions: { code: 'UNAUTHENTICATED' }
  })
  return context.userId
}

function daysUntilExpiry(expiresAt: Date): number {
  return Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: { userId?: string }) => {
      if (!ctx.userId) return null
      return prisma.user.findUnique({ where: { id: ctx.userId } })
    },

    myBuildings: async (_: unknown, __: unknown, ctx: { userId?: string }) => {
      const userId = getUser(ctx)
      return prisma.userBuilding.findMany({
        where: { userId },
        include: { building: true, unit: true },
        orderBy: { joinedAt: 'asc' },
      })
    },

    building: async (_: unknown, { id }: { id: string }) => {
      return prisma.building.findUnique({ where: { id } })
    },

    feed: async (
      _: unknown,
      { buildingId, type, limit = 20, offset = 0 }: {
        buildingId: string; type?: string; limit?: number; offset?: number
      },
      ctx: { userId?: string }
    ) => {
      getUser(ctx)
      return prisma.post.findMany({
        where: {
          buildingId,
          ...(type ? { type: type as import('@prisma/client').PostType } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { images: true, event: { include: { rsvps: true } } },
      })
    },

    post: async (_: unknown, { id }: { id: string }, ctx: { userId?: string }) => {
      getUser(ctx)
      return prisma.post.findUnique({
        where: { id },
        include: { images: true, event: { include: { rsvps: true } } },
      })
    },

    neighbors: async (_: unknown, { buildingId }: { buildingId: string }, ctx: { userId?: string }) => {
      getUser(ctx)
      const memberships = await prisma.userBuilding.findMany({
        where: { buildingId },
        include: { user: true },
      })
      return memberships.map((m: { user: import('@prisma/client').User }) => m.user)
    },

    neighbor: async (_: unknown, { id }: { id: string }, ctx: { userId?: string }) => {
      getUser(ctx)
      return prisma.user.findUnique({ where: { id } })
    },

    conversations: async (_: unknown, __: unknown, ctx: { userId?: string }) => {
      const userId = getUser(ctx)
      const messages = await prisma.directMessage.findMany({
        where: { OR: [{ fromId: userId }, { toId: userId }] },
        orderBy: { sentAt: 'desc' },
        include: { from: true, to: true },
      })

      const seen = new Set<string>()
      const convos: Array<{
        participant: { id: string; name: string; avatarUrl: string | null }
        lastMessage: { id: string; fromId?: string; toId?: string; body: string; sentAt: Date | string; read: boolean; from?: unknown; to?: unknown }
        unreadCount: number
      }> = []

      for (const msg of messages) {
        const otherId = msg.fromId === userId ? msg.toId : msg.fromId
        if (seen.has(otherId)) continue
        seen.add(otherId)
        const unread = await prisma.directMessage.count({
          where: { fromId: otherId, toId: userId, read: false },
        })
        convos.push({
          participant: msg.fromId === userId ? msg.to : msg.from,
          lastMessage: msg,
          unreadCount: unread,
        })
      }
      return convos
    },

    messages: async (_: unknown, { withUserId }: { withUserId: string }, ctx: { userId?: string }) => {
      const userId = getUser(ctx)
      return prisma.directMessage.findMany({
        where: {
          OR: [
            { fromId: userId, toId: withUserId },
            { fromId: withUserId, toId: userId },
          ],
        },
        orderBy: { sentAt: 'asc' },
        include: { from: true, to: true },
      })
    },

    events: async (_: unknown, { buildingId }: { buildingId: string }, ctx: { userId?: string }) => {
      getUser(ctx)
      return prisma.post.findMany({
        where: { buildingId, type: 'EVENT' },
        orderBy: { createdAt: 'desc' },
        include: { images: true, event: { include: { rsvps: true } } },
      })
    },
    
    myFavoriteIds: async (_: unknown, __: unknown, ctx: { userId?: string }) => {
      const userId = getUser(ctx)
      const favs = await prisma.neighborFavorite.findMany({
        where: { userId },
        select: { favoritedId: true },
      })
      return favs.map((f: { favoritedId: string }) => f.favoritedId)
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { name, email, password, address, unitNumber, zip }: {
        name: string; email: string; password: string
        address: string; unitNumber: string; zip: string
      }
    ) => {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) throw new GraphQLError('Email already registered')

      let building = await prisma.building.findFirst({
        where: { address: { equals: address, mode: 'insensitive' }, zip }
      })

      if (!building) {
        building = await prisma.building.create({
          data: { address, zip, city: '', state: '' }
        })
      }

      let unit = await prisma.unit.findUnique({
        where: { buildingId_unitNumber: { buildingId: building.id, unitNumber } }
      })
      if (!unit) {
        unit = await prisma.unit.create({
          data: { buildingId: building.id, unitNumber }
        })
      }

      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          buildings: {
            create: {
              buildingId: building.id,
              unitId: unit.id,
            }
          }
        },
        include: {
          buildings: { include: { building: true, unit: true } }
        },
      })

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
      return { token, user }
    },

    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          buildings: { include: { building: true, unit: true } }
        }
      })
      if (!user) throw new GraphQLError('Invalid credentials')
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) throw new GraphQLError('Invalid credentials')
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
      return { token, user }
    },

    leaveBuilding: async (
      _: unknown,
      { buildingId }: { buildingId: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      await prisma.userBuilding.delete({
        where: { userId_buildingId: { userId, buildingId } }
      })
      return true
    },

    createPost: async (
      _: unknown,
      args: {
        buildingId: string; type: string; title: string; body: string
        startsAt?: string; endsAt?: string; location?: string
        price?: number; isFree?: boolean; condition?: string
      },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      return prisma.post.create({
        data: {
          authorId: userId,
          buildingId: args.buildingId,
          type: args.type as import('@prisma/client').PostType,
          title: args.title,
          body: args.body,
          price: args.price,
          isFree: args.isFree,
          condition: args.condition,
          ...(args.type === 'EVENT' && args.startsAt ? {
            event: {
              create: {
                startsAt: new Date(args.startsAt),
                endsAt: args.endsAt ? new Date(args.endsAt) : null,
                location: args.location,
              }
            }
          } : {})
        },
        include: { images: true, event: { include: { rsvps: true } } },
      })
    },

    rsvp: async (
      _: unknown,
      { eventId, status }: { eventId: string; status: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      return prisma.rSVP.upsert({
        where: { eventId_userId: { eventId, userId } },
        update: { status: status as import('@prisma/client').RSVPStatus },
        create: { eventId, userId, status: status as import('@prisma/client').RSVPStatus },
        include: { user: true },
      })
    },

    sendMessage: async (
      _: unknown,
      { toId, body }: { toId: string; body: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      return prisma.directMessage.create({
        data: { fromId: userId, toId, body },
        include: { from: true, to: true },
      })
    },

    markMessagesRead: async (
      _: unknown,
      { fromId }: { fromId: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      await prisma.directMessage.updateMany({
        where: { fromId, toId: userId, read: false },
        data: { read: true },
      })
      return true
    },

    updateProfile: async (
      _: unknown,
      args: {
        name?: string; interests?: string[]
        showPhotos?: boolean; showInterests?: boolean
        showUnit?: boolean; allowDMs?: boolean
      },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      return prisma.user.update({
        where: { id: userId },
        data: { ...args },
      })
    },

    uploadPostImage: async (
      _: unknown,
      { postId, url, order }: { postId: string; url: string; order: number },
      ctx: { userId?: string }
    ) => {
      getUser(ctx)
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      return prisma.postImage.create({
        data: { postId, url, order, expiresAt },
      })
    },

    uploadAvatar: async (
      _: unknown,
      { url }: { url: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      return prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url },
      })
    },

    addProfilePhoto: async (
      _: unknown,
      { url, label }: { url: string; label?: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      const existing = await prisma.profilePhoto.findMany({ where: { userId } })
      if (existing.length >= 3) throw new GraphQLError('Maximum 3 profile photos allowed')
      return prisma.profilePhoto.create({
        data: { userId, url, label, order: existing.length },
      })
    },

    updateProfilePhotoLabel: async (
      _: unknown,
      { id, label }: { id: string; label: string },
      ctx: { userId?: string }
    ) => {
      getUser(ctx)
      return prisma.profilePhoto.update({
        where: { id },
        data: { label },
      })
    },

    deleteProfilePhoto: async (
      _: unknown,
      { id }: { id: string },
      ctx: { userId?: string }
    ) => {
      getUser(ctx)
      await prisma.profilePhoto.delete({ where: { id } })
      return true
    },

    addFavorite: async (
      _: unknown,
      { favoritedId }: { favoritedId: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      await prisma.neighborFavorite.upsert({
        where: { userId_favoritedId: { userId, favoritedId } },
        create: { userId, favoritedId },
        update: {},
      })
      return true
    },

    removeFavorite: async (
      _: unknown,
      { favoritedId }: { favoritedId: string },
      ctx: { userId?: string }
    ) => {
      const userId = getUser(ctx)
      await prisma.neighborFavorite.deleteMany({
        where: { userId, favoritedId },
      })
      return true
    },

    submitFeedback: async (_: unknown, { body }: { body: string }, context: { userId?: string }) => {
      await prisma.feedback.create({
        data: {
          body,
          userId: context.userId ?? null,
        }
      })
      return true
    },

  },

  Post: {
    
    author: (post: PostParent) => prisma.user.findUnique({ where: { id: post.authorId } }),
    building: (post: PostParent) => prisma.building.findUnique({ where: { id: post.buildingId } }),
    images: (post: PostParent) => post.images ?? prisma.postImage.findMany({
      where: { postId: post.id }, orderBy: { order: 'asc' }
    }),
    event: (post: PostParent) => post.event ?? prisma.event.findUnique({
      where: { postId: post.id }, include: { rsvps: true }
    }),
    rsvpCount: async (post: PostParent) => {
      if (post.type !== 'EVENT') return null
      const event = await prisma.event.findUnique({ where: { postId: post.id } })
      if (!event) return 0
      return prisma.rSVP.count({ where: { eventId: event.id, status: 'GOING' } })
    },
  },

  PostImage: {
    daysUntilExpiry: (img: { expiresAt: Date | string }) => daysUntilExpiry(new Date(img.expiresAt)),
  },

  Event: {
    rsvps: (event: { id: string }) => prisma.rSVP.findMany({
      where: { eventId: event.id },
      include: { user: true }
    }),
    goingCount: async (event: { id: string }) => prisma.rSVP.count({
      where: { eventId: event.id, status: 'GOING' }
    }),
    startsAt: (event: { id: string; startsAt: Date | string }) => event.startsAt instanceof Date
      ? event.startsAt.toISOString()
      : String(event.startsAt),
    endsAt: (event:  { id: string; endsAt: Date | string }) => event.endsAt
      ? (event.endsAt instanceof Date ? event.endsAt.toISOString() : String(event.endsAt))
      : null,
  },

  User: {
    buildings: (user: { id: string }) => prisma.userBuilding.findMany({
      where: { userId: user.id },
      include: { building: true, unit: true },
    }),
    photos: (user: { id: string }) => prisma.profilePhoto.findMany({
      where: { userId: user.id }, orderBy: { order: 'asc' }
    }),
    posts: (user: { id: string }) => prisma.post.findMany({
      where: { authorId: user.id }, orderBy: { createdAt: 'desc' }, take: 10
    }),
    isFavorited: async (user: { id: string }, _: unknown, ctx: { userId?: string }) => {
      if (!ctx.userId) return false
      const fav = await prisma.neighborFavorite.findUnique({
        where: { userId_favoritedId: { userId: ctx.userId, favoritedId: user.id } },
      })
      return !!fav
    },
  },

  UserBuilding: {
    user: (ub: { userId: string }) => prisma.user.findUnique({ where: { id: ub.userId } }),
    building: (ub: { buildingId: string; building?: unknown }) => ub.building ?? prisma.building.findUnique({ where: { id: ub.buildingId } }),
    unit: (ub: { unitId: string; unit?: unknown }) => ub.unit ?? prisma.unit.findUnique({ where: { id: ub.unitId } }),
  },

  Building: {
    units: (b: { id: string }) => prisma.unit.findMany({ where: { buildingId: b.id } }),
    members: (b: { id: string }) => prisma.userBuilding.findMany({ where: { buildingId: b.id } }),
    posts: (b: { id: string }) => prisma.post.findMany({
      where: { buildingId: b.id }, orderBy: { createdAt: 'desc' }
    }),
  },
}