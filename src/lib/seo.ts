import type { Metadata } from "next"

import {
  DEFAULT_LOCALE,
  LOCALE_META,
  LOCALES,
  localePath,
  type Locale,
} from "@/i18n/config"

export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")

  return raw.replace(/\/+$/, "")
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path === "/" ? "" : path}`
}

/**
 * Canonical + hreflang for a page. `available` must only list locales whose
 * page really exists (published) so every alternate resolves to a real page.
 * `canonicalLocale` differs from `locale` when a translation is missing and
 * the English text is shown under the localized URL.
 */
export function buildAlternates(options: {
  path: string
  available: readonly Locale[]
  canonicalLocale: Locale
}): NonNullable<Metadata["alternates"]> {
  const { path, available, canonicalLocale } = options
  const languages: Record<string, string> = {}

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE || available.includes(locale)) {
      languages[locale] = absoluteUrl(localePath(locale, path))
    }
  }

  languages["x-default"] = absoluteUrl(localePath(DEFAULT_LOCALE, path))

  return { canonical: absoluteUrl(localePath(canonicalLocale, path)), languages }
}

export function openGraphLocale(locale: Locale): string {
  return LOCALE_META[locale].intl.replace("-", "_")
}

export function buildOpenGraph(options: {
  locale: Locale
  path: string
  title: string
  description: string
  type?: "website" | "article"
  image?: string
  available: readonly Locale[]
}): NonNullable<Metadata["openGraph"]> {
  const { locale, path, available } = options

  return {
    type: options.type ?? "website",
    siteName: "Idolrun Entertainment",
    title: options.title,
    description: options.description,
    url: absoluteUrl(localePath(locale, path)),
    locale: openGraphLocale(locale),
    alternateLocale: LOCALES.filter(
      (other) => other !== locale && (other === DEFAULT_LOCALE || available.includes(other)),
    ).map(openGraphLocale),
    ...(options.image ? { images: [options.image] } : {}),
  }
}
