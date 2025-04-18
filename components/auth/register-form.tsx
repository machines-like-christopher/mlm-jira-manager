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
import { AlertCircle, ArrowLeft } from "lucide-react"

export function RegisterForm() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = (email: string) => {
    return email.endsWith("@machineslikeme.com")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email domain
    if (!validateEmail(email)) {
      setError("Only @machineslikeme.com email addresses are allowed to register")
      return
    }

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      await signUp(email, password)
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registration Successful</CardTitle>
          <CardDescription>Please check your email to verify your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            We've sent a verification email to <strong>{email}</strong>. Click the link in the email to complete your
            registration.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Register with your @machineslikeme.com email address</CardDescription>
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
              className={!email || validateEmail(email) ? "" : "border-red-500"}
            />
            {email && !validateEmail(email) && (
              <p className="text-xs text-red-500">Only @machineslikeme.com email addresses are allowed</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={!confirmPassword || confirmPassword === password ? "" : "border-red-500"}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>

          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/auth/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
