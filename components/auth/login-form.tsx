"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDebugInfo(null)
    setIsLoading(true)

    try {
      // Log environment variables (without revealing sensitive data)
      setDebugInfo(`Attempting login with email: ${email}
      NEXT_PUBLIC_SUPABASE_URL exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
      Current URL: ${window.location.href}`)

      await signIn(email, password)
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to sign in")

      // Add more debug info
      if (err instanceof Error) {
        setDebugInfo((prev) => `${prev}\nError: ${err.message}\n${err.stack || "No stack trace"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log In</CardTitle>
        <CardDescription>Log in to your Jira Kanban account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.name@machineslikeme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {debugInfo && (
            <div className="mt-4 p-2 bg-muted text-xs overflow-auto max-h-32 rounded">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </Button>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
