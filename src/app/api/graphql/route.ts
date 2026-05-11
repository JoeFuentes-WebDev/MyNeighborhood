import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret'

const server = new ApolloServer({ typeDefs, resolvers })

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '')
    if (!token) return { userId: undefined }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
      return { userId: payload.userId }
    } catch {
      return { userId: undefined }
    }
  },
})

export async function GET(req: NextRequest) { return handler(req) }
export async function POST(req: NextRequest) { return handler(req) }
