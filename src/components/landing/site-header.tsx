import { SiteHeaderClient } from "@/components/landing/site-header-client"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { buildLanguageLinks } from "@/i18n/links"

type SiteHeaderProps = {
  current?: "game" | "updates"
  locale?: Locale
  /** Unprefixed English path of this page, used to build language switch links. */
  path?: string
}

// Server wrapper: resolves the dictionary and switcher links so the client
// header (mobile menu state only) never needs the full dictionaries.
export function SiteHeader({
  current = "game",
  locale = DEFAULT_LOCALE,
  path = "/",
}: SiteHeaderProps) {
  return (
    <SiteHeaderClient
      current={current}
      locale={locale}
      labels={getDictionary(locale).nav}
      languageLinks={buildLanguageLinks(path)}
    />
  )
}
