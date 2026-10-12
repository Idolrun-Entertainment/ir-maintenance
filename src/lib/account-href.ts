import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export async function getAccountHref(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    return session ? "/admin" : "/sign-in"
  } catch (error) {
    console.error("Failed to read session for account link:", error)
    return "/sign-in"
  }
}
