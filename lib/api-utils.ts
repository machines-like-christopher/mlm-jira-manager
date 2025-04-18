/**
 * Utility function to extract Jira credentials from a request or environment variables
 */
export async function getJiraCredentials(request: Request) {
  let JIRA_BASE_URL = ""
  let JIRA_EMAIL = ""
  let JIRA_API_TOKEN = ""
  let requestBody: any = {}
  let source = "none"

  try {
    // First check if the request has a body
    const text = await request.text()

    if (text && text.length > 0) {
      try {
        requestBody = JSON.parse(text)
        console.log("Request body parsed successfully")
      } catch (parseError) {
        console.error("Error parsing request body:", parseError)
        requestBody = {}
      }
    } else {
      console.log("Request body is empty")
    }

    // Check for credentials in the request body
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
      source = "request"
      console.log("Using credentials from request body")
    }
    // Check for credentials in the nested credentials object
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
      source = "request.credentials"
      console.log("Using credentials from request.credentials object")
    }
    // Fall back to environment variables
    else {
      JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
      JIRA_EMAIL = process.env.JIRA_EMAIL || ""
      JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
      source = "environment"
      console.log("Using credentials from environment variables")
    }
  } catch (error) {
    // If request parsing fails, use environment variables
    console.error("Error processing request:", error)
    JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
    JIRA_EMAIL = process.env.JIRA_EMAIL || ""
    JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
    source = "environment (fallback)"
    console.log("Falling back to environment variables due to processing error")
  }

  // Debug log the credential status (without revealing actual values)
  const credentialStatus = {
    hasBaseUrl: !!JIRA_BASE_URL,
    hasEmail: !!JIRA_EMAIL,
    hasApiToken: !!JIRA_API_TOKEN,
    source,
    requestBodyKeys: Object.keys(requestBody),
  }

  console.log("Credential status:", credentialStatus)

  return {
    JIRA_BASE_URL,
    JIRA_EMAIL,
    JIRA_API_TOKEN,
    credentialStatus,
    requestBody,
    hasAllCredentials: !!JIRA_BASE_URL && !!JIRA_EMAIL && !!JIRA_API_TOKEN,
  }
}
