import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { BlogBody } from "@/components/home/blog-body"
import { BlogComments } from "@/components/home/blog-comments"
import { BlogViews } from "@/components/home/blog-views"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  localePath,
  type Locale,
} from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { format } from "@/i18n/format"
import { formatBlogDate } from "@/lib/format-date"
import { homePanelAssets } from "@/lib/home-assets"
import { buildAlternates, buildOpenGraph } from "@/lib/seo"
import { commentService } from "@/server/services/comment.service"
import {
  getLocalizedBlogBySlug,
  publishedBlogLocales,
} from "@/server/translation/read"
import { describeContent } from "@/server/translation/tiptap"

export async function PostPage({ locale, slug }: { locale: Locale; slug: string }) {
  const post = await getLocalizedBlogBySlug(slug, locale)

  if (!post) {
    notFound()
  }

  const dict = getDictionary(locale)
  const { blogBackground } = homePanelAssets
  const commentsByBlog = await commentService.listByBlogIds([post.id])
  const comments = (commentsByBlog.get(post.id) ?? []).map((comment) => ({
    id: comment.id,
    blogId: comment.blogId,
    name: comment.name,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  }))

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-black text-white">
      <SiteHeader current="updates" locale={locale} path={`/updates/${post.slug}`} />
      <main className="flex-1 px-3 pb-16 sm:px-5">
        <div className="mx-auto mt-4 w-full max-w-7xl">
          <Link
            href={localePath(locale, "/updates")}
            className="mb-3 inline-block text-sm text-white/80 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ← {dict.updates.backToUpdates}
          </Link>

          {post.isFallback ? (
            <p
              role="note"
              className="mb-3 rounded-md border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
            >
              {format(dict.fallback.notTranslated, {
                language: LOCALE_META[locale].nativeName,
              })}
            </p>
          ) : null}

          <article
            lang={post.isFallback ? DEFAULT_LOCALE : locale}
            className="home-panel home-panel__article"
          >
            <Image
              src={blogBackground.src}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 72rem"
              className="home-panel__texture"
            />
            <div className="home-panel__content">
              <h1 className="home-panel__title">{post.title}</h1>
              <p className="home-panel__meta">
                <time dateTime={post.date.toISOString()}>
                  {formatBlogDate(post.date.toISOString(), locale)}
                </time>
                <BlogViews
                  blogId={post.id}
                  initialViews={post.views}
                  locale={locale}
                  template={dict.updates.views}
                />
              </p>
              <BlogBody content={post.content} />
              <BlogComments
                blogId={post.id}
                initialComments={comments}
                locale={locale}
                labels={dict.comments}
              />
            </div>
          </article>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

export async function postMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const post = await getLocalizedBlogBySlug(slug, locale)

  if (!post) {
    return { robots: { index: false, follow: false } }
  }

  const path = `/updates/${post.slug}`
  const published = (await publishedBlogLocales([post.id])).get(post.id) ?? []
  const available = post.isFallback ? published : [...published, locale]
  const title = post.seoTitle || post.title
  const description = post.seoDescription || describeContent(post.content)

  return {
    title,
    description,
    alternates: buildAlternates({
      path,
      available,
      // A localized URL that only shows English must not compete with the
      // English page: point canonical at it and keep it out of the index.
      canonicalLocale: post.isFallback ? DEFAULT_LOCALE : locale,
    }),
    robots: post.isFallback ? { index: false, follow: true } : undefined,
    openGraph: buildOpenGraph({
      locale,
      path,
      title,
      description,
      type: "article",
      image: post.imageUrl || undefined,
      available,
    }),
  }
}
