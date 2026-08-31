const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

export function sanitizeBlogHref(href: string): string | null {
  const trimmed = href.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("//")) {
    return null
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)

    if (ALLOWED_PROTOCOLS.has(url.protocol)) {
      return url.href
    }
  } catch {
    return null
  }

  return null
}
