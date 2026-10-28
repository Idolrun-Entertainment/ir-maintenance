import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

import { isTargetLocale, LOCALE_COOKIE, localePath } from "@/i18n/config"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    return NextResponse.next()
  }

  // Remembered language: a visitor who previously picked e.g. 日本語 and opens
  // an unprefixed (English) URL is sent to the same page in that language.
  // The URL they land on is still the authority - choosing English in the
  // switcher stores "en", which skips this redirect.
  const preferred = request.cookies.get(LOCALE_COOKIE)?.value

  if (isTargetLocale(preferred) && (request.method === "GET" || request.method === "HEAD")) {
    const url = request.nextUrl.clone()
    url.pathname = localePath(preferred, pathname)

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/updates", "/updates/:slug", "/admin/:path*"],
}
