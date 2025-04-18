"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import {
  getSupabaseClient,
  getSession,
  getUserProfile,
  getUserSettings,
  type UserProfile,
  type UserSettings,
} from "@/lib/supabase-auth"

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  settings: UserSettings | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Initial session check
    setIsLoading(true)
    getSession().then((session) => {
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        // Load user profile and settings
        Promise.all([getUserProfile(session.user.id), getUserSettings(session.user.id)])
          .then(([profileData, settingsData]) => {
            setProfile(profileData)
            setSettings(settingsData)
            setIsLoading(false)
          })
          .catch((error) => {
            console.error("Error loading user data:", error)
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        const [profileData, settingsData] = await Promise.all([
          getUserProfile(session.user.id),
          getUserSettings(session.user.id),
        ])
        setProfile(profileData)
        setSettings(settingsData)
      } else {
        setProfile(null)
        setSettings(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshUser = async () => {
    const session = await getSession()
    setSession(session)
    setUser(session?.user || null)
  }

  const refreshProfile = async () => {
    if (!user) return
    const profileData = await getUserProfile(user.id)
    setProfile(profileData)
  }

  const refreshSettings = async () => {
    if (!user) return
    const settingsData = await getUserSettings(user.id)
    setSettings(settingsData)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        settings,
        session,
        isLoading,
        isAuthenticated,
        refreshUser,
        refreshProfile,
        refreshSettings,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
