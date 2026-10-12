"use client"

import Image from "next/image"
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
import { formatBlogDate } from "@/lib/format-date"
import { homePanelAssets } from "@/lib/home-assets"
import type { Comment } from "@/lib/types"

export type HomeBlog = {
  id: string
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

const SECTION_ITEMS = [
  { label: "Updates" },
  { label: "Screen Shots", icon: <ImageIcon /> },
  { label: "F.A.Q", icon: <CircleHelpIcon /> },
]

type HomeTabsProps = {
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

function UpdatesPanel({ blogs, order }: { blogs: HomeBlog[]; order: BlogSort }) {
  const { blogBackground } = homePanelAssets
  const sortedBlogs = useMemo(() => sortBlogs(blogs, order), [blogs, order])

  if (blogs.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">No updates yet. Check back soon.</p>
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
            <h2 className="home-panel__title">{blog.title}</h2>
            <p className="home-panel__meta">
              <time dateTime={blog.date}>{formatBlogDate(blog.date)}</time>
              <BlogViews blogId={blog.id} initialViews={blog.views} />
            </p>
            <BlogBody content={blog.content} />
            <BlogComments blogId={blog.id} initialComments={blog.comments} />
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
}: {
  asset: HomeScreenshot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-[var(--border-sky)] bg-[var(--bg-blue)] text-white sm:max-w-3xl">
        <DialogTitle className="sr-only">
          {asset?.alt ?? "Screenshot preview"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Enlarged screenshot preview
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

function ScreenshotsPanel({ screenshots }: { screenshots: HomeScreenshot[] }) {
  const [selected, setSelected] = useState<HomeScreenshot | null>(null)

  if (screenshots.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">No screenshots available yet.</p>
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
                <div className="home-shot__frame">
                  <Image
                    src={asset.src}
                    alt={asset.alt}
                    className="home-shot__image"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22rem"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ScreenshotDialog
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

function FaqPanel({ faqs }: { faqs: HomeFaq[] }) {
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
        <p className="home-panel__empty">No FAQs available yet.</p>
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

export function HomeTabs({ blogs, faqs, screenshots }: HomeTabsProps) {
  const baseId = useId()
  const panelId = `${baseId}-panel`
  const [activeTab, setActiveTab] = useState<HomeTabId>("updates")
  const [order, setOrder] = useState<BlogSort>("latest")

  const label = order === "latest" ? "Latest" : "Oldest"
  const nextOrder: BlogSort = order === "latest" ? "oldest" : "latest"
  const activeIndex = Math.max(0, SECTIONS.indexOf(activeTab))

  const panelLabel =
    activeTab === "screenshots" ? "Screen shots" : activeTab === "faq" ? "F.A.Q" : "Updates"

  return (
    <div className="mt-3 flex flex-col gap-3 sm:mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <GooeyNav
          aria-label="Updates sections"
          items={SECTION_ITEMS}
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
          aria-label={`${label}. Show ${nextOrder} blogs first`}
          onClick={() => setOrder(nextOrder)}
        >
          <SlidersHorizontalIcon className="size-3 shrink-0" aria-hidden />
          {label}
        </button>
      </div>

      <div id={panelId} role="region" aria-label={panelLabel}>
        {activeTab === "updates" ? <UpdatesPanel blogs={blogs} order={order} /> : null}
        {activeTab === "screenshots" ? <ScreenshotsPanel screenshots={screenshots} /> : null}
        {activeTab === "faq" ? <FaqPanel faqs={faqs} /> : null}
      </div>
    </div>
  )
}
