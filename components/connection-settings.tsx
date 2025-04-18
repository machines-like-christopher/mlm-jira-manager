"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { testConnection } from "@/lib/jira-service"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { DebugEnv } from "@/components/debug-env"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ConnectionSettingsProps {
  onSuccess?: () => void
}

export function ConnectionSettings({ onSuccess }: ConnectionSettingsProps) {
  const { toast } = useToast()
  const {
    isConnected,
    setIsConnected,
    jiraCredentials,
    setJiraCredentials,
    useManualCredentials,
    setUseManualCredentials,
  } = useJiraStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [jiraUrl, setJiraUrl] = useState("")
  const [jiraEmail, setJiraEmail] = useState("")
  const [jiraApiToken, setJiraApiToken] = useState("")
  const [envVarsAvailable, setEnvVarsAvailable] = useState(true)

  // Fetch the URL from environment variable or stored credentials
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/debug/env")
        const data = await response.json()

        const hasEnvVars = data.envStatus.JIRA_BASE_URL && data.envStatus.JIRA_EMAIL && data.envStatus.JIRA_API_TOKEN

        setEnvVarsAvailable(hasEnvVars)

        if (hasEnvVars && !useManualCredentials) {
          setJiraUrl(process.env.NEXT_PUBLIC_JIRA_BASE_URL || "")
        } else if (jiraCredentials) {
          setJiraUrl(jiraCredentials.baseUrl || "")
          setJiraEmail(jiraCredentials.email || "")
          setJiraApiToken(jiraCredentials.apiToken || "")
        }
      } catch (error) {
        console.error("Error checking environment variables:", error)
        setEnvVarsAvailable(false)
      }
    }

    checkEnvVars()
  }, [jiraCredentials, useManualCredentials])

  // If environment variables are not available, force manual credentials mode
  useEffect(() => {
    if (!envVarsAvailable && !useManualCredentials) {
      setUseManualCredentials(true)
    }
  }, [envVarsAvailable, useManualCredentials, setUseManualCredentials])

  const handleTestConnection = async () => {
    setLoading(true)
    setError(null)
    setErrorDetails(null)

    // Validate inputs when using manual credentials
    if (useManualCredentials) {
      if (!jiraUrl) {
        setError("Jira URL is required")
        setLoading(false)
        return
      }

      if (!jiraEmail) {
        setError("Jira Email is required")
        setLoading(false)
        return
      }

      if (!jiraApiToken) {
        setError("Jira API Token is required")
        setLoading(false)
        return
      }

      // Basic URL validation
      try {
        new URL(jiraUrl)
      } catch (e) {
        setError("Invalid Jira URL format. Please enter a valid URL.")
        setLoading(false)
        return
      }
    }

    try {
      // Create credentials object for manual mode
      let credentials = undefined

      if (useManualCredentials) {
        credentials = {
          baseUrl: jiraUrl,
          email: jiraEmail,
          apiToken: jiraApiToken,
        }

        // Save to store for future use
        setJiraCredentials(credentials)

        console.log("Using manual credentials:", {
          hasBaseUrl: !!credentials.baseUrl,
          hasEmail: !!credentials.email,
          hasApiToken: !!credentials.apiToken,
        })
      } else {
        console.log("Using environment variables for credentials")
      }

      // Test the connection
      const result = await testConnection(credentials)

      if (result.success) {
        setIsConnected(true)
        toast({
          title: "Connection successful",
          description: `Successfully connected to your Jira instance using API ${result.apiVersion}.`,
        })

        if (onSuccess) {
          onSuccess()
        }
      } else {
        setIsConnected(false)
        setError(result.error || "Failed to connect to your Jira instance. Please check your credentials.")
        setErrorDetails(result.details || null)

        toast({
          title: "Connection failed",
          description: result.error || "Failed to connect to your Jira instance. Please check your credentials.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsConnected(false)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect to your Jira instance. Please check your credentials and network connection."

      setError(errorMessage)
      setErrorDetails(error instanceof Error ? { stack: error.stack, type: error.constructor.name } : null)

      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Connection error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Jira Connection</CardTitle>
          <CardDescription>Configure your connection to Jira. You'll need your Jira URL and API token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                {errorDetails && (
                  <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="error-details">
                      <AccordionTrigger className="text-xs">View Error Details</AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px] whitespace-pre-wrap">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </AlertDescription>
            </Alert>
          )}

          {envVarsAvailable && (
            <div className="flex items-center justify-between space-x-2 mb-4">
              <div className="space-y-0.5">
                <Label htmlFor="use-manual-credentials">Use Manual Credentials</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle to use manually entered credentials instead of environment variables
                </p>
              </div>
              <Switch
                id="use-manual-credentials"
                checked={useManualCredentials}
                onCheckedChange={setUseManualCredentials}
              />
            </div>
          )}

          {!envVarsAvailable && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Environment Variables Not Found</AlertTitle>
              <AlertDescription>
                No environment variables detected. Please enter your Jira credentials below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="jira-url">Jira URL</Label>
            <Input
              id="jira-url"
              placeholder="https://your-domain.atlassian.net"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              disabled={envVarsAvailable && !useManualCredentials}
            />
            {envVarsAvailable && !useManualCredentials ? (
              <p className="text-xs text-muted-foreground">
                This is set via environment variables and cannot be changed here.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter your Jira instance URL (e.g., https://your-domain.atlassian.net)
              </p>
            )}
          </div>

          {(useManualCredentials || !envVarsAvailable) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="jira-email">Jira Email</Label>
                <Input
                  id="jira-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">The email address associated with your Jira account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-api-token">Jira API Token</Label>
                <Input
                  id="jira-api-token"
                  type="password"
                  placeholder="Your Jira API token"
                  value={jiraApiToken}
                  onChange={(e) => setJiraApiToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Jira API token. You can generate one in your Atlassian account settings.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 mt-4">
            <div className="text-sm font-medium">Connection Status:</div>
            {isConnected ? (
              <div className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <XCircle className="h-4 w-4 mr-1" />
                Not Connected
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTestConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>
        </CardFooter>
      </Card>
      <DebugEnv />
    </>
  )
}
