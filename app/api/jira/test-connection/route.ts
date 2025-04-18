import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    let JIRA_BASE_URL = ""
    let JIRA_EMAIL = ""
    let JIRA_API_TOKEN = ""
    let requestBody: any = {}

    // Try to get credentials from request body
    try {
      // First check if the request has a body
      const text = await request.text()
      console.log("Request body text length:", text.length)

      if (text && text.length > 0) {
        try {
          requestBody = JSON.parse(text)
          console.log("Request body parsed successfully, keys:", Object.keys(requestBody))
        } catch (parseError) {
          console.error("Error parsing request body:", parseError)
          requestBody = {}
        }
      } else {
        console.log("Request body is empty")
      }

      // Direct credentials in request body
      if (
        requestBody &&
        typeof requestBody === "object" &&
        requestBody.baseUrl &&
        requestBody.email &&
        requestBody.apiToken
      ) {
        JIRA_BASE_URL = requestBody.baseUrl
        JIRA_EMAIL = requestBody.email
        JIRA_API_TOKEN = requestBody.apiToken
        console.log("Using credentials from request body")
      }
      // Credentials in nested credentials object
      else if (
        requestBody &&
        typeof requestBody === "object" &&
        requestBody.credentials &&
        typeof requestBody.credentials === "object" &&
        requestBody.credentials.baseUrl &&
        requestBody.credentials.email &&
        requestBody.credentials.apiToken
      ) {
        JIRA_BASE_URL = requestBody.credentials.baseUrl
        JIRA_EMAIL = requestBody.credentials.email
        JIRA_API_TOKEN = requestBody.credentials.apiToken
        console.log("Using credentials from nested credentials object")
      }
      // Fall back to environment variables
      else {
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

    // Debug log the credential status (without revealing actual values)
    console.log("Credential status:", {
      hasBaseUrl: !!JIRA_BASE_URL,
      hasEmail: !!JIRA_EMAIL,
      hasApiToken: !!JIRA_API_TOKEN,
      requestBodyEmpty: Object.keys(requestBody).length === 0,
    })

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      console.error("Missing Jira credentials", {
        hasBaseUrl: !!JIRA_BASE_URL,
        hasEmail: !!JIRA_EMAIL,
        hasApiToken: !!JIRA_API_TOKEN,
      })
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
            requestBodyKeys: Object.keys(requestBody),
          },
        },
        { status: 400 },
      )
    }

    // Remove trailing slash if present
    const baseUrl = JIRA_BASE_URL.endsWith("/") ? JIRA_BASE_URL.slice(0, -1) : JIRA_BASE_URL
    console.log(`Connecting to Jira at: ${baseUrl}`)

    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
    const headers = {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    // Try v2 API first (more widely supported)
    console.log(`Trying to connect to Jira at: ${baseUrl}/rest/api/2/myself`)
    let response
    try {
      response = await fetch(`${baseUrl}/rest/api/2/myself`, {
        method: "GET",
        headers,
      })
      console.log(`v2 API response status: ${response.status}`)
    } catch (fetchError) {
      console.error("Fetch error with v2 API:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: `Network error connecting to Jira: ${fetchError.message || "Unknown network error"}`,
          details: {
            message: fetchError.message,
            stack: fetchError.stack,
          },
        },
        { status: 500 },
      )
    }

    // If v2 fails, try v3
    if (!response.ok && response.status === 404) {
      console.log(`v2 API failed, trying v3 API at: ${baseUrl}/rest/api/3/myself`)
      try {
        response = await fetch(`${baseUrl}/rest/api/3/myself`, {
          method: "GET",
          headers,
        })
        console.log(`v3 API response status: ${response.status}`)
      } catch (fetchError) {
        console.error("Fetch error with v3 API:", fetchError)
        return NextResponse.json(
          {
            success: false,
            error: `Network error connecting to Jira v3 API: ${fetchError.message || "Unknown network error"}`,
            details: {
              message: fetchError.message,
              stack: fetchError.stack,
            },
          },
          { status: 500 },
        )
      }
    }

    // Check if we got an HTML response (usually an error page)
    const contentType = response.headers.get("content-type") || ""
    console.log(`Response content type: ${contentType}`)

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
            contentType: contentType,
            htmlPreview: htmlContent.substring(0, 200) + "...",
          },
        },
        { status: 500 },
      )
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
        console.error("Jira API error response:", errorData)
      } catch (jsonError) {
        const textResponse = await response.text()
        console.error("Failed to parse error response as JSON:", textResponse)
        errorData = { message: "Could not parse error response", rawResponse: textResponse.substring(0, 500) }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to Jira: ${response.statusText || "Unknown error"}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            message: errorData.message || errorData.errorMessages?.join(", ") || "No error message provided",
            url: response.url,
            errorData: errorData,
          },
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      data,
      apiVersion: response.url.includes("/api/3/") ? "v3" : "v2",
    })
  } catch (error) {
    console.error("Unhandled error in test-connection route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}

// For backward compatibility
export { POST as GET }
