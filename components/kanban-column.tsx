"use client"

import type { KanbanColumn as ColumnType } from "@/types/jira"
import type { JiraIssue } from "@/types/jira"
import { IssueCard } from "@/components/issue-card"

interface KanbanColumnProps {
  column: ColumnType
  issues: JiraIssue[]
}

export function KanbanColumn({ column, issues }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80 rounded-lg p-3 flex flex-col h-full kanban-column">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{column.name}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{issues.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 kanban-scrollbar">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}

        {issues.length === 0 && (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md border-muted-foreground/20">
            <p className="text-sm text-muted-foreground">No issues</p>
          </div>
        )}
      </div>
    </div>
  )
}
