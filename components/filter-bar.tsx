"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

export function FilterBar() {
  const { issues, selectedProjects, filters, setFilter, clearFilters } = useJiraStore()

  const [searchText, setSearchText] = useState(filters.searchText || "")

  // Get unique values for filter dropdowns
  const assignees = Array.from(new Set(issues.filter((issue) => issue.assignee).map((issue) => issue.assignee!))).sort(
    (a, b) => a.name.localeCompare(b.name),
  )

  const projects = selectedProjects

  const issueTypes = Array.from(
    new Set(
      issues.map((issue) =>
        JSON.stringify({
          id: issue.issueType.id,
          name: issue.issueType.name,
          iconUrl: issue.issueType.iconUrl,
        }),
      ),
    ),
  ).map((type) => JSON.parse(type))

  const priorities = Array.from(
    new Set(
      issues
        .filter((issue) => issue.priority)
        .map((issue) =>
          JSON.stringify({
            id: issue.priority!.id,
            name: issue.priority!.name,
            iconUrl: issue.priority!.iconUrl,
          }),
        ),
    ),
  ).map((priority) => JSON.parse(priority))

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter("searchText", searchText)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchText, setFilter])

  const hasActiveFilters = Object.values(filters).some(
    (value) =>
      value !== undefined &&
      (typeof value === "string" ? value !== "" : Array.isArray(value) ? value.length > 0 : true),
  )

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select value={filters.assignee || ""} onValueChange={(value) => setFilter("assignee", value || undefined)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {assignees.map((assignee) => (
            <SelectItem key={assignee.id} value={assignee.id}>
              {assignee.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.project || ""} onValueChange={(value) => setFilter("project", value || undefined)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.key}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.issueType || ""} onValueChange={(value) => setFilter("issueType", value || undefined)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Issue Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {issueTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                {type.iconUrl && <img src={type.iconUrl || "/placeholder.svg"} alt={type.name} className="w-4 h-4" />}
                {type.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority || ""} onValueChange={(value) => setFilter("priority", value || undefined)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {priorities.map((priority) => (
            <SelectItem key={priority.id} value={priority.id}>
              <div className="flex items-center gap-2">
                {priority.iconUrl && (
                  <img src={priority.iconUrl || "/placeholder.svg"} alt={priority.name} className="w-4 h-4" />
                )}
                {priority.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
