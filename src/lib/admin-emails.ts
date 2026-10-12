const DEFAULT_ADMIN_EMAILS = [
  "hello@idolrun.com",
  "dev@idolrun.com",
  "marketing@idolrun.com",
] as const

export function parseAdminEmails(
  raw: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): string[] {
  const trimmed = raw?.trim()

  if (trimmed) {
    return trimmed
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  }

  if (nodeEnv === "production") {
    return []
  }

  return DEFAULT_ADMIN_EMAILS.map((email) => email.toLowerCase())
}

const adminEmailSet = new Set(parseAdminEmails(process.env.ADMIN_EMAILS))

if (process.env.NODE_ENV === "production" && adminEmailSet.size === 0) {
  console.error("ADMIN_EMAILS is unset; no one is an admin.")
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailSet.has(email.trim().toLowerCase())
}

export function getAdminEmails(): string[] {
  return [...adminEmailSet]
}
