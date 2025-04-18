"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold">No projects selected</h2>
        <p className="text-muted-foreground">
          To get started, go to the settings page and connect to your Jira instance, then select the projects you want
          to display on your Kanban board.
        </p>
        <Button asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}
