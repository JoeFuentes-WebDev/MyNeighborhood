'use client'

import { useState, useEffect, Suspense } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { Illustration } from '@/components/Illustration'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { MY_BUILDINGS_QUERY } from '@/graphql/queries'
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LEAVE_BUILDING_MUTATION,
} from '@/graphql/mutations'

import { useSearchParams } from 'next/navigation'

// inside the component:

export interface UserBuildingItem {
  id: string
  building: {
    id: string
    name: string | null
    address: string
    zip: string
  }
  unit: {
    unitNumber: string
  }
}

function OnboardingPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])
  // register fields
  const [step, setStep] = useState<'address' | 'account'>('address')
  const [address, setAddress] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [zip, setZip] = useState('')
  const [name, setName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const [loginMutation, { loading: loggingIn }] = useMutation(LOGIN_MUTATION)
  const [register, { loading: registering }] = useMutation(REGISTER_MUTATION)
  const [leaveBuilding] = useMutation(LEAVE_BUILDING_MUTATION)

  // only query buildings if we have a token
  const { data, refetch } = useQuery(MY_BUILDINGS_QUERY, { skip: !mounted })

  useEffect(() => {
    Promise.resolve().then(() => {
      const token = localStorage.getItem('neighbors_token')
      const building = localStorage.getItem('neighbors_building')
      if (token && building) router.push('/feed')
    })
  }, [router])

  function toggle(id: string) {
    setExpanded(e => e === id ? null : id)
    setError('')
  }

  async function handleLogin(buildingId: string) {
    setError('')
    try {
      const { data } = await loginMutation({ variables: { email, password } })
      const { token } = data.login
      localStorage.setItem('neighbors_token', token)
      localStorage.setItem('neighbors_user', data.login.user.id)
      localStorage.setItem('neighbors_building', buildingId)
      router.push('/feed')
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Invalid email or password')
      }
    }
  }

  async function handleRegister() {
    setError('')
    try {
      const { data } = await register({
        variables: { name, email: regEmail, password: regPassword, address, unitNumber, zip }
      })
      const { token, user } = data.register
      localStorage.setItem('neighbors_token', token)
      localStorage.setItem('neighbors_user', user.id)
      localStorage.setItem('neighbors_building', user.buildings[0].building.id)
      router.push('/feed')
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Something went wrong')
      }
    }
  }

  async function handleLeave(buildingId: string) {
    await leaveBuilding({ variables: { buildingId } })
    await refetch()
    setExpanded(null)
  }

  async function handleEmailLogin() {
    setError('')
    try {
      const { data } = await loginMutation({ variables: { email, password } })
      const { token, user } = data.login
      localStorage.setItem('neighbors_token', token)
      localStorage.setItem('neighbors_user', user.id)
      localStorage.setItem('neighbors_building', user.buildings[0].building.id)
      router.push('/feed')
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Invalid email or password')
      }
    }
  }

  const buildings = data?.myBuildings ?? []

  const searchParams = useSearchParams()

  useEffect(() => {
    Promise.resolve().then(() => {
      const address = searchParams.get('address')
      const zip = searchParams.get('zip')
      if (address) setAddress(address)
      if (zip) setZip(zip)
      if (address || zip) {
        setExpanded('register')
        setStep('address')
      }
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      <Illustration variant="onboarding" className="h-44 rounded-none" />

      <div className="flex-1 px-5 py-5">

        {/* Existing buildings */}
        {buildings.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Your buildings
            </div>
            <div className="space-y-2">
              {buildings.map((ub: UserBuildingItem) => (
                <div key={ub.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggle(ub.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="text-[14px] font-medium text-gray-900">
                        {ub.building.name || ub.building.address}
                      </div>
                      <div className="text-[12px] text-gray-400">
                        Unit {ub.unit.unitNumber} · {ub.building.zip}
                      </div>
                    </div>
                    {expanded === ub.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </button>

                  {expanded === ub.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin(ub.building.id)}
                          placeholder="you@example.com"
                          className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin(ub.building.id)}
                          placeholder="Your password"
                          className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                        />
                      </div>

                      {error && <p className="text-[12px] text-red-500">{error}</p>}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLogin(ub.building.id)}
                          disabled={!email || !password || loggingIn}
                          className="flex-1 bg-teal-500 text-white rounded-xl py-2.5 text-[13px] font-medium disabled:opacity-40"
                        >
                          {loggingIn ? 'Signing in...' : 'Sign in'}
                        </button>
                        <button
                          onClick={() => handleLeave(ub.building.id)}
                          className="px-4 py-2.5 text-[13px] text-red-400 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Moved out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join a new building */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle('register')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="text-[14px] font-medium text-gray-900">
              {buildings.length === 0 ? 'Find your building' : '+ Join a new building'}
            </div>
            {expanded === 'register'
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />
            }
          </button>

          {expanded === 'register' && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              {step === 'address' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Street address
                    </label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="150 Van Ness Ave"
                      className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Unit
                      </label>
                      <input
                        value={unitNumber}
                        onChange={e => setUnitNumber(e.target.value)}
                        placeholder="4B"
                        className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                        ZIP
                      </label>
                      <input
                        value={zip}
                        onChange={e => setZip(e.target.value)}
                        placeholder="94103"
                        className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Your exact unit is only visible to you. Name and unit are always shown on your posts.
                  </p>
                  <button
                    onClick={() => setStep('account')}
                    disabled={!address || !unitNumber || !zip}
                    className="w-full bg-teal-500 text-white rounded-xl py-2.5 text-[13px] font-medium disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('address')}
                    className="text-[13px] text-gray-400"
                  >
                    ← Back
                  </button>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Your name
                    </label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Maya K."
                      className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="8+ characters"
                      className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                    />
                  </div>

                  {error && <p className="text-[12px] text-red-500">{error}</p>}

                  <button
                    onClick={handleRegister}
                    disabled={!name || !regEmail || !regPassword || registering}
                    className="w-full bg-teal-500 text-white rounded-xl py-2.5 text-[13px] font-medium disabled:opacity-40"
                  >
                    {registering ? 'Joining...' : 'Join the building →'}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    By joining you agree to keep this community respectful.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign in — for returning users on a new device */}
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle('signin')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="text-[14px] font-medium text-gray-900">
              Already have an account?
            </div>
            {expanded === 'signin'
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />
            }
          </button>

          {expanded === 'signin' && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                  placeholder="you@example.com"
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                  placeholder="Your password"
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg border border-gray-200"
                />
              </div>

              {error && <p className="text-[12px] text-red-500">{error}</p>}

              <button
                onClick={handleEmailLogin}
                disabled={!email || !password || loggingIn}
                className="w-full bg-teal-500 text-white rounded-xl py-2.5 text-[13px] font-medium disabled:opacity-40"
              >
                {loggingIn ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// new default export wraps with Suspense
export default function OnboardingPageWrapper() {
  return (
    <Suspense>
      <OnboardingPage />
    </Suspense>
  )
}