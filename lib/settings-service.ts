import { getUserSettings, updateUserSettings, type UserSettings } from "@/lib/supabase-auth"
import { useJiraStore } from "@/lib/store"

// Debounce function to prevent excessive database writes
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Save Jira credentials to user settings
export async function saveJiraCredentials(
  userId: string,
  credentials: {
    baseUrl: string
    email: string
    apiToken: string
  },
) {
  try {
    await updateUserSettings(userId, {
      jira_credentials: credentials,
    } as Partial<UserSettings>)

    return true
  } catch (error) {
    console.error("Error saving Jira credentials:", error)
    return false
  }
}

// Save theme preference
export async function saveThemePreference(userId: string, theme: string) {
  try {
    await updateUserSettings(userId, {
      theme_preference: theme,
    } as Partial<UserSettings>)

    return true
  } catch (error) {
    console.error("Error saving theme preference:", error)
    return false
  }
}

// Save default view
export async function saveDefaultView(userId: string, view: string) {
  try {
    await updateUserSettings(userId, {
      default_view: view,
    } as Partial<UserSettings>)

    return true
  } catch (error) {
    console.error("Error saving default view:", error)
    return false
  }
}

// Load user settings and apply them to the app state
export async function loadAndApplyUserSettings(userId: string) {
  try {
    const settings = await getUserSettings(userId)
    if (!settings) return false

    const store = useJiraStore.getState()

    // Apply Jira credentials if available
    if (settings.jira_credentials) {
      store.setJiraCredentials(settings.jira_credentials)
      store.setUseManualCredentials(true)
    }

    // Apply theme preference if available
    if (settings.theme_preference) {
      // Apply theme using next-themes or similar
      document.documentElement.setAttribute("data-theme", settings.theme_preference)
    }

    return true
  } catch (error) {
    console.error("Error loading user settings:", error)
    return false
  }
}

// Create debounced versions of the save functions
export const debouncedSaveJiraCredentials = debounce(saveJiraCredentials, 500)
export const debouncedSaveThemePreference = debounce(saveThemePreference, 500)
export const debouncedSaveDefaultView = debounce(saveDefaultView, 500)
