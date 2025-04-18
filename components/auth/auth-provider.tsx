"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Get the Supabase client once at the component level
  const supabase = getSupabaseClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Auth state changed:", _event, session?.user?.email)
          setSession(session)
          setUser(session?.user ?? null)
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const unsubscribe = initializeAuth()

    return () => {
      // Clean up the subscription when the component unmounts
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in with:", email)

      // Validate email domain
      if (!email.endsWith("@machineslikeme.com")) {
        throw new Error("Only @machineslikeme.com email addresses are allowed")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful:", data.user?.email)

      // Wait a moment before redirecting to ensure session is properly set
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 500)

      return data
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      // Validate email domain
      if (!email.endsWith("@machineslikeme.com")) {
        throw new Error("Only @machineslikeme.com email addresses are allowed")
      }

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      console.log("Sign up successful:", data.user?.email)
      return data
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
