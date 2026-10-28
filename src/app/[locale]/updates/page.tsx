import { notFound } from "next/navigation"

import { UpdatesPage, updatesMetadata } from "@/components/site-pages/updates-page"
import { isTargetLocale } from "@/i18n/config"

export const revalidate = 300

export async function generateMetadata({ params }: PageProps<"/[locale]/updates">) {
  const { locale } = await params
  return isTargetLocale(locale) ? updatesMetadata(locale) : {}
}

export default async function Page({ params }: PageProps<"/[locale]/updates">) {
  const { locale } = await params

  if (!isTargetLocale(locale)) notFound()

  return <UpdatesPage locale={locale} />
}
