"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useJiraStore } from "@/lib/store"

export function DebugEnv() {
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { useManualCredentials, jiraCredentials } = useJiraStore()

  const checkEnvVars = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/env")
      const data = await response.json()

      // Add information about the current connection mode
      data.connectionMode = {
        useManualCredentials,
        hasStoredCredentials: !!jiraCredentials,
        manualBaseUrl: jiraCredentials?.baseUrl || null,
        // Don't include sensitive information like email and API token
      }

      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      })
    } finally {
      setLoading(false)
    }
  }

  const testFetch = async () => {
    setLoading(true)
    try {
      // Test a simple fetch to verify network connectivity
      const response = await fetch("https://httpbin.org/get")
      const data = await response.json()

      setDebugInfo({
        ...debugInfo,
        networkTest: {
          success: true,
          status: response.status,
          data: data,
        },
      })
    } catch (error) {
      setDebugInfo({
        ...debugInfo,
        networkTest: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : null,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const testCredentials = async () => {
    setLoading(true)
    try {
      // Create a test object with the current credentials
      const testObject = {
        useManualCredentials,
        hasStoredCredentials: !!jiraCredentials,
        manualCredentials: useManualCredentials
          ? {
              hasBaseUrl: !!jiraCredentials?.baseUrl,
              hasEmail: !!jiraCredentials?.email,
              hasApiToken: !!jiraCredentials?.apiToken,
            }
          : null,
        envVars: {
          hasJIRA_BASE_URL: !!process.env.JIRA_BASE_URL,
          hasJIRA_EMAIL: !!process.env.JIRA_EMAIL,
          hasJIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
          NEXT_PUBLIC_JIRA_BASE_URL: process.env.NEXT_PUBLIC_JIRA_BASE_URL,
        },
      }

      setDebugInfo({
        ...debugInfo,
        credentialsTest: testObject,
      })
    } catch (error) {
      setDebugInfo({
        ...debugInfo,
        credentialsTest: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : null,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Connection Troubleshooting</CardTitle>
        <CardDescription>
          If you're having trouble connecting to Jira, you can use these tools to help diagnose the issue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Current Configuration</AlertTitle>
          <AlertDescription>
            <div>
              Connecting to:{" "}
              <strong>
                {jiraCredentials?.baseUrl ||
                  process.env.NEXT_PUBLIC_JIRA_BASE_URL ||
                  "https://machineslikeme.atlassian.net"}
              </strong>
            </div>
            <div>
              Credential Mode: <strong>{useManualCredentials ? "Manual Credentials" : "Environment Variables"}</strong>
            </div>
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full mb-4">
          <AccordionItem value="troubleshooting">
            <AccordionTrigger>Common Troubleshooting Steps</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1. Check your Jira URL format:</strong> Make sure it's in the correct format without trailing
                  slashes.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Jira Cloud:</strong> https://your-domain.atlassian.net
                  </li>
                  <li>
                    <strong>Jira Server/Data Center:</strong> https://jira.your-company.com
                  </li>
                </ul>
                <p>
                  <strong>2. Verify your API token:</strong> For Jira Cloud, you need an API token generated from your
                  Atlassian account.
                </p>
                <p>
                  <strong>3. Check permissions:</strong> The account associated with your email and API token must have
                  sufficient permissions.
                </p>
                <p>
                  <strong>4. Try direct access:</strong> Try accessing your Jira instance directly in a browser to
                  ensure it's available.
                </p>
                <p>
                  <strong>5. Network issues:</strong> Make sure your network allows connections to Jira. Some corporate
                  networks or VPNs might block these connections.
                </p>
                <p>
                  <strong>6. CORS issues:</strong> If you're seeing CORS errors, this might be due to browser security
                  restrictions. The server-side API routes should handle this properly.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setShowDebug(!showDebug)
              if (!debugInfo || !showDebug) checkEnvVars()
            }}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </Button>

          <Button onClick={testFetch} disabled={loading} variant="outline">
            Test Network
          </Button>

          <Button onClick={testCredentials} disabled={loading} variant="outline">
            Test Credentials
          </Button>
        </div>

        {showDebug && debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-[300px]">
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-blue-500" />
          <p className="text-sm text-muted-foreground">
            Make sure you've added all required environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and
            NEXT_PUBLIC_JIRA_BASE_URL.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
