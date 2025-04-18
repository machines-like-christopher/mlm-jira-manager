"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { isSameDay } from "date-fns"

interface BookingInputProps {
  taskId: string
  userId: string
  date: Date
  value: number
  onChange: (hours: number) => void
}

export function BookingInput({ taskId, userId, date, value, onChange }: BookingInputProps) {
  const [inputValue, setInputValue] = useState(value === 0 ? "" : value.toString())
  const [isFocused, setIsFocused] = useState(false)
  const [isError, setIsError] = useState(false)

  // Update input value when the prop value changes
  useEffect(() => {
    setInputValue(value === 0 ? "" : value.toString())
    setIsError(false)
  }, [value])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow empty string, numbers, and decimals
    if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
      setInputValue(newValue)
      setIsError(false)
    }
  }

  // Handle blur event
  const handleBlur = () => {
    setIsFocused(false)

    try {
      // Convert input to number
      const numericValue = inputValue === "" ? 0 : Number.parseFloat(inputValue)

      // Only update if the value has changed
      if (numericValue !== value) {
        onChange(numericValue)
      }
    } catch (error) {
      console.error("Error in booking input:", error)
      setIsError(true)
      // Reset to previous value
      setInputValue(value === 0 ? "" : value.toString())
    }
  }

  // Determine cell background color
  const getCellClass = () => {
    // Error state
    if (isError) {
      return "bg-red-50 dark:bg-red-900/20"
    }

    // Highlight today's cell
    if (isSameDay(date, new Date())) {
      return "bg-primary/10"
    }

    // Highlight weekend cells
    const day = date.getDay()
    if (day === 0 || day === 6) {
      return "bg-muted/50"
    }

    return ""
  }

  return (
    <div className={`p-1 ${getCellClass()}`}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className={`h-8 text-center ${
          isError ? "border-red-500 dark:border-red-400" : value > 0 ? "bg-green-50 dark:bg-green-900/20" : ""
        }`}
        placeholder="0h"
      />
    </div>
  )
}
