import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { RootShell } from "@/components/root-shell"
import { isTargetLocale, TARGET_LOCALES } from "@/i18n/config"
import { getSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
}

// Only the four translated locales are prefixed; English keeps its existing
// unprefixed URLs. Anything else (/xx, /en) is a 404 via the check below.
export function generateStaticParams() {
  return TARGET_LOCALES.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params

  if (!isTargetLocale(locale)) {
    notFound()
  }

  return <RootShell lang={locale}>{children}</RootShell>
}
