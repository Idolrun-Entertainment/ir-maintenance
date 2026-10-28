// Single source of truth for supported languages. To add one: extend LOCALES
// and LOCALE_META, add dictionaries/<code>.ts and register it in dictionary.ts.
export const LOCALES = ["en", "ja", "id", "ko", "zh-CN"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

// English is the source language; only these get translations and URL prefixes.
export const TARGET_LOCALES = LOCALES.filter(
  (locale): locale is Exclude<Locale, "en"> => locale !== DEFAULT_LOCALE,
)

export type TargetLocale = (typeof TARGET_LOCALES)[number]

export const LOCALE_META: Record<
  Locale,
  {
    nativeName: string
    // Language code sent to Google Cloud Translation.
    googleCode: string
    // BCP 47 tag for Intl formatting and Open Graph (og:locale uses `_`).
    intl: string
  }
> = {
  en: { nativeName: "English", googleCode: "en", intl: "en-GB" },
  ja: { nativeName: "日本語", googleCode: "ja", intl: "ja-JP" },
  id: { nativeName: "Bahasa Indonesia", googleCode: "id", intl: "id-ID" },
  ko: { nativeName: "한국어", googleCode: "ko", intl: "ko-KR" },
  "zh-CN": { nativeName: "简体中文", googleCode: "zh-CN", intl: "zh-CN" },
}

export const LOCALE_COOKIE = "NEXT_LOCALE"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function isTargetLocale(value: unknown): value is TargetLocale {
  return isLocale(value) && value !== DEFAULT_LOCALE
}

/** `/updates` -> `/ja/updates` for non-English locales, unchanged for English. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`

  if (locale === DEFAULT_LOCALE) {
    return normalized
  }

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`
}
