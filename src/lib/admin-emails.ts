const DEFAULT_ADMIN_EMAILS = [
  "hello@idolrun.com",
  "dev@idolrun.com",
  "marketing@idolrun.com",
] as const

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim()

  const emails = raw
    ? raw.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS.map((email) => email.toLowerCase())

  return new Set(emails)
}

const adminEmailSet = parseAdminEmails()

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailSet.has(email.trim().toLowerCase())
}

export function getAdminEmails(): string[] {
  return [...adminEmailSet]
}
