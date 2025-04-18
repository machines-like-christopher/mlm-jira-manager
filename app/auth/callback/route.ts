import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=missing_code`)
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    await supabase.auth.exchangeCodeForSession(code)

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}`)
  } catch (error) {
    console.error("Error in auth callback:", error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error during authentication",
      )}`,
    )
  }
}
