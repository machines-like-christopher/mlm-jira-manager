import { NextResponse } from "next/server"

export async function GET() {
  // Only check if environment variables exist, don't return their values for security
  const envStatus = {
    JIRA_BASE_URL: !!process.env.JIRA_BASE_URL,
    JIRA_EMAIL: !!process.env.JIRA_EMAIL,
    JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
    NEXT_PUBLIC_JIRA_BASE_URL: !!process.env.NEXT_PUBLIC_JIRA_BASE_URL,
  }

  // Add the public URL for debugging
  const publicInfo = {
    NEXT_PUBLIC_JIRA_BASE_URL: process.env.NEXT_PUBLIC_JIRA_BASE_URL,
  }

  // Add URL format check
  const urlFormatCheck = {
    hasJIRA_BASE_URL: !!process.env.JIRA_BASE_URL,
    isValidUrl: false,
    hasTrailingSlash: false,
    suggestions: [] as string[],
  }

  if (process.env.JIRA_BASE_URL) {
    try {
      const url = new URL(process.env.JIRA_BASE_URL)
      urlFormatCheck.isValidUrl = true
      urlFormatCheck.hasTrailingSlash = url.href.endsWith("/")

      if (urlFormatCheck.hasTrailingSlash) {
        urlFormatCheck.suggestions.push("Remove trailing slash from JIRA_BASE_URL")
      }

      // Check for common Jira URL patterns
      if (!url.href.includes("atlassian.net") && !url.href.includes("/jira")) {
        urlFormatCheck.suggestions.push("URL doesn't match common Jira patterns (atlassian.net or /jira)")
      }
    } catch (e) {
      urlFormatCheck.isValidUrl = false
      urlFormatCheck.suggestions.push("JIRA_BASE_URL is not a valid URL")
    }
  } else {
    urlFormatCheck.suggestions.push("JIRA_BASE_URL is not set")
  }

  return NextResponse.json({
    envStatus,
    publicInfo,
    urlFormatCheck,
    timestamp: new Date().toISOString(),
    usingEnvVars: envStatus.JIRA_BASE_URL && envStatus.JIRA_EMAIL && envStatus.JIRA_API_TOKEN,
    message:
      envStatus.JIRA_BASE_URL && envStatus.JIRA_EMAIL && envStatus.JIRA_API_TOKEN
        ? "Environment variables are set. Using them for Jira connection."
        : "Environment variables are not set. You'll need to provide Jira credentials in the UI.",
  })
}
