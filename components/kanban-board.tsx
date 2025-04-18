"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { KanbanColumn } from "@/components/kanban-column"
import type { JiraIssue } from "@/types/jira"
import { FilterBar } from "@/components/filter-bar"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function KanbanBoard() {
  const { toast } = useToast()
  const {
    issues,
    columns,
    selectedProjects,
    filters,
    fetchIssues,
    isConnected,
    jiraCredentials,
    useManualCredentials,
  } = useJiraStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredIssues, setFilteredIssues] = useState<JiraIssue[]>([])
  const [unmappedIssues, setUnmappedIssues] = useState<JiraIssue[]>([])

  useEffect(() => {
    const loadIssues = async () => {
      if (selectedProjects.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        await fetchIssues()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error loading issues"
        setError(errorMessage)
        toast({
          title: "Error loading issues",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadIssues()
  }, [selectedProjects, fetchIssues, toast, jiraCredentials, useManualCredentials])

  useEffect(() => {
    // Apply filters to issues
    let result = [...issues]

    if (filters.assignee) {
      result = result.filter((issue) => issue.assignee?.id === filters.assignee)
    }

    if (filters.project) {
      result = result.filter((issue) => issue.project.key === filters.project)
    }

    if (filters.issueType) {
      result = result.filter((issue) => issue.issueType.id === filters.issueType)
    }

    if (filters.priority) {
      result = result.filter((issue) => issue.priority?.id === filters.priority)
    }

    if (filters.labels && filters.labels.length > 0) {
      result = result.filter((issue) => filters.labels?.some((label) => issue.labels.includes(label)))
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      result = result.filter(
        (issue) => issue.key.toLowerCase().includes(searchLower) || issue.summary.toLowerCase().includes(searchLower),
      )
    }

    setFilteredIssues(result)

    // Check for unmapped issues
    const allStatusIds = columns.flatMap((column) => column.statusIds)
    const unmapped = result.filter((issue) => !allStatusIds.includes(issue.status.id))
    setUnmappedIssues(unmapped)
  }, [issues, filters, columns])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetchIssues()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error loading issues"
      setError(errorMessage)
      toast({
        title: "Error loading issues",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected || selectedProjects.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col h-full">
      <FilterBar />

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {unmappedIssues.length > 0 && (
        <Alert className="my-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Unmapped Issues</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {unmappedIssues.length} issues have statuses that are not mapped to any column. Go to settings to refresh
              statuses.
            </p>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href="/settings">Configure Workflow</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-4 h-[calc(100vh-180px)] kanban-scrollbar">
          {columns.map((column) => {
            const columnIssues = filteredIssues.filter((issue) => column.statusIds.includes(issue.status.id))

            return <KanbanColumn key={column.id} column={column} issues={columnIssues} />
          })}
        </div>
      )}
    </div>
  )
}
