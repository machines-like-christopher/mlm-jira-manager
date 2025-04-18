"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

// IMPORTANT: This is a simple demo authentication.
// In a real application, you would use a proper authentication system.
const HARDCODED_PASSWORD = "mlm-multi-jira-2025"

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (password: string) => {
        const isValid = password === HARDCODED_PASSWORD
        if (isValid) {
          set({ isAuthenticated: true })
        }
        return isValid
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "jira-kanban-auth",
    },
  ),
)
