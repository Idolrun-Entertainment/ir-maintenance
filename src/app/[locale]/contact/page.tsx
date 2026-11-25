import { notFound } from "next/navigation"

import { ContactPage, contactMetadata } from "@/components/site-pages/contact-page"
import { isTargetLocale } from "@/i18n/config"

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params
  return isTargetLocale(locale) ? contactMetadata(locale) : {}
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params

  if (!isTargetLocale(locale)) notFound()

  return <ContactPage locale={locale} />
}
