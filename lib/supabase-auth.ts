import { createClient } from "@supabase/supabase-js"
import type { User, Session } from "@supabase/supabase-js"

// Define types for our auth system
export type AuthUser = User & {
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  jira_credentials?: {
    baseUrl?: string
    email?: string
    apiToken?: string
  }
  theme_preference?: string
  default_view?: string
  created_at: string
  updated_at: string
}

// Singleton pattern for client-side Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Auth functions
export async function signUp(email: string, password: string) {
  // Validate email domain
  if (!email.endsWith("@machineslikeme.com")) {
    throw new Error("Only @machineslikeme.com email addresses are allowed to register")
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error

  // Create profile entry if signup was successful
  if (data.user) {
    await createUserProfile(data.user.id, email)
  }

  return data
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error)
    return null
  }

  return data.session
}

// Profile management
async function createUserProfile(userId: string, email: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data as UserProfile
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Settings management
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No settings found, create default settings
      return createDefaultUserSettings(userId)
    }
    console.error("Error fetching user settings:", error)
    return null
  }

  return data as UserSettings
}

export async function updateUserSettings(userId: string, updates: Partial<UserSettings>) {
  const supabase = getSupabaseClient()

  // Check if settings exist
  const existingSettings = await getUserSettings(userId)

  if (!existingSettings) {
    // Create settings if they don't exist
    return createDefaultUserSettings(userId, updates)
  }

  // Update existing settings
  const { error } = await supabase
    .from("user_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating user settings:", error)
    throw error
  }
}

async function createDefaultUserSettings(
  userId: string,
  customSettings: Partial<UserSettings> = {},
): Promise<UserSettings> {
  const supabase = getSupabaseClient()

  const defaultSettings = {
    user_id: userId,
    theme_preference: "system",
    default_view: "kanban",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...customSettings,
  }

  const { data, error } = await supabase.from("user_settings").insert(defaultSettings).select().single()

  if (error) {
    console.error("Error creating default user settings:", error)
    throw error
  }

  return data as UserSettings
}
