"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check, ArrowRight } from "lucide-react"

interface AssigneeSelectorProps {
  taskId: string
  currentAssigneeId: string
  plannedAssigneeId: string
  onAssigneeChange: (userId: string) => void
}

export function AssigneeSelector({
  taskId,
  currentAssigneeId,
  plannedAssigneeId,
  onAssigneeChange,
}: AssigneeSelectorProps) {
  const { issues } = useJiraStore()
  const [users, setUsers] = useState<Array<{ id: string; name: string; avatarUrl?: string }>>([])

  // Extract all unique users from issues
  useEffect(() => {
    const uniqueUsers = new Map<string, { id: string; name: string; avatarUrl?: string }>()

    // Add unassigned option
    uniqueUsers.set("unassigned", {
      id: "unassigned",
      name: "Unassigned",
      avatarUrl: undefined,
    })

    // Add all assignees and reporters
    issues.forEach((issue) => {
      if (issue.assignee) {
        uniqueUsers.set(issue.assignee.id, issue.assignee)
      }
      if (issue.reporter) {
        uniqueUsers.set(issue.reporter.id, issue.reporter)
      }
    })

    setUsers(Array.from(uniqueUsers.values()))
  }, [issues])

  // Get the current planned assignee
  const plannedUser =
    users.find((user) => user.id === plannedAssigneeId) || users.find((user) => user.id === "unassigned")

  // Get the current Jira assignee
  const currentUser =
    users.find((user) => user.id === currentAssigneeId) || users.find((user) => user.id === "unassigned")

  // Check if planned assignee is different from current assignee
  const isDifferent = plannedAssigneeId !== currentAssigneeId

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-auto py-1 px-2 text-xs ${
            isDifferent ? "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50" : ""
          }`}
        >
          <div className="flex flex-col items-start gap-1 text-left">
            <div className="flex items-center gap-1">
              <span className="font-medium">Jira:</span>
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={currentUser?.avatarUrl || "/placeholder.svg"}
                  alt={currentUser?.name || "Unassigned"}
                />
                <AvatarFallback className="text-[8px]">
                  {currentUser?.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "UN"}
                </AvatarFallback>
              </Avatar>
              <span>{currentUser?.name || "Unassigned"}</span>
            </div>

            {isDifferent && (
              <div className="flex items-center w-full justify-center my-0.5">
                <ArrowRight className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="font-medium">Plan:</span>
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={plannedUser?.avatarUrl || "/placeholder.svg"}
                  alt={plannedUser?.name || "Unassigned"}
                />
                <AvatarFallback className="text-[8px]">
                  {plannedUser?.name
                    ? plannedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "UN"}
                </AvatarFallback>
              </Avatar>
              <span>{plannedUser?.name || "Unassigned"}</span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {users.map((user) => (
          <DropdownMenuItem key={user.id} onClick={() => onAssigneeChange(user.id)} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1">{user.name}</span>
            {user.id === plannedAssigneeId && <Check className="h-4 w-4" />}
            {user.id === currentAssigneeId && user.id !== plannedAssigneeId && (
              <span className="text-xs text-muted-foreground">(Jira)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
