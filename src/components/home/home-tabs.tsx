"use client"

import Image from "next/image"
import { ChevronDownIcon } from "lucide-react"
import { useCallback, useId, useRef, useState } from "react"

import { BlogBody } from "@/components/home/blog-body"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatBlogDate } from "@/lib/format-date"
import { homePanelAssets } from "@/lib/home-assets"

export type HomeBlog = {
  id: string
  title: string
  date: string
  content: string
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

const TABS: { id: HomeTabId; label: string }[] = [
  { id: "updates", label: "UPDATES" },
  { id: "screenshots", label: "SCREEN SHOTS" },
  { id: "faq", label: "F.A.Q" },
]

type HomeTabsProps = {
  blogs: HomeBlog[]
  faqs: HomeFaq[]
  screenshots: HomeScreenshot[]
}

function UpdatesPanel({ blogs }: { blogs: HomeBlog[] }) {
  const { blogBackground } = homePanelAssets

  if (blogs.length === 0) {
    return (
      <div className="home-panel">
        <p className="home-panel__empty">No updates yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <div className="home-updates">
      {blogs.map((blog) => (
        <article key={blog.id} className="home-panel home-panel__article">
          <Image
            src={blogBackground.src}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 768px) 100vw, 72rem"
            className="home-panel__texture"
          />
          <div className="home-panel__content">
            <h2 className="home-panel__title">{blog.title}</h2>
            <p className="home-panel__meta">{formatBlogDate(blog.date)}</p>
            <BlogBody content={blog.content} />
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
  const [activeTab, setActiveTab] = useState<HomeTabId>("updates")
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const focusTab = useCallback((index: number) => {
    tabRefs.current[index]?.focus()
  }, [])

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex = index

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % TABS.length
        break
      case "ArrowLeft":
        nextIndex = (index - 1 + TABS.length) % TABS.length
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = TABS.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    setActiveTab(TABS[nextIndex].id)
    focusTab(nextIndex)
  }

  return (
    <div className="home-page__main">
      <div
        role="tablist"
        aria-label="Battle Kards sections"
        className="home-nav"
      >
        {TABS.map((tab, index) => {
          const tabId = `${baseId}-tab-${tab.id}`
          const panelId = `${baseId}-panel-${tab.id}`

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={activeTab === tab.id}
              aria-controls={panelId}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className="home-tab"
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="home-page__panels">
        {TABS.map((tab) => {
          const tabId = `${baseId}-tab-${tab.id}`
          const panelId = `${baseId}-panel-${tab.id}`
          const isActive = activeTab === tab.id

          if (!isActive) {
            return null
          }

          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              tabIndex={0}
            >
              {tab.id === "updates" ? <UpdatesPanel blogs={blogs} /> : null}
              {tab.id === "screenshots" ? (
                <ScreenshotsPanel screenshots={screenshots} />
              ) : null}
              {tab.id === "faq" ? <FaqPanel faqs={faqs} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
