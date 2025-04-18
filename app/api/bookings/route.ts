import { NextResponse } from "next/server"
import { getBookings, createOrUpdateBooking, deleteBooking } from "@/lib/db-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      epicId: searchParams.get("epicId") || undefined,
      taskId: searchParams.get("taskId") || undefined,
      userId: searchParams.get("userId") || undefined,
    }

    const bookings = await getBookings(filters)
    return NextResponse.json({ success: true, data: bookings })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, userId, date, hours, id } = body

    if (!taskId || !userId || !date || hours === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    try {
      const booking = await createOrUpdateBooking({ taskId, userId, date, hours, id })
      return NextResponse.json({ success: true, data: booking })
    } catch (dbError) {
      console.error("Database error creating/updating booking:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: dbError instanceof Error ? dbError.message : "Database error creating/updating booking",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating/updating booking:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create/update booking" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing booking ID" }, { status: 400 })
    }

    try {
      const success = await deleteBooking(id)
      return NextResponse.json({ success })
    } catch (dbError) {
      console.error("Database error deleting booking:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: dbError instanceof Error ? dbError.message : "Database error deleting booking",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete booking" },
      { status: 500 },
    )
  }
}
