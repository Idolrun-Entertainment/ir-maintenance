import { notFound } from "next/navigation"

import { PostPage, postMetadata } from "@/components/site-pages/post-page"
import { isTargetLocale } from "@/i18n/config"

export const revalidate = 300

// Render on first request, then cache (ISR); no posts are known at build time.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps<"/[locale]/updates/[slug]">) {
  const { locale, slug } = await params
  return isTargetLocale(locale) ? postMetadata(locale, slug) : {}
}

export default async function Page({ params }: PageProps<"/[locale]/updates/[slug]">) {
  const { locale, slug } = await params

  if (!isTargetLocale(locale)) notFound()

  return <PostPage locale={locale} slug={slug} />
}
