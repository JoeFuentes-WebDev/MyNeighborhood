'use client'

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === 'UNAUTHENTICATED')) {
    localStorage.removeItem('neighbors_token')
    localStorage.removeItem('neighbors_building')
    window.location.href = '/onboarding'
  }
})

const httpLink = createHttpLink({ uri: '/api/graphql' })

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('neighbors_token')
    : null

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          feed: {
            keyArgs: ['buildingId', 'type'],
            merge(_existing: unknown, incoming: unknown) {
              return incoming
            },
          },
        },
      },
    },
  }),
})
