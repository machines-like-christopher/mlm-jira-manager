"use client"

import { useEffect, useState } from "react"
import type { JiraIssue } from "@/types/jira"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface IssueDetailsDialogProps {
  issue: JiraIssue
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IssueDetailsDialog({ issue, open, onOpenChange }: IssueDetailsDialogProps) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState("")

  useEffect(() => {
    setJiraBaseUrl(process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://machineslikeme.atlassian.net")
  }, [])

  const issueUrl = `${jiraBaseUrl}/browse/${issue.key}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {issue.issueType.iconUrl && (
              <img src={issue.issueType.iconUrl || "/placeholder.svg"} alt={issue.issueType.name} className="w-5 h-5" />
            )}
            <span>{issue.key}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{issue.summary}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Project:</span> {issue.project.name} ({issue.project.key})
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Type:</span> {issue.issueType.name}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Status:</span> {issue.status.name}
              </div>

              {issue.priority && (
                <div className="text-sm flex items-center gap-1">
                  <span className="text-muted-foreground">Priority:</span>
                  {issue.priority.iconUrl && (
                    <img
                      src={issue.priority.iconUrl || "/placeholder.svg"}
                      alt={issue.priority.name}
                      className="w-4 h-4"
                    />
                  )}
                  {issue.priority.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {issue.assignee && (
                <div className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">Assignee:</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={issue.assignee.avatarUrl || "/placeholder.svg"} alt={issue.assignee.name} />
                      <AvatarFallback>
                        {issue.assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {issue.assignee.name}
                  </div>
                </div>
              )}

              {issue.reporter && (
                <div className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">Reporter:</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={issue.reporter.avatarUrl || "/placeholder.svg"} alt={issue.reporter.name} />
                      <AvatarFallback>
                        {issue.reporter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {issue.reporter.name}
                  </div>
                </div>
              )}

              <div className="text-sm">
                <span className="text-muted-foreground">Created:</span> {new Date(issue.created).toLocaleString()}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Updated:</span> {new Date(issue.updated).toLocaleString()}
              </div>
            </div>
          </div>

          {issue.labels.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Labels:</span>
              <div className="flex flex-wrap gap-1">
                {issue.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                Open in Jira <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
