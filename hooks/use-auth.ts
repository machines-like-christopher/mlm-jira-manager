"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { signUp, signIn, signOut as supabaseSignOut, resetPassword, updatePassword } from "@/lib/supabase-auth"
import { useUser } from "@/contexts/user-context"

export function useAuth() {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  // Register a new user
  const register = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Validate email domain
      if (!email.endsWith("@machineslikeme.com")) {
        toast({
          title: "Registration failed",
          description: "Only @machineslikeme.com email addresses are allowed to register",
          variant: "destructive",
        })
        return false
      }

      await signUp(email, password)

      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      })

      return true
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signIn(email, password)
      await refreshUser()

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      router.push("/")
      return true
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    setIsLoading(true)
    try {
      await supabaseSignOut()

      toast({
        title: "Logout successful",
        description: "You have been logged out",
      })

      router.push("/login")
      return true
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Request password reset
  const forgotPassword = async (email: string) => {
    setIsLoading(true)
    try {
      await resetPassword(email)

      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link",
      })

      return true
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update password
  const changePassword = async (password: string) => {
    setIsLoading(true)
    try {
      await updatePassword(password)

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      })

      return true
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    register,
    login,
    logout,
    forgotPassword,
    changePassword,
    isLoading,
  }
}
