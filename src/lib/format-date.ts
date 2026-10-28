import { DEFAULT_LOCALE, LOCALE_META, type Locale } from "@/i18n/config"

// Intl formatters are costly to build; keep one per locale and shape.
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(locale: Locale, shape: "date" | "month" | "monthDay") {
  const key = `${locale}:${shape}`
  let cached = formatters.get(key)

  if (!cached) {
    const options: Intl.DateTimeFormatOptions =
      shape === "date"
        ? { day: "numeric", month: "short", year: "numeric" }
        : shape === "month"
          ? { month: "short" }
          : { month: "short", day: "numeric" }

    cached = new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
      ...options,
      timeZone: "UTC",
    })
    formatters.set(key, cached)
  }

  return cached
}

export function formatBlogDate(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const formatted = formatter(locale, "date").format(new Date(date))

  // "5 Oct 2026" -> "5 Oct, 2026" is an English-only house style.
  return locale === DEFAULT_LOCALE
    ? formatted.replace(/ (\d{4})$/, ", $1")
    : formatted
}

export function formatNewsDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) {
    return `${formatter(locale, "month").format(date).toUpperCase()} ${date.getUTCDate()}`
  }

  return formatter(locale, "monthDay").format(date)
}

export function formatBlogDateShort(date: string, locale: Locale = DEFAULT_LOCALE): string {
  return formatter(locale, "date").format(new Date(date))
}
