import { notFound } from "next/navigation"

import { LegalPage, legalMetadata } from "@/components/site-pages/legal-page"
import { isTargetLocale } from "@/i18n/config"

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params
  return isTargetLocale(locale) ? legalMetadata(locale, "about") : {}
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params

  if (!isTargetLocale(locale)) notFound()

  return <LegalPage locale={locale} slug="about" />
}
