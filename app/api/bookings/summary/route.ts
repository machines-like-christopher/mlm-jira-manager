import { NextResponse } from "next/server"
import { getBookingSummary } from "@/lib/db-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const groupBy = searchParams.get("groupBy") as "user" | "project" | "date"

    if (!startDate || !endDate || !groupBy) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const summary = await getBookingSummary(startDate, endDate, groupBy)
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error("Error fetching booking summary:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch booking summary" },
      { status: 500 },
    )
  }
}
