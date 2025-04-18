"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useAuth } from "@/components/auth/auth-provider"
import { Loading } from "@/components/loading"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated: isPasswordAuthenticated } = useAuthStore()
  const { user, isLoading: isUserLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for login page to avoid redirect loops
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname.startsWith("/auth/")
    ) {
      setIsLoading(false)
      return
    }

    // First layer: Check if the user has passed the password gate
    if (!isPasswordAuthenticated) {
      router.push("/login")
      return
    }

    // Second layer: Check if the user is authenticated with Supabase
    // Only check this after the password gate is passed
    if (!isUserLoading && !user) {
      // If the user has passed the password gate but is not authenticated with Supabase,
      // redirect to the Supabase login page
      router.push("/auth/login")
      return
    }

    setIsLoading(false)
  }, [isPasswordAuthenticated, user, isUserLoading, router, pathname])

  // If on a protected route and not authenticated, show loading
  if (
    pathname !== "/login" &&
    pathname !== "/register" &&
    pathname !== "/forgot-password" &&
    !pathname.startsWith("/auth/") &&
    (isLoading || !isPasswordAuthenticated || (!isUserLoading && !user))
  ) {
    return <Loading />
  }

  return <>{children}</>
}
