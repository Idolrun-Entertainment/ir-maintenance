"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronDownIcon, CircleHelpIcon, ImageIcon, SlidersHorizontalIcon } from "lucide-react"
import { useId, useMemo, useState } from "react"

import { BlogBody } from "@/components/home/blog-body"
import { BlogComments } from "@/components/home/blog-comments"
import { BlogViews } from "@/components/home/blog-views"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { GooeyNav } from "@/components/ui/gooey-nav"
import { localePath, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n/dictionary"
import { format } from "@/i18n/format"
import { formatBlogDate } from "@/lib/format-date"
import { homePanelAssets } from "@/lib/home-assets"
import type { Comment } from "@/lib/types"

export type HomeBlog = {
  id: string
  slug: string
  title: string
  date: string
  content: string
  views: number
  comments: Comment[]
}

export type HomeFaq = {
  id: string
  question: string
  answer: string
}

export type HomeScreenshot = {
  src: string
  alt: string
}

type HomeTabId = "updates" | "screenshots" | "faq"

const SECTIONS: HomeTabId[] = ["updates", "screenshots", "faq"]

type HomeTabsLabels = {
  updates: Dictionary["updates"]
  comments: Dictionary["comments"]
}

type HomeTabsProps = {
  locale: Locale
  labels: HomeTabsLabels
  blogs: HomeBlog[]
  faqs: HomeFaq[]
  screenshots: HomeScreenshot[]
}

type BlogSort = "latest" | "oldest"

function sortBlogs(blogs: HomeBlog[], order: BlogSort) {
  return [...blogs].sort((left, right) => {
    const leftTime = Date.parse(left.date)
    const rightTime = Date.parse(right.date)
    const delta =
      (Number.isNaN(leftTime) ? 0 : leftTime) -
      (Number.isNaN(rightTime) ? 0 : rightTime)

    return order === "oldest" ? delta : -delta
  })
}

function UpdatesPanel({
  blogs,
  order,
  locale,
  labels,
}: {
  blogs: HomeBlog[]
  order: BlogSort
  locale: Locale
  labels: HomeTabsLabels
}) {
  const { blogBackground } = homePanelAssets
  const sortedBlogs = useMemo(() => sortBlogs(blogs, order), [blogs, order])

  if (blogs.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">{labels.updates.emptyUpdates}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {sortedBlogs.map((blog, index) => (
        <article key={blog.id} className="home-panel home-panel__article">
          <Image
            src={blogBackground.src}
            alt=""
            aria-hidden
            fill
            loading={index === 0 ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, 72rem"
            className="home-panel__texture"
          />
          <div className="home-panel__content">
            <h2 className="home-panel__title">
              <Link
                href={localePath(locale, `/updates/${blog.slug}`)}
                aria-label={`${labels.updates.permalink}: ${blog.title}`}
                className="hover:underline focus-visible:underline"
              >
                {blog.title}
              </Link>
            </h2>
            <p className="home-panel__meta">
              <time dateTime={blog.date}>{formatBlogDate(blog.date, locale)}</time>
              <BlogViews
                blogId={blog.id}
                initialViews={blog.views}
                locale={locale}
                template={labels.updates.views}
              />
            </p>
            <BlogBody content={blog.content} />
            <BlogComments
              blogId={blog.id}
              initialComments={blog.comments}
              locale={locale}
              labels={labels.comments}
            />
          </div>
        </article>
      ))}
    </div>
  )
}

function ScreenshotDialog({
  asset,
  open,
  onOpenChange,
  labels,
}: {
  asset: HomeScreenshot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  labels: Dictionary["updates"]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-[var(--border-sky)] bg-[var(--bg-blue)] text-white sm:max-w-3xl">
        <DialogTitle className="sr-only">
          {asset?.alt ?? labels.screenshotPreview}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {labels.screenshotEnlarged}
        </DialogDescription>
        {asset ? (
          <div className="relative mx-auto aspect-[4/3] w-full max-h-[70vh]">
            <Image
              src={asset.src}
              alt={asset.alt}
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ScreenshotsPanel({
  screenshots,
  labels,
}: {
  screenshots: HomeScreenshot[]
  labels: Dictionary["updates"]
}) {
  const [selected, setSelected] = useState<HomeScreenshot | null>(null)

  if (screenshots.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">{labels.emptyScreenshots}</p>
      </div>
    )
  }

  return (
    <>
      <div className="home-panel">
        <div className="home-panel__content">
          <div className="home-shots">
            {screenshots.map((asset) => (
              <button
                key={asset.src}
                type="button"
                className="home-shot"
                onClick={() => setSelected(asset)}
              >
                {/* Intrinsic size is unknown here, so width/height 0 + CSS auto
                    lets the file's own aspect ratio size the masonry tile. */}
                <Image
                  src={asset.src}
                  alt={asset.alt}
                  className="home-shot__image"
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20rem"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <ScreenshotDialog
        labels={labels}
        asset={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
          }
        }}
      />
    </>
  )
}

function FaqPanel({
  faqs,
  labels,
}: {
  faqs: HomeFaq[]
  labels: Dictionary["updates"]
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(faqs.map((faq) => faq.id)),
  )

  function toggleFaq(id: string) {
    setOpenIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  if (faqs.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">{labels.emptyFaq}</p>
      </div>
    )
  }

  return (
    <div className="home-panel">
      <div className="home-panel__content">
        <div className="home-faq">
          {faqs.map((faq) => {
            const isOpen = openIds.has(faq.id)

            return (
              <div key={faq.id} className="home-faq__item">
                <button
                  type="button"
                  className="home-faq__trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span>{faq.question}</span>
                  <ChevronDownIcon className="home-faq__icon size-5" aria-hidden />
                </button>
                {isOpen ? (
                  <div className="home-faq__answer">{faq.answer}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function HomeTabs({
  locale,
  labels,
  blogs,
  faqs,
  screenshots,
}: HomeTabsProps) {
  const t = labels.updates
  const sectionItems = [
    { label: t.tabUpdates },
    { label: t.tabScreenshots, icon: <ImageIcon /> },
    { label: t.tabFaq, icon: <CircleHelpIcon /> },
  ]
  const baseId = useId()
  const panelId = `${baseId}-panel`
  const [activeTab, setActiveTab] = useState<HomeTabId>("updates")
  const [order, setOrder] = useState<BlogSort>("latest")

  const label = order === "latest" ? t.latest : t.oldest
  const nextOrder: BlogSort = order === "latest" ? "oldest" : "latest"
  const nextLabel = nextOrder === "latest" ? t.latest : t.oldest
  const activeIndex = Math.max(0, SECTIONS.indexOf(activeTab))

  const panelLabel =
    activeTab === "screenshots"
      ? t.panelScreenshots
      : activeTab === "faq"
        ? t.tabFaq
        : t.tabUpdates

  return (
    <div className="mt-3 flex flex-col gap-3 sm:mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <GooeyNav
          aria-label={t.sectionsLabel}
          items={sectionItems}
          value={activeIndex}
          onChange={(index) => {
            const next = SECTIONS[index]
            if (next) setActiveTab(next)
          }}
          activeColor="#00A5EE"
          className="max-w-full"
          radius={4}
        />

        <button
          type="button"
          className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm bg-white px-3.5 py-2 text-xs leading-4 font-medium whitespace-nowrap text-neutral-950 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6edefe] motion-reduce:transition-none"
          aria-label={format(t.sortLabel, { current: label, next: nextLabel })}
          onClick={() => setOrder(nextOrder)}
        >
          <SlidersHorizontalIcon className="size-3 shrink-0" aria-hidden />
          {label}
        </button>
      </div>

      <div id={panelId} role="region" aria-label={panelLabel}>
        {activeTab === "updates" ? (
          <UpdatesPanel blogs={blogs} order={order} locale={locale} labels={labels} />
        ) : null}
        {activeTab === "screenshots" ? (
          <ScreenshotsPanel screenshots={screenshots} labels={t} />
        ) : null}
        {activeTab === "faq" ? <FaqPanel faqs={faqs} labels={t} /> : null}
      </div>
    </div>
  )
}
