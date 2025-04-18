"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { JiraProject, JiraIssue, KanbanColumn, JiraConfig } from "@/types/jira"
import { fetchProjects, fetchIssues } from "./jira-service"

interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

interface JiraState {
  isConnected: boolean
  projects: JiraProject[]
  selectedProjects: JiraProject[]
  issues: JiraIssue[]
  columns: KanbanColumn[]
  lastSyncTime?: string
  jiraCredentials?: JiraCredentials
  useManualCredentials: boolean // New flag to toggle between env vars and manual credentials
  filters: {
    assignee?: string
    project?: string
    issueType?: string
    priority?: string
    labels?: string[]
    searchText?: string
  }

  // Actions
  setIsConnected: (isConnected: boolean) => void
  setProjects: (projects: JiraProject[]) => void
  setSelectedProjects: (projects: JiraProject[]) => void
  setIssues: (issues: JiraIssue[]) => void
  setColumns: (columns: KanbanColumn[]) => void
  setLastSyncTime: (time: string) => void
  setJiraCredentials: (credentials: JiraCredentials) => void
  setUseManualCredentials: (useManual: boolean) => void // New action to set the flag
  setFilter: (key: string, value: any) => void
  clearFilters: () => void

  // Thunks
  fetchProjects: () => Promise<JiraProject[]>
  fetchIssues: () => Promise<JiraIssue[]>
  refreshJiraData: () => Promise<void>
  loadConfig: () => JiraConfig
  saveConfig: () => void
}

export const useJiraStore = create<JiraState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      projects: [],
      selectedProjects: [],
      issues: [],
      columns: [], // Start with empty columns - they'll be created from Jira statuses
      useManualCredentials: false, // Default to using environment variables if available
      filters: {},

      setIsConnected: (isConnected) => set({ isConnected }),
      setProjects: (projects) => set({ projects }),
      setSelectedProjects: (projects) => set({ selectedProjects: projects }),
      setIssues: (issues) => set({ issues }),
      setColumns: (columns) => set({ columns }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setJiraCredentials: (credentials) => set({ jiraCredentials: credentials }),
      setUseManualCredentials: (useManual) => set({ useManualCredentials: useManual }),
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      clearFilters: () => set({ filters: {} }),

      fetchProjects: async () => {
        try {
          const { jiraCredentials, useManualCredentials } = get()
          const credentials = useManualCredentials ? jiraCredentials : undefined
          const projects = await fetchProjects(credentials)
          set({ projects, isConnected: true })
          return projects
        } catch (error) {
          console.error("Error fetching projects:", error)
          set({ isConnected: false })
          throw error
        }
      },

      fetchIssues: async () => {
        const { selectedProjects, lastSyncTime, jiraCredentials, useManualCredentials } = get()
        if (selectedProjects.length === 0) return []

        try {
          const projectKeys = selectedProjects.map((p) => p.key)
          const credentials = useManualCredentials ? jiraCredentials : undefined

          // Use lastSyncTime if available, otherwise fetch all issues
          const issues = await fetchIssues(projectKeys, lastSyncTime, credentials)

          // Update the issues list, merging with existing issues
          const currentIssues = get().issues
          const updatedIssues = [...currentIssues]

          // Update or add new issues
          issues.forEach((newIssue) => {
            const existingIndex = updatedIssues.findIndex((i) => i.id === newIssue.id)
            if (existingIndex >= 0) {
              updatedIssues[existingIndex] = newIssue
            } else {
              updatedIssues.push(newIssue)
            }
          })

          set({ issues: updatedIssues })

          // Update the last sync time
          set({ lastSyncTime: new Date().toISOString() })

          return issues
        } catch (error) {
          console.error("Error fetching issues:", error)
          throw error
        }
      },

      refreshJiraData: async () => {
        await get().fetchIssues()
      },

      loadConfig: () => {
        const { selectedProjects, columns, lastSyncTime } = get()
        return { selectedProjects, columns, lastSyncTime }
      },

      saveConfig: () => {
        // This is handled by the persist middleware
      },
    }),
    {
      name: "jira-kanban-storage",
      partialize: (state) => ({
        selectedProjects: state.selectedProjects,
        columns: state.columns,
        lastSyncTime: state.lastSyncTime,
        issues: state.issues,
        jiraCredentials: state.jiraCredentials,
        useManualCredentials: state.useManualCredentials,
      }),
    },
  ),
)
