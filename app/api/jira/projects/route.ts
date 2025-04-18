import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    let JIRA_BASE_URL: string
    let JIRA_EMAIL: string
    let JIRA_API_TOKEN: string
    let requestBody = {}

    // Try to get credentials from request body
    try {
      // First check if the request has a body
      const text = await request.text()

      if (text && text.length > 0) {
        try {
          requestBody = JSON.parse(text)
        } catch (parseError) {
          console.error("Error parsing request body:", parseError)
          requestBody = {}
        }
      }

      // Now check if we have credentials in the request body
      if (
        requestBody &&
        typeof requestBody === "object" &&
        "baseUrl" in requestBody &&
        "email" in requestBody &&
        "apiToken" in requestBody
      ) {
        JIRA_BASE_URL = requestBody.baseUrl
        JIRA_EMAIL = requestBody.email
        JIRA_API_TOKEN = requestBody.apiToken
        console.log("Using credentials from request body")
      } else {
        // Fall back to environment variables
        JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
        JIRA_EMAIL = process.env.JIRA_EMAIL || ""
        JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
        console.log("Using credentials from environment variables")
      }
    } catch (error) {
      // If request parsing fails, use environment variables
      console.error("Error processing request:", error)
      JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
      JIRA_EMAIL = process.env.JIRA_EMAIL || ""
      JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
      console.log("Falling back to environment variables due to processing error")
    }

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Jira credentials. Please provide them in the request or set environment variables.",
          details: {
            hasBaseUrl: !!JIRA_BASE_URL,
            hasEmail: !!JIRA_EMAIL,
            hasApiToken: !!JIRA_API_TOKEN,
            envVars: {
              hasJIRA_BASE_URL: !!process.env.JIRA_BASE_URL,
              hasJIRA_EMAIL: !!process.env.JIRA_EMAIL,
              hasJIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
            },
          },
        },
        { status: 400 },
      )
    }

    // Remove trailing slash if present
    const baseUrl = JIRA_BASE_URL.endsWith("/") ? JIRA_BASE_URL.slice(0, -1) : JIRA_BASE_URL

    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
    const headers = {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    // Try v2 API first
    console.log(`Fetching projects from: ${baseUrl}/rest/api/2/project`)
    let response = await fetch(`${baseUrl}/rest/api/2/project`, {
      method: "GET",
      headers,
    })

    // If v2 fails, try v3
    if (!response.ok && response.status === 404) {
      console.log(`v2 API failed, trying v3 API at: ${baseUrl}/rest/api/3/project`)
      response = await fetch(`${baseUrl}/rest/api/3/project`, {
        method: "GET",
        headers,
      })
    }

    // Check if we got an HTML response
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("text/html")) {
      const htmlContent = await response.text()
      console.error("Received HTML response instead of JSON:", htmlContent.substring(0, 200) + "...")
      return NextResponse.json(
        {
          success: false,
          error: "Received HTML response from Jira. The URL might be incorrect or the API version is not supported.",
          details: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          },
        },
        { status: 500 },
      )
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
        console.error("Jira API error:", errorData)
      } catch (jsonError) {
        const textResponse = await response.text()
        console.error("Failed to parse error response as JSON:", textResponse)
        errorData = { message: "Could not parse error response", rawResponse: textResponse.substring(0, 500) }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch projects: ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            message: errorData.message || "No error message provided",
            url: response.url,
          },
        },
        { status: response.status },
      )
    }

    const projects = await response.json()
    const formattedProjects = projects.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls ? project.avatarUrls["48x48"] : null,
    }))

    return NextResponse.json({
      success: true,
      data: formattedProjects,
      apiVersion: response.url.includes("/api/3/") ? "v3" : "v2",
    })
  } catch (error) {
    console.error("Error fetching Jira projects:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Jira projects",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// For backward compatibility
export { POST as GET }
