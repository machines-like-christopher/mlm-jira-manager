"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Search, ArrowRight } from "lucide-react"
import Link from "next/link"
import { fetchProjectStatuses } from "@/lib/jira-service"
import type { JiraStatus } from "@/types/jira"

interface ProjectSettingsProps {
  onSuccess?: () => void
}

export function ProjectSettings({ onSuccess }: ProjectSettingsProps) {
  const { toast } = useToast()
  const {
    isConnected,
    projects,
    selectedProjects,
    fetchProjects,
    setSelectedProjects,
    setColumns,
    jiraCredentials,
    useManualCredentials,
  } = useJiraStore()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      if (!isConnected || projects.length > 0) return

      setLoading(true)
      try {
        await fetchProjects()
      } catch (error) {
        toast({
          title: "Error loading projects",
          description: "There was a problem loading your Jira projects.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [isConnected, projects.length, fetchProjects, toast])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleProjectToggle = (project) => {
    const isSelected = selectedProjects.some((p) => p.id === project.id)

    if (isSelected) {
      setSelectedProjects(selectedProjects.filter((p) => p.id !== project.id))
    } else {
      setSelectedProjects([...selectedProjects, project])
    }
  }

  const handleSave = async () => {
    if (selectedProjects.length === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Fetch statuses for all selected projects
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

      // Create a column for each unique status (one-to-one mapping)
      const newColumns = allStatuses.map((status, index) => ({
        id: status.id,
        name: status.name,
        statusIds: [status.id], // Each column only contains its own status
      }))

      // Sort columns by status category (typically: to do -> in progress -> done)
      newColumns.sort((a, b) => {
        const statusA = allStatuses.find((s) => s.id === a.id)
        const statusB = allStatuses.find((s) => s.id === b.id)

        if (!statusA || !statusB) return 0

        // Common order: To Do -> In Progress -> Done
        const categoryOrder = {
          "To Do": 1,
          "In Progress": 2,
          Done: 3,
        }

        const orderA = categoryOrder[statusA.statusCategory] || 99
        const orderB = categoryOrder[statusB.statusCategory] || 99

        return orderA - orderB
      })

      setColumns(newColumns)

      setSaved(true)
      toast({
        title: "Projects saved",
        description: `Selected ${selectedProjects.length} projects and created ${allStatuses.length} columns.`,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error saving projects",
        description: "There was a problem saving your project selection.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Selection</CardTitle>
        <CardDescription>
          Select the Jira projects you want to include in your Kanban board. Each Jira status will become its own
          column.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No projects found</div>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.some((p) => p.id === project.id)}
                        onCheckedChange={() => handleProjectToggle(project)}
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        {project.avatarUrl && (
                          <img
                            src={project.avatarUrl || "/placeholder.svg"}
                            alt={project.name}
                            className="w-6 h-6 rounded"
                          />
                        )}
                        <label
                          htmlFor={`project-${project.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {project.name}
                        </label>
                        <span className="text-xs text-muted-foreground">{project.key}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Selected {selectedProjects.length} of {projects.length} projects
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Selection"}
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
