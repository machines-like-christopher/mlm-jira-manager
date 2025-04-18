export interface JiraProject {
  id: string
  key: string
  name: string
  avatarUrl?: string
}

export interface JiraStatus {
  id: string
  name: string
  statusCategory: string
}

export interface JiraUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface JiraIssueType {
  id: string
  name: string
  iconUrl?: string
}

export interface JiraPriority {
  id: string
  name: string
  iconUrl?: string
}

export interface JiraIssue {
  id: string
  key: string
  summary: string
  status: JiraStatus
  assignee: JiraUser | null
  issueType: JiraIssueType
  priority: JiraPriority | null
  reporter: JiraUser | null
  labels: string[]
  created: string
  updated: string
  project: {
    id: string
    key: string
    name: string
  }
}

export interface KanbanColumn {
  id: string
  name: string
  statusIds: string[]
}

export interface JiraConfig {
  selectedProjects: JiraProject[]
  columns: KanbanColumn[]
  lastSyncTime?: string
}
