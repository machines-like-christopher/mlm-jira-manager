import Link from "next/link"
import { SettingsTabs } from "@/components/settings-tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Kanban Board
            </Link>
          </Button>
        </div>
        <SettingsTabs />
      </div>
    </main>
  )
}
