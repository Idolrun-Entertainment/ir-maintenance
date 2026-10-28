import { DEFAULT_LOCALE, TARGET_LOCALES, type Locale, type TargetLocale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"

/**
 * A translation is public only once valid translated text has been stored and
 * `publishedAt` set. Rows that are queued, failed on first attempt, or empty
 * are never exposed. (An outdated-but-published row stays visible until its
 * replacement lands.)
 */
export function isPublishedTranslation<T extends { publishedAt: Date | null }>(
  row: T | null | undefined,
  requiredFields: (keyof T)[],
): boolean {
  return Boolean(
    row &&
      row.publishedAt &&
      requiredFields.every((field) => {
        const value = row[field]
        return typeof value === "string" && value.trim().length > 0
      }),
  )
}

export type LocalizedBlog = {
  id: string
  slug: string
  title: string
  content: string
  date: Date
  views: number
  imageUrl: string
  seoTitle: string | null
  seoDescription: string | null
  /** True when the requested locale had no published translation and English is shown. */
  isFallback: boolean
}

type BlogRecord = {
  id: string
  slug: string
  title: string
  content: string
  date: Date
  views: number
  imageUrl: string
}

type BlogTranslationRecord = {
  blogId: string
  title: string | null
  content: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: Date | null
}

export function localizeBlog(
  blog: BlogRecord,
  translation: BlogTranslationRecord | null | undefined,
  locale: Locale,
): LocalizedBlog {
  if (locale !== DEFAULT_LOCALE && isPublishedTranslation(translation, ["title", "content"])) {
    return {
      ...blog,
      title: translation!.title!,
      content: translation!.content!,
      seoTitle: translation!.seoTitle,
      seoDescription: translation!.seoDescription,
      isFallback: false,
    }
  }

  return {
    ...blog,
    seoTitle: null,
    seoDescription: null,
    isFallback: locale !== DEFAULT_LOCALE,
  }
}

export async function localizeBlogs(blogs: BlogRecord[], locale: Locale): Promise<LocalizedBlog[]> {
  if (locale === DEFAULT_LOCALE || blogs.length === 0) {
    return blogs.map((blog) => localizeBlog(blog, null, locale))
  }

  const translations = await prisma.blogTranslation.findMany({
    where: { locale, blogId: { in: blogs.map((b) => b.id) } },
  })

  return blogs.map((blog) =>
    localizeBlog(blog, translations.find((t) => t.blogId === blog.id), locale),
  )
}

/** Null when the post does not exist. Missing translation => English with isFallback. */
export async function getLocalizedBlogBySlug(slug: string, locale: Locale): Promise<LocalizedBlog | null> {
  const blog = await prisma.blog.findUnique({ where: { slug } })
  if (!blog) return null

  const [localized] = await localizeBlogs([blog], locale)
  return localized
}

export async function localizeFaqs<T extends { id: string; question: string; answer: string }>(
  faqs: T[],
  locale: Locale,
): Promise<T[]> {
  if (locale === DEFAULT_LOCALE || faqs.length === 0) return faqs

  const translations = await prisma.faqTranslation.findMany({
    where: { locale, faqId: { in: faqs.map((f) => f.id) } },
  })

  return faqs.map((faq) => {
    const t = translations.find((row) => row.faqId === faq.id)
    return isPublishedTranslation(t, ["question", "answer"])
      ? { ...faq, question: t!.question!, answer: t!.answer! }
      : faq
  })
}

export async function localizeNews<T extends { id: string; title: string }>(
  items: T[],
  locale: Locale,
): Promise<T[]> {
  if (locale === DEFAULT_LOCALE || items.length === 0) return items

  const translations = await prisma.newsTranslation.findMany({
    where: { locale, newsId: { in: items.map((n) => n.id) } },
  })

  return items.map((item) => {
    const t = translations.find((row) => row.newsId === item.id)
    return isPublishedTranslation(t, ["title"]) ? { ...item, title: t!.title! } : item
  })
}

/** blogId -> locales with a published translation (drives hreflang + sitemap). */
export async function publishedBlogLocales(blogIds?: string[]): Promise<Map<string, TargetLocale[]>> {
  const rows = await prisma.blogTranslation.findMany({
    where: {
      publishedAt: { not: null },
      title: { not: null },
      content: { not: null },
      ...(blogIds ? { blogId: { in: blogIds } } : {}),
    },
    select: { blogId: true, locale: true },
  })

  const map = new Map<string, TargetLocale[]>()

  for (const { blogId, locale } of rows) {
    if ((TARGET_LOCALES as readonly string[]).includes(locale)) {
      map.set(blogId, [...(map.get(blogId) ?? []), locale as TargetLocale])
    }
  }

  return map
}
