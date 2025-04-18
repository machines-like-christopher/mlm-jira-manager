import type { JiraProject, JiraIssue, JiraStatus } from "@/types/jira"

export interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

// Client-side functions that call our API routes
export async function testConnection(credentials?: JiraCredentials) {
  try {
    console.log("Testing Jira connection", credentials ? "with provided credentials" : "with environment variables")

    // Log credential status without revealing values
    if (credentials) {
      console.log("Credential status:", {
        hasBaseUrl: !!credentials.baseUrl,
        hasEmail: !!credentials.email,
        hasApiToken: !!credentials.apiToken,
      })
    }

    // Ensure we're sending a valid object even if credentials is undefined
    const requestBody = credentials || {}

    console.log("Sending request with body:", {
      hasCredentials: !!credentials,
      bodyKeys: Object.keys(requestBody),
    })

    const response = await fetch("/api/jira/test-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      console.error(`Test connection response not OK: ${response.status} ${response.statusText}`)

      // Try to get more detailed error information
      let errorData
      try {
        errorData = await response.json()
        console.error("Error details:", errorData)
      } catch (jsonError) {
        const textResponse = await response.text()
        console.error("Failed to parse error response as JSON:", textResponse)
        errorData = { error: "Could not parse error response", rawResponse: textResponse.substring(0, 500) }
      }

      return {
        success: false,
        error: errorData.error || `HTTP error: ${response.status} ${response.statusText}`,
        details: errorData.details || errorData,
      }
    }

    const data = await response.json()

    if (!data.success) {
      console.error("Test connection failed:", data.error, data.details)
    }

    return data
  } catch (error) {
    console.error("Error testing Jira connection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown client-side error",
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    }
  }
}

export async function fetchProjects(credentials?: JiraCredentials): Promise<JiraProject[]> {
  try {
    // Ensure we're sending a valid object even if credentials is undefined
    const requestBody = credentials || {}

    const response = await fetch("/api/jira/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Fetch projects response not OK: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      console.error("Fetch projects failed:", data.error, data.details)
      throw new Error(data.error || "Failed to fetch projects")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching Jira projects:", error)
    throw error
  }
}

export async function fetchProjectStatuses(
  projectIdOrKey: string,
  credentials?: JiraCredentials,
): Promise<JiraStatus[]> {
  try {
    const response = await fetch(`/api/jira/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectKey: projectIdOrKey,
        credentials: credentials || null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Fetch statuses response not OK: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      console.error("Fetch statuses failed:", data.error, data.details)
      throw new Error(data.error || "Failed to fetch project statuses")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching project statuses:", error)
    throw error
  }
}

export async function fetchIssues(
  projectKeys: string[],
  lastUpdated?: string,
  credentials?: JiraCredentials,
): Promise<JiraIssue[]> {
  try {
    const response = await fetch("/api/jira/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectKeys,
        lastUpdated,
        credentials: credentials || null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Fetch issues response not OK: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      console.error("Fetch issues failed:", data.error, data.details)
      throw new Error(data.error || "Failed to fetch issues")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching Jira issues:", error)
    throw error
  }
}
