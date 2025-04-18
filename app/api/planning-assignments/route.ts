import { NextResponse } from "next/server"
import { getPlanningAssignments, createOrUpdatePlanningAssignment } from "@/lib/db-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      taskId: searchParams.get("taskId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      epicId: searchParams.get("epicId") || undefined,
    }

    const assignments = await getPlanningAssignments(filters)
    return NextResponse.json({ success: true, data: assignments })
  } catch (error) {
    console.error("Error fetching planning assignments:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch planning assignments" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, plannedAssigneeId } = body

    if (!taskId || !plannedAssigneeId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    try {
      const assignment = await createOrUpdatePlanningAssignment({ taskId, plannedAssigneeId })
      return NextResponse.json({ success: true, data: assignment })
    } catch (dbError) {
      console.error("Database error creating/updating planning assignment:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: dbError instanceof Error ? dbError.message : "Database error creating/updating planning assignment",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating/updating planning assignment:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create/update planning assignment" },
      { status: 500 },
    )
  }
}
