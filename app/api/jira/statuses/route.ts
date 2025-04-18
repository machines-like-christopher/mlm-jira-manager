import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectKey = searchParams.get("projectKey")

  if (!projectKey) {
    return NextResponse.json({ success: false, error: "Project key is required" }, { status: 400 })
  }

  try {
    const JIRA_BASE_URL = process.env.JIRA_BASE_URL
    const JIRA_EMAIL = process.env.JIRA_EMAIL
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Missing Jira credentials in environment variables" },
        { status: 500 },
      )
    }

    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${projectKey}/statuses`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Jira API error:", errorText)
      return NextResponse.json(
        { success: false, error: `Failed to fetch project statuses: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const statuses: any[] = []

    // Flatten the nested structure of statuses
    data.forEach((issueType: any) => {
      issueType.statuses.forEach((status: any) => {
        if (!statuses.some((s) => s.id === status.id)) {
          statuses.push({
            id: status.id,
            name: status.name,
            statusCategory: status.statusCategory.name,
          })
        }
      })
    })

    return NextResponse.json({ success: true, data: statuses })
  } catch (error) {
    console.error("Error fetching project statuses:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch project statuses" },
      { status: 500 },
    )
  }
}

// Make sure the POST method is properly implemented
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projectKey = body.projectKey
    const credentials = body.credentials

    if (!projectKey) {
      return NextResponse.json({ success: false, error: "Project key is required" }, { status: 400 })
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

    // Remove trailing slash if present
    const baseUrl = JIRA_BASE_URL.endsWith("/") ? JIRA_BASE_URL.slice(0, -1) : JIRA_BASE_URL

    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

    const response = await fetch(`${baseUrl}/rest/api/3/project/${projectKey}/statuses`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Jira API error:", errorText)
      return NextResponse.json(
        { success: false, error: `Failed to fetch project statuses: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const statuses: any[] = []

    // Flatten the nested structure of statuses
    data.forEach((issueType: any) => {
      issueType.statuses.forEach((status: any) => {
        if (!statuses.some((s) => s.id === status.id)) {
          statuses.push({
            id: status.id,
            name: status.name,
            statusCategory: status.statusCategory.name,
          })
        }
      })
    })

    return NextResponse.json({ success: true, data: statuses })
  } catch (error) {
    console.error("Error fetching project statuses:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch project statuses" },
      { status: 500 },
    )
  }
}
