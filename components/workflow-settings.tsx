"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { fetchProjectStatuses } from "@/lib/jira-service"
import type { JiraStatus } from "@/types/jira"
import { Plus, Trash, GripVertical, ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function WorkflowSettings() {
  const { toast } = useToast()
  const { isConnected, selectedProjects, columns, setColumns, jiraCredentials, useManualCredentials } = useJiraStore()

  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<JiraStatus[]>([])
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadStatuses = async () => {
      if (!isConnected || selectedProjects.length === 0) return

      setLoading(true)
      try {
        const allStatuses: JiraStatus[] = []

        for (const project of selectedProjects) {
          // Pass the credentials to fetchProjectStatuses only if using manual credentials
          const credentials = useManualCredentials ? jiraCredentials : undefined
          const projectStatuses = await fetchProjectStatuses(project.key, credentials)

          projectStatuses.forEach((status) => {
            if (!allStatuses.some((s) => s.id === status.id)) {
              allStatuses.push(status)
            }
          })
        }

        setStatuses(allStatuses)
      } catch (error) {
        toast({
          title: "Error loading statuses",
          description: "There was a problem loading your Jira statuses.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadStatuses()
  }, [isConnected, selectedProjects, toast, jiraCredentials, useManualCredentials])

  const handleAddColumn = () => {
    const newColumn = {
      id: Date.now().toString(),
      name: "New Column",
      statusIds: [],
    }

    setColumns([...columns, newColumn])
    setExpandedColumn(newColumn.id)
  }

  const handleRemoveColumn = (columnId: string) => {
    setColumns(columns.filter((column) => column.id !== columnId))
  }

  const handleColumnNameChange = (columnId: string, name: string) => {
    setColumns(columns.map((column) => (column.id === columnId ? { ...column, name } : column)))
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(columns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setColumns(items)
  }

  const handleSave = () => {
    setSaved(true)
    toast({
      title: "Workflow saved",
      description: "Your Kanban board workflow has been saved.",
    })
  }

  const handleRefreshStatuses = async () => {
    if (!isConnected || selectedProjects.length === 0) return

    setLoading(true)
    try {
      const allStatuses: JiraStatus[] = []

      for (const project of selectedProjects) {
        // Pass the credentials to fetchProjectStatuses only if using manual credentials
        const credentials = useManualCredentials ? jiraCredentials : undefined
        const projectStatuses = await fetchProjectStatuses(project.key, credentials)

        projectStatuses.forEach((status) => {
          if (!allStatuses.some((s) => s.id === status.id)) {
            allStatuses.push(status)
          }
        })
      }

      setStatuses(allStatuses)

      // Find statuses that don't have a column yet
      const newStatuses = allStatuses.filter(
        (status) => !columns.some((column) => column.statusIds.includes(status.id)),
      )

      if (newStatuses.length > 0) {
        // Create new columns for these statuses
        const newColumns = newStatuses.map((status) => ({
          id: status.id,
          name: status.name,
          statusIds: [status.id],
        }))

        // Add these new columns to the existing ones
        setColumns([...columns, ...newColumns])

        toast({
          title: "New statuses found",
          description: `Added ${newStatuses.length} new status columns to your board.`,
        })
      } else {
        toast({
          title: "Statuses refreshed",
          description: "No new statuses found.",
        })
      }
    } catch (error) {
      toast({
        title: "Error refreshing statuses",
        description: "There was a problem refreshing your Jira statuses.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p>Please connect to your Jira instance first.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedProjects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p>Please select at least one project first.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Configuration</CardTitle>
        <CardDescription>
          Customize your Kanban board columns. Each column represents a single Jira status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>One-to-One Status Mapping</AlertTitle>
          <AlertDescription>
            Each column represents a single Jira status. You can reorder columns to change their order on the board.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleRefreshStatuses} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Statuses
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className="border rounded-md">
                            <div className="flex items-center p-3 bg-muted/30">
                              <div {...provided.dragHandleProps} className="mr-2">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <Input
                                value={column.name}
                                onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                                className="h-8 max-w-[200px] mr-2"
                              />
                              <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveColumn(column.id)}>
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button variant="outline" onClick={handleAddColumn} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Empty Column
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSave} disabled={loading}>
          Save Workflow
        </Button>

        {saved && (
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              View Kanban Board
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
