"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuthStore()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Handle authentication state changes
  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Handle redirect after successful login
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/")
    }
  }, [shouldRedirect, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate a slight delay for better UX
    setTimeout(() => {
      const success = login(password)

      if (success) {
        setShouldRedirect(true)
      } else {
        setError("Invalid password. Please try again.")
      }
      setIsLoading(false)
    }, 500)
  }

  // Don't render anything if we're authenticated - let the useEffect handle the redirect
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 flex-col">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="mb-8 flex flex-col items-center">
        <Logo width={300} height={75} />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Jira Kanban Board</CardTitle>
          <CardDescription>Enter the password to access the Kanban board</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
