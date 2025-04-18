"use client"

import { useState } from "react"
import type { JiraIssue } from "@/types/jira"
import { format } from "date-fns"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { Booking, PlanningAssignment } from "@/lib/db-service"
import { AssigneeSelector } from "@/components/assignee-selector"
import { BookingInput } from "@/components/booking-input"
import { Badge } from "@/components/ui/badge"

interface ProjectTreeProps {
  issues: JiraIssue[]
  planningAssignments: PlanningAssignment[]
  onAssignmentUpdate: (assignment: PlanningAssignment) => Promise<void>
  weekDates: Date[]
  bookings: Booking[]
  onBookingUpdate: (booking: Omit<Booking, "id"> & { id?: string }) => Promise<void>
}

interface ProjectGroup {
  key: string
  name: string
  issues: JiraIssue[]
}

interface EpicGroup {
  id: string
  name: string
  issues: JiraIssue[]
}

export function ProjectTree({
  issues,
  planningAssignments,
  onAssignmentUpdate,
  weekDates,
  bookings,
  onBookingUpdate,
}: ProjectTreeProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({})

  // Group issues by project
  const projectGroups: ProjectGroup[] = []
  const projectMap: Record<string, ProjectGroup> = {}

  issues.forEach((issue) => {
    const projectKey = issue.project.key

    if (!projectMap[projectKey]) {
      const newProject = {
        key: projectKey,
        name: issue.project.name,
        issues: [],
      }
      projectGroups.push(newProject)
      projectMap[projectKey] = newProject
    }

    projectMap[projectKey].issues.push(issue)
  })

  // Toggle project expansion
  const toggleProject = (projectKey: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectKey]: !prev[projectKey],
    }))
  }

  // Toggle epic expansion
  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => ({
      ...prev,
      [epicId]: !prev[epicId],
    }))
  }

  // Group issues by epic within a project
  const getEpicGroups = (projectIssues: JiraIssue[]): { epics: EpicGroup[]; noEpic: JiraIssue[] } => {
    const epicMap: Record<string, EpicGroup> = {}
    const noEpic: JiraIssue[] = []

    projectIssues.forEach((issue) => {
      // This is a simplified approach - in a real app, you'd need to determine
      // which issues are epics and which belong to epics
      const epicField = issue.fields?.epic || issue.fields?.parent

      // For now, since we don't have epic data in our current structure,
      // we'll put all issues in the noEpic category
      if (epicField && typeof epicField === "object" && epicField.id) {
        const epicId = epicField.id
        const epicName = epicField.name || epicField.summary || "Unknown Epic"

        if (!epicMap[epicId]) {
          epicMap[epicId] = {
            id: epicId,
            name: epicName,
            issues: [],
          }
        }

        epicMap[epicId].issues.push(issue)
      } else {
        noEpic.push(issue)
      }
    })

    return {
      epics: Object.values(epicMap),
      noEpic,
    }
  }

  // Get planned assignee for a task
  const getPlannedAssignee = (taskId: string) => {
    const assignment = planningAssignments.find((a) => a.taskId === taskId)
    return assignment?.plannedAssigneeId
  }

  // Get booking for a specific task, user, and date
  const getBooking = (taskId: string, userId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return bookings.find((b) => b.taskId === taskId && b.userId === userId && b.date === dateStr)
  }

  // Calculate total hours for a project on a specific date
  const getProjectTotalHours = (projectKey: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return bookings
      .filter((b) => b.taskId.startsWith(projectKey) && b.date === dateStr)
      .reduce((total, booking) => total + booking.hours, 0)
  }

  // Calculate total hours for an epic on a specific date
  const getEpicTotalHours = (epicIssues: JiraIssue[], date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const taskIds = epicIssues.map((issue) => issue.key)

    return bookings
      .filter((b) => taskIds.includes(b.taskId) && b.date === dateStr)
      .reduce((total, booking) => total + booking.hours, 0)
  }

  // Handle assignment change
  const handleAssignmentChange = async (taskId: string, userId: string) => {
    await onAssignmentUpdate({
      taskId,
      plannedAssigneeId: userId,
    })
  }

  // Handle booking change
  const handleBookingChange = async (taskId: string, userId: string, date: Date, hours: number) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const existingBooking = getBooking(taskId, userId, date)

    await onBookingUpdate({
      id: existingBooking?.id,
      taskId,
      userId,
      date: dateStr,
      hours,
    })
  }

  // Render a task row
  const renderTaskRow = (issue: JiraIssue) => {
    const plannedAssigneeId = getPlannedAssignee(issue.key) || issue.assignee?.id || "unassigned"

    return (
      <div key={issue.id} className="grid grid-cols-[350px_1fr] gap-4 py-2 border-t">
        <div className="flex items-start">
          <div className="ml-8 flex-1">
            <div className="flex items-center gap-2">
              {issue.issueType.iconUrl && (
                <img
                  src={issue.issueType.iconUrl || "/placeholder.svg"}
                  alt={issue.issueType.name}
                  className="w-4 h-4"
                />
              )}
              <span className="text-sm font-medium">{issue.summary}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {issue.key}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div>
            <AssigneeSelector
              taskId={issue.key}
              currentAssigneeId={issue.assignee?.id || "unassigned"}
              plannedAssigneeId={plannedAssigneeId}
              onAssigneeChange={(userId) => handleAssignmentChange(issue.key, userId)}
            />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date) => (
              <BookingInput
                key={date.toISOString()}
                taskId={issue.key}
                userId={plannedAssigneeId}
                date={date}
                value={getBooking(issue.key, plannedAssigneeId, date)?.hours || 0}
                onChange={(hours) => handleBookingChange(issue.key, plannedAssigneeId, date, hours)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render an epic group
  const renderEpicGroup = (epic: EpicGroup, projectKey: string) => {
    const isExpanded = expandedEpics[epic.id] || false

    return (
      <div key={epic.id} className="border-t">
        <div
          className="grid grid-cols-[350px_1fr] gap-4 py-2 cursor-pointer hover:bg-muted/50"
          onClick={() => toggleEpic(epic.id)}
        >
          <div className="flex items-center">
            <div className="ml-4">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="ml-2 font-medium text-sm">{epic.name}</div>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4">
            <div className="text-sm font-medium">Assignees</div>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="text-center p-2 text-sm font-medium">
                  {getEpicTotalHours(epic.issues, date)}h
                </div>
              ))}
            </div>
          </div>
        </div>

        {isExpanded && epic.issues.map((issue) => renderTaskRow(issue))}
      </div>
    )
  }

  // Render a project group
  const renderProjectGroup = (project: ProjectGroup) => {
    const isExpanded = expandedProjects[project.key] || false
    const { epics, noEpic } = getEpicGroups(project.issues)

    return (
      <div key={project.key} className="mb-4 border rounded-md overflow-hidden">
        <div
          className="grid grid-cols-[350px_1fr] gap-4 py-3 px-3 bg-muted/50 cursor-pointer hover:bg-muted"
          onClick={() => toggleProject(project.key)}
        >
          <div className="flex items-center">
            <div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="ml-2 font-medium">{project.name}</div>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-4">
            <div className="text-sm font-medium">Assignees</div>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="text-center p-2 text-sm font-medium">
                  {getProjectTotalHours(project.key, date)}h
                </div>
              ))}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div>
            {epics.map((epic) => renderEpicGroup(epic, project.key))}

            {noEpic.length > 0 && (
              <div className="border-t">
                <div className="grid grid-cols-[350px_1fr] gap-4 py-2">
                  <div className="flex items-center">
                    <div className="ml-4 font-medium text-sm">No Epic</div>
                  </div>

                  <div className="grid grid-cols-[200px_1fr] gap-4">
                    <div className="text-sm font-medium">Assignees</div>
                    <div className="grid grid-cols-7 gap-1">
                      {weekDates.map((date) => (
                        <div key={date.toISOString()} className="text-center p-2 text-sm font-medium">
                          {getEpicTotalHours(noEpic, date)}h
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {noEpic.map((issue) => renderTaskRow(issue))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-muted/30 rounded-md">
        <h3 className="text-sm font-medium mb-2">Legend:</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded"></div>
            <span>Different assignees (Jira vs. Planned)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/20 rounded"></div>
            <span>Hours booked</span>
          </div>
        </div>
      </div>

      {projectGroups.map(renderProjectGroup)}

      {projectGroups.length === 0 && (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No projects or issues found.</p>
          <p className="text-sm text-muted-foreground mt-1">Select projects in the settings to get started.</p>
        </div>
      )}
    </div>
  )
}
