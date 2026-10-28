import { LOCALE_META, LOCALES, localePath, type Locale } from "@/i18n/config"

export type LanguageLink = {
  locale: Locale
  nativeName: string
  href: string
}

/**
 * Switcher targets for the page at `path` (an unprefixed English path such as
 * `/updates/my-post`). Every locale links to the same page, so on an article
 * the visitor lands on that article's translation. If it is not published yet
 * the target page itself renders the English text with a notice.
 */
export function buildLanguageLinks(path: string): LanguageLink[] {
  return LOCALES.map((locale) => ({
    locale,
    nativeName: LOCALE_META[locale].nativeName,
    href: localePath(locale, path),
  }))
}
