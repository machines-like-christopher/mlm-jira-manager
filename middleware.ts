import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If accessing a protected route without a session, redirect to login
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth/")
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
    const isLoginPage = req.nextUrl.pathname === "/login"

    if (!session && !isAuthRoute && !isApiRoute && !isLoginPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/auth/login"
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Continue the request even if there's an error with auth
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Skip static files and specific routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
