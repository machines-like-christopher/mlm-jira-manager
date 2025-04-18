import type React from "react"
import { Header } from "@/components/header"

export default function ResourceAllocationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
    </div>
  )
}
