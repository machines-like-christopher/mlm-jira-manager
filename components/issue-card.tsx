"use client"

import { useState } from "react"
import type { JiraIssue } from "@/types/jira"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { IssueDetailsDialog } from "@/components/issue-details-dialog"

interface IssueCardProps {
  issue: JiraIssue
}

export function IssueCard({ issue }: IssueCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <div className="p-3 rounded-md transition-shadow cursor-pointer issue-card" onClick={() => setShowDetails(true)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            {issue.issueType.iconUrl && (
              <img src={issue.issueType.iconUrl || "/placeholder.svg"} alt={issue.issueType.name} className="w-4 h-4" />
            )}
            <span className="text-xs font-medium text-muted-foreground">{issue.key}</span>
          </div>

          {issue.priority?.iconUrl && (
            <img src={issue.priority.iconUrl || "/placeholder.svg"} alt={issue.priority.name} className="w-4 h-4" />
          )}
        </div>

        <p className="text-sm mb-3 line-clamp-2">{issue.summary}</p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {issue.labels.slice(0, 2).map((label) => (
              <Badge key={label} variant="outline" className="text-[10px] px-1 py-0">
                {label}
              </Badge>
            ))}
            {issue.labels.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                +{issue.labels.length - 2}
              </Badge>
            )}
          </div>

          {issue.assignee && (
            <Avatar className="w-6 h-6">
              <AvatarImage src={issue.assignee.avatarUrl || "/placeholder.svg"} alt={issue.assignee.name} />
              <AvatarFallback>
                {issue.assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          <span className="bg-muted px-1 py-0.5 rounded text-[10px]">{issue.project.key}</span>
        </div>
      </div>

      <IssueDetailsDialog issue={issue} open={showDetails} onOpenChange={setShowDetails} />
    </>
  )
}
