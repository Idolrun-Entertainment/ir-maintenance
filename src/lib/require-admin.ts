import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { isAdminEmail } from "@/lib/admin-emails"
import { auth } from "@/lib/auth"
import { ForbiddenError, UnauthorizedError } from "@/lib/errors"

type RequireAdminOptions = {
  mode?: "page" | "api"
}

export async function requireAdmin(options: RequireAdminOptions = {}) {
  const { mode = "page" } = options

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    if (mode === "api") {
      throw new UnauthorizedError("Authentication required")
    }

    redirect("/sign-in")
  }

  if (!isAdminEmail(session.user.email)) {
    if (mode === "api") {
      throw new ForbiddenError("You do not have access to this resource")
    }

    redirect("/unauthorized")
  }

  return session
}
