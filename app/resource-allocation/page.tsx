import { ResourceAllocation } from "@/components/resource-allocation"

export default function ResourceAllocationPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 p-4 md:p-6">
        <ResourceAllocation />
      </div>
    </main>
  )
}
