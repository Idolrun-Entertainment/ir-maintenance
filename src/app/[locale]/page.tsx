import { notFound } from "next/navigation"

import { HomePage, homeMetadata } from "@/components/site-pages/home-page"
import { isTargetLocale } from "@/i18n/config"

export const revalidate = 300

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  return isTargetLocale(locale) ? homeMetadata(locale) : {}
}

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params

  if (!isTargetLocale(locale)) notFound()

  return <HomePage locale={locale} />
}
