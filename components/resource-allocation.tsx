"use client"

import { useState, useEffect } from "react"
import { useJiraStore } from "@/lib/store"
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Info } from "lucide-react"
import { ProjectTree } from "@/components/project-tree"
import { useToast } from "@/components/ui/use-toast"
import type { Booking, PlanningAssignment } from "@/lib/db-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ResourceAllocation() {
  const { toast } = useToast()
  const { issues, selectedProjects, fetchIssues } = useJiraStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [startDate, setStartDate] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }))
  const [endDate, setEndDate] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [planningAssignments, setPlanningAssignments] = useState<PlanningAssignment[]>([])

  // Generate array of dates for the current week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  // Fetch Jira issues if not already loaded
  useEffect(() => {
    const loadIssues = async () => {
      if (selectedProjects.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        await fetchIssues()
      } catch (error) {
        setError("Failed to load Jira issues")
        toast({
          title: "Error loading issues",
          description: "There was a problem loading your Jira issues.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadIssues()
  }, [selectedProjects, fetchIssues, toast])

  // Fetch bookings and planning assignments
  useEffect(() => {
    const fetchBookingsAndAssignments = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch bookings for the current date range
        const bookingsResponse = await fetch(
          `/api/bookings?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`,
        )

        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings: ${bookingsResponse.statusText}`)
        }

        const bookingsData = await bookingsResponse.json()

        if (bookingsData.success) {
          setBookings(bookingsData.data || [])
          if (bookingsData.warning) {
            console.warn("Booking API warning:", bookingsData.warning)
          }
        } else {
          console.error("Bookings API returned error:", bookingsData.error)
          setBookings([])
        }

        // Fetch planning assignments
        const assignmentsResponse = await fetch("/api/planning-assignments")

        if (!assignmentsResponse.ok) {
          throw new Error(`Failed to fetch assignments: ${assignmentsResponse.statusText}`)
        }

        const assignmentsData = await assignmentsResponse.json()

        if (assignmentsData.success) {
          setPlanningAssignments(assignmentsData.data || [])
          if (assignmentsData.warning) {
            console.warn("Assignments API warning:", assignmentsData.warning)
          }
        } else {
          console.error("Assignments API returned error:", assignmentsData.error)
          setPlanningAssignments([])
        }
      } catch (error) {
        console.error("Error in fetchBookingsAndAssignments:", error)
        setError(error instanceof Error ? error.message : "Failed to load resource allocation data")
        toast({
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load bookings data",
          variant: "destructive",
        })
        // Set empty arrays to prevent undefined errors
        setBookings([])
        setPlanningAssignments([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookingsAndAssignments()
  }, [startDate, endDate, toast])

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStartDate = addDays(startDate, -7)
    setStartDate(newStartDate)
    setEndDate(addDays(newStartDate, 6))
    setCurrentDate(newStartDate)
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const newStartDate = addDays(startDate, 7)
    setStartDate(newStartDate)
    setEndDate(addDays(newStartDate, 6))
    setCurrentDate(newStartDate)
  }

  // Handle booking update
  const handleBookingUpdate = async (booking: Omit<Booking, "id"> & { id?: string }) => {
    try {
      setError(null)
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setBookings((prev) => {
          const index = prev.findIndex(
            (b) =>
              (booking.id && b.id === booking.id) ||
              (b.taskId === booking.taskId && b.userId === booking.userId && b.date === booking.date),
          )

          if (index >= 0) {
            const updated = [...prev]
            updated[index] = data.data
            return updated
          } else {
            return [...prev, data.data]
          }
        })

        if (data.warning) {
          console.warn("Booking update warning:", data.warning)
          toast({
            title: "Booking updated (temporary)",
            description: "Your booking has been saved in memory only and will be lost on refresh.",
            variant: "warning",
          })
        } else {
          toast({
            title: "Booking updated",
            description: "Your booking has been saved successfully.",
          })
        }
      } else {
        throw new Error(data.error || "Failed to update booking")
      }
    } catch (error) {
      console.error("Error in handleBookingUpdate:", error)
      setError(error instanceof Error ? error.message : "Failed to update booking")
      toast({
        title: "Error updating booking",
        description: error instanceof Error ? error.message : "Failed to update booking",
        variant: "destructive",
      })
    }
  }

  // Handle planning assignment update
  const handleAssignmentUpdate = async (assignment: PlanningAssignment) => {
    try {
      setError(null)
      const response = await fetch("/api/planning-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignment),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update local state
        setPlanningAssignments((prev) => {
          const index = prev.findIndex((a) => a.taskId === assignment.taskId)

          if (index >= 0) {
            const updated = [...prev]
            updated[index] = data.data
            return updated
          } else {
            return [...prev, data.data]
          }
        })

        if (data.warning) {
          console.warn("Assignment update warning:", data.warning)
          toast({
            title: "Assignment updated (temporary)",
            description: "Your assignment has been saved in memory only and will be lost on refresh.",
            variant: "warning",
          })
        } else {
          toast({
            title: "Assignment updated",
            description: "The planned assignee has been updated successfully.",
          })
        }
      } else {
        throw new Error(data.error || "Failed to update assignment")
      }
    } catch (error) {
      console.error("Error in handleAssignmentUpdate:", error)
      setError(error instanceof Error ? error.message : "Failed to update assignment")
      toast({
        title: "Error updating assignment",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resource Allocation</h1>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </div>

          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              setStartDate(startOfWeek(today, { weekStartsOn: 1 }))
              setEndDate(endOfWeek(today, { weekStartsOn: 1 }))
              setCurrentDate(today)
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Dual Assignee View</AlertTitle>
        <AlertDescription>
          This view shows both the current Jira assignee and your planned assignee. When they differ, the selector will
          be highlighted in yellow. Hours are booked against the planned assignee.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-[350px_1fr] gap-4">
            <div className="font-medium text-sm">Structure</div>
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div className="font-medium text-sm">Assignees</div>
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((date) => (
                  <div
                    key={date.toISOString()}
                    className={`text-center p-2 text-sm font-medium ${
                      isSameDay(date, new Date()) ? "bg-primary/10 rounded-md" : ""
                    }`}
                  >
                    <div>{format(date, "EEE")}</div>
                    <div className="text-xs">{format(date, "d")}</div>
                    <div className="text-xs text-muted-foreground">{format(date, "MMM")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProjectTree
              issues={issues}
              planningAssignments={planningAssignments}
              onAssignmentUpdate={handleAssignmentUpdate}
              weekDates={weekDates}
              bookings={bookings}
              onBookingUpdate={handleBookingUpdate}
            />
          </div>
        </div>
      )}
    </div>
  )
}
