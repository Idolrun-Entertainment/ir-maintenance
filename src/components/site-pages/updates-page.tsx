import type { Metadata } from "next"

import { ClearCachedHomeRedirect } from "@/components/home/clear-cached-home-redirect"
import { HomeHero } from "@/components/home/home-hero"
import { HomeTabs } from "@/components/home/home-tabs"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { collectContentImages } from "@/lib/blog-content"
import { buildAlternates, buildOpenGraph } from "@/lib/seo"
import type { Comment } from "@/lib/types"
import { blogService } from "@/server/services/blog.service"
import { commentService } from "@/server/services/comment.service"
import { faqService } from "@/server/services/faq.service"
import { localizeBlogs, localizeFaqs } from "@/server/translation/read"

export async function UpdatesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  let blogs: {
    id: string
    slug: string
    title: string
    date: string
    content: string
    views: number
    comments: Comment[]
  }[] = []
  let faqs: {
    id: string
    question: string
    answer: string
  }[] = []

  try {
    const [blogResult, faqResult] = await Promise.all([
      blogService.list({ page: 1, limit: 20 }),
      faqService.list({ page: 1, limit: 50 }),
    ])

    // One extra query for every listed blog, rather than an `includeComments`
    // flag on blogService.list that the admin list would also pay for.
    const commentsByBlog = await commentService.listByBlogIds(
      blogResult.items.map((blog) => blog.id),
    )

    // Translations are read from the DB; the Translation API is never called here.
    const localizedBlogs = await localizeBlogs(blogResult.items, locale)

    blogs = localizedBlogs.map((blog) => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      date: blog.date.toISOString(),
      content: blog.content,
      views: blog.views,
      comments: (commentsByBlog.get(blog.id) ?? []).map((comment) => ({
        id: comment.id,
        blogId: comment.blogId,
        name: comment.name,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
    }))

    faqs = (await localizeFaqs(faqResult.items, locale)).map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    }))
  } catch (error) {
    console.error("Failed to load home page content:", error)
  }

  const seenScreenshotSrcs = new Set<string>()
  const screenshots = blogs.flatMap((blog) =>
    collectContentImages(blog.content).flatMap((image) => {
      if (seenScreenshotSrcs.has(image.src)) {
        return []
      }

      seenScreenshotSrcs.add(image.src)

      return [
        {
          src: image.src,
          alt: image.alt || blog.title,
        },
      ]
    }),
  )

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-black text-white">
      {locale === DEFAULT_LOCALE ? <ClearCachedHomeRedirect /> : null}
      <SiteHeader current="updates" locale={locale} path="/updates" />
      <main className="flex-1 px-3 pb-16 sm:px-5">
        <div className="mx-auto w-full max-w-7xl">
          <HomeHero locale={locale} />
          <HomeTabs
            locale={locale}
            labels={{ updates: dict.updates, comments: dict.comments }}
            blogs={blogs}
            faqs={faqs}
            screenshots={screenshots}
          />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

export function updatesMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale)

  return {
    title: meta.updatesTitle,
    description: meta.updatesDescription,
    alternates: buildAlternates({ path: "/updates", available: LOCALES, canonicalLocale: locale }),
    openGraph: buildOpenGraph({
      locale,
      path: "/updates",
      title: meta.updatesTitle,
      description: meta.updatesDescription,
      available: LOCALES,
    }),
  }
}
