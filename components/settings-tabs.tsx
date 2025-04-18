"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionSettings } from "@/components/connection-settings"
import { ProjectSettings } from "@/components/project-settings"
import { WorkflowSettings } from "@/components/workflow-settings"

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("connection")

  return (
    <Tabs defaultValue="connection" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="connection">Connection</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
      </TabsList>
      <TabsContent value="connection">
        <ConnectionSettings onSuccess={() => setActiveTab("projects")} />
      </TabsContent>
      <TabsContent value="projects">
        <ProjectSettings onSuccess={() => setActiveTab("workflow")} />
      </TabsContent>
      <TabsContent value="workflow">
        <WorkflowSettings />
      </TabsContent>
    </Tabs>
  )
}
