"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className, width = 200, height = 50 }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we should use the dark version
  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark")

  // Apply filter to invert colors for dark mode
  const filterStyle = isDark ? { filter: "invert(1) brightness(1.5)" } : {}

  if (!mounted) {
    // Return a placeholder during SSR
    return <div className={className} style={{ width, height }} />
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo.svg"
        alt="MACHINES LIKE ME"
        width={width}
        height={height}
        style={{
          ...filterStyle,
          maxHeight: "36px",
          width: "auto",
          objectFit: "contain",
        }}
        priority
        className="h-9"
      />
    </div>
  )
}
