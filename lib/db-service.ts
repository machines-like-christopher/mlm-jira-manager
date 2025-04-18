import { createSupabaseAdmin } from "./supabase"

// Define the database schema
export interface Booking {
  id: string
  taskId: string
  userId: string
  date: string
  hours: number
  created_at?: string
  updated_at?: string
}

export interface PlanningAssignment {
  id?: string
  taskId: string
  plannedAssigneeId: string
  created_at?: string
  updated_at?: string
}

// Helper function to convert snake_case to camelCase for booking objects
const formatBooking = (booking: any): Booking => ({
  id: booking.id,
  taskId: booking.task_id,
  userId: booking.user_id,
  date: booking.date,
  hours: Number(booking.hours),
  created_at: booking.created_at,
  updated_at: booking.updated_at,
})

// Helper function to convert camelCase to snake_case for database insertion
const prepareBookingForDb = (booking: Omit<Booking, "id"> & { id?: string }) => ({
  ...(booking.id ? { id: booking.id } : {}),
  task_id: booking.taskId,
  user_id: booking.userId,
  date: booking.date,
  hours: booking.hours,
})

// Helper function to convert snake_case to camelCase for assignment objects
const formatAssignment = (assignment: any): PlanningAssignment => ({
  id: assignment.id,
  taskId: assignment.task_id,
  plannedAssigneeId: assignment.planned_assignee_id,
  created_at: assignment.created_at,
  updated_at: assignment.updated_at,
})

// Helper function to convert camelCase to snake_case for database insertion
const prepareAssignmentForDb = (assignment: PlanningAssignment) => ({
  ...(assignment.id ? { id: assignment.id } : {}),
  task_id: assignment.taskId,
  planned_assignee_id: assignment.plannedAssigneeId,
})

// Booking CRUD operations
export async function getBookings(filters?: {
  startDate?: string
  endDate?: string
  projectId?: string
  epicId?: string
  taskId?: string
  userId?: string
}): Promise<Booking[]> {
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase.from("bookings").select("*")

    if (filters) {
      if (filters.startDate) {
        query = query.gte("date", filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate)
      }
      if (filters.taskId) {
        query = query.eq("task_id", filters.taskId)
      }
      if (filters.userId) {
        query = query.eq("user_id", filters.userId)
      }
      // Note: projectId and epicId filtering would require additional logic
      // since these are not direct columns in our table
    }

    const { data, error } = await query.order("date", { ascending: true })

    if (error) {
      console.error("Error fetching bookings:", error)
      return []
    }

    return (data || []).map(formatBooking)
  } catch (error) {
    console.error("Error getting bookings:", error)
    return []
  }
}

export async function createOrUpdateBooking(booking: Omit<Booking, "id"> & { id?: string }): Promise<Booking> {
  try {
    const supabase = createSupabaseAdmin()
    const bookingData = prepareBookingForDb(booking)

    if (booking.id) {
      // Update existing booking
      const { data, error } = await supabase
        .from("bookings")
        .update({ ...bookingData, updated_at: new Date().toISOString() })
        .eq("id", booking.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating booking:", error)
        throw error
      }

      return formatBooking(data)
    } else {
      // Check if a booking already exists for this task, user, and date
      const { data: existingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("task_id", booking.taskId)
        .eq("user_id", booking.userId)
        .eq("date", booking.date)
        .maybeSingle()

      if (existingData) {
        // Update the existing booking
        const { data, error } = await supabase
          .from("bookings")
          .update({ ...bookingData, updated_at: new Date().toISOString() })
          .eq("id", existingData.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating existing booking:", error)
          throw error
        }

        return formatBooking(data)
      } else {
        // Create new booking
        const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

        if (error) {
          console.error("Error creating booking:", error)
          throw error
        }

        return formatBooking(data)
      }
    }
  } catch (error) {
    console.error("Error creating/updating booking:", error)
    throw error
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from("bookings").delete().eq("id", id)

    if (error) {
      console.error("Error deleting booking:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting booking:", error)
    return false
  }
}

// Planning Assignment operations
export async function getPlanningAssignments(filters?: {
  taskId?: string
  projectId?: string
  epicId?: string
}): Promise<PlanningAssignment[]> {
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase.from("planning_assignments").select("*")

    if (filters?.taskId) {
      query = query.eq("task_id", filters.taskId)
    }
    // Note: projectId and epicId filtering would require additional logic

    const { data, error } = await query

    if (error) {
      console.error("Error fetching planning assignments:", error)
      return []
    }

    return (data || []).map(formatAssignment)
  } catch (error) {
    console.error("Error getting planning assignments:", error)
    return []
  }
}

export async function createOrUpdatePlanningAssignment(assignment: PlanningAssignment): Promise<PlanningAssignment> {
  try {
    const supabase = createSupabaseAdmin()
    const assignmentData = prepareAssignmentForDb(assignment)

    // Check if assignment already exists for this task
    const { data: existingData } = await supabase
      .from("planning_assignments")
      .select("*")
      .eq("task_id", assignment.taskId)
      .maybeSingle()

    if (existingData) {
      // Update existing assignment
      const { data, error } = await supabase
        .from("planning_assignments")
        .update({ ...assignmentData, updated_at: new Date().toISOString() })
        .eq("id", existingData.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating planning assignment:", error)
        throw error
      }

      return formatAssignment(data)
    } else {
      // Create new assignment
      const { data, error } = await supabase.from("planning_assignments").insert(assignmentData).select().single()

      if (error) {
        console.error("Error creating planning assignment:", error)
        throw error
      }

      return formatAssignment(data)
    }
  } catch (error) {
    console.error("Error creating/updating planning assignment:", error)
    throw error
  }
}

// Aggregation functions
export async function getBookingSummary(
  startDate: string,
  endDate: string,
  groupBy: "user" | "project" | "date",
): Promise<Record<string, number>> {
  try {
    const bookings = await getBookings({ startDate, endDate })
    const summary: Record<string, number> = {}

    bookings.forEach((booking) => {
      let key: string

      switch (groupBy) {
        case "user":
          key = booking.userId
          break
        case "project":
          key = booking.taskId.split("-")[0] // Assuming project key is the prefix of the task ID
          break
        case "date":
          key = booking.date
          break
        default:
          key = booking.taskId
      }

      if (!summary[key]) {
        summary[key] = 0
      }
      summary[key] += booking.hours
    })

    return summary
  } catch (error) {
    console.error("Error getting booking summary:", error)
    return {}
  }
}
