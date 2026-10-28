import type { MetadataRoute } from "next"

import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { absoluteUrl } from "@/lib/seo"
import { publishedBlogLocales } from "@/server/translation/read"

// Regenerated hourly, and on demand whenever a translation is published.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

function entriesFor(
  path: string,
  available: readonly Locale[],
  lastModified?: Date,
): Entry[] {
  const languages: Record<string, string> = {}

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE || available.includes(locale)) {
      languages[locale] = absoluteUrl(localePath(locale, path))
    }
  }

  languages["x-default"] = absoluteUrl(path)

  // Every page lists all its alternates, itself included.
  return LOCALES.filter(
    (locale) => locale === DEFAULT_LOCALE || available.includes(locale),
  ).map((locale) => ({
    url: absoluteUrl(localePath(locale, path)),
    lastModified,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: Entry[] = [
    ...entriesFor("/", LOCALES),
    ...entriesFor("/updates", LOCALES),
  ]

  try {
    const [blogs, published] = await Promise.all([
      prisma.blog.findMany({
        select: { id: true, slug: true, updatedAt: true },
        orderBy: { id: "asc" },
      }),
      publishedBlogLocales(),
    ])

    for (const blog of blogs) {
      entries.push(
        ...entriesFor(`/updates/${blog.slug}`, published.get(blog.id) ?? [], blog.updatedAt),
      )
    }
  } catch (error) {
    // Still serve the static pages if the database is unreachable at build.
    console.error("Failed to load blogs for sitemap:", error)
  }

  return entries
}
