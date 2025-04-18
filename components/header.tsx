"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Settings, RefreshCw, LogOut, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useJiraStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"

export function Header() {
  const router = useRouter()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { lastSyncTime, refreshJiraData } = useJiraStore()
  const { logout: logoutPassword } = useAuthStore()
  const { signOut: logoutSupabase, user } = useAuth()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshJiraData()
      toast({
        title: "Refresh successful",
        description: "Your Jira data has been refreshed.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing your Jira data.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      // First log out from Supabase
      await logoutSupabase()
      // Then log out from the password gate
      logoutPassword()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      router.push("/login")
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo width={150} height={38} />
          </Link>
        </div>
        <div className="hidden md:flex items-end">
          <span className="font-medium text-sm pb-1">Jira Multi Project Management</span>
          {user && <span className="text-xs text-muted-foreground ml-2 pb-1">({user.email})</span>}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-1">
            {lastSyncTime && (
              <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            )}
            <Link href="/">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline-block">Kanban Board</span>
              </Button>
            </Link>
            <Link href="/resource-allocation">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline-block">Resource Allocation</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline-block">Refresh</span>
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline-block">Settings</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline-block">Logout</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
