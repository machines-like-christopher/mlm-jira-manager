import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectKeys, lastUpdated, credentials } = body

    if (!projectKeys || !Array.isArray(projectKeys) || projectKeys.length === 0) {
      return NextResponse.json({ success: false, error: "Project keys are required" }, { status: 400 })
    }

    let JIRA_BASE_URL: string
    let JIRA_EMAIL: string
    let JIRA_API_TOKEN: string

    if (credentials && credentials.baseUrl && credentials.email && credentials.apiToken) {
      JIRA_BASE_URL = credentials.baseUrl
      JIRA_EMAIL = credentials.email
      JIRA_API_TOKEN = credentials.apiToken
    } else {
      JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
      JIRA_EMAIL = process.env.JIRA_EMAIL || ""
      JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
    }

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Missing Jira credentials in environment variables or request" },
        { status: 400 },
      )
    }

    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    const projectQuery = projectKeys.map((key) => `project=${key}`).join(" OR ")
    let jql = `(${projectQuery})`

    if (lastUpdated) {
      // Format the date to a Jira-compatible format (yyyy-MM-dd HH:mm)
      const date = new Date(lastUpdated)
      const formattedDate = formatDateForJira(date)
      jql += ` AND updated >= '${formattedDate}'`
    }

    console.log("JQL Query:", jql)

    // Remove trailing slash if present
    const baseUrl = JIRA_BASE_URL.endsWith("/") ? JIRA_BASE_URL.slice(0, -1) : JIRA_BASE_URL

    // Try v2 API first
    let apiEndpoint = `${baseUrl}/rest/api/2/search`
    console.log("Fetching issues from:", apiEndpoint)

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql,
        maxResults: 100,
        fields: [
          "summary",
          "status",
          "assignee",
          "issuetype",
          "priority",
          "reporter",
          "labels",
          "created",
          "updated",
          "project",
        ],
      }),
    })

    // Check if we got an HTML response
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("text/html")) {
      const htmlContent = await response.text()
      console.error("Received HTML response instead of JSON:", htmlContent.substring(0, 200) + "...")

      // Try v3 API if v2 returns HTML
      apiEndpoint = `${baseUrl}/rest/api/3/search`
      console.log("Trying v3 API at:", apiEndpoint)

      const v3Response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: [
            "summary",
            "status",
            "assignee",
            "issuetype",
            "priority",
            "reporter",
            "labels",
            "created",
            "updated",
            "project",
          ],
        }),
      })

      if (!v3Response.ok) {
        const errorText = await v3Response.text()
        console.error("Jira API v3 error:", errorText)
        return NextResponse.json(
          { success: false, error: `Failed to fetch issues: ${v3Response.statusText}`, details: errorText },
          { status: v3Response.status },
        )
      }

      const v3Data = await v3Response.json()
      const issues = formatIssues(v3Data.issues)
      return NextResponse.json({ success: true, data: issues })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Jira API error:", errorText)
      return NextResponse.json(
        { success: false, error: `Failed to fetch issues: ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    const issues = formatIssues(data.issues)

    return NextResponse.json({ success: true, data: issues })
  } catch (error) {
    console.error("Error fetching Jira issues:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch Jira issues" },
      { status: 500 },
    )
  }
}

// Helper function to format date for Jira JQL
function formatDateForJira(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Helper function to format issues
function formatIssues(issues: any[]): any[] {
  return issues.map((issue) => ({
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    status: {
      id: issue.fields.status.id,
      name: issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.name,
    },
    assignee: issue.fields.assignee
      ? {
          id: issue.fields.assignee.accountId,
          name: issue.fields.assignee.displayName,
          avatarUrl: issue.fields.assignee.avatarUrls ? issue.fields.assignee.avatarUrls["48x48"] : null,
        }
      : null,
    issueType: {
      id: issue.fields.issuetype.id,
      name: issue.fields.issuetype.name,
      iconUrl: issue.fields.issuetype.iconUrl,
    },
    priority: issue.fields.priority
      ? {
          id: issue.fields.priority.id,
          name: issue.fields.priority.name,
          iconUrl: issue.fields.priority.iconUrl,
        }
      : null,
    reporter: issue.fields.reporter
      ? {
          id: issue.fields.reporter.accountId,
          name: issue.fields.reporter.displayName,
          avatarUrl: issue.fields.reporter.avatarUrls ? issue.fields.reporter.avatarUrls["48x48"] : null,
        }
      : null,
    labels: issue.fields.labels || [],
    created: issue.fields.created,
    updated: issue.fields.updated,
    project: {
      id: issue.fields.project.id,
      key: issue.fields.project.key,
      name: issue.fields.project.name,
    },
  }))
}
