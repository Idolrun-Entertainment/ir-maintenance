"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { LanguageSwitcher } from "@/components/landing/language-switcher"
import { Badge } from "@/components/ui/badge"
import { localePath, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n/dictionary"
import type { LanguageLink } from "@/i18n/links"
import { cn } from "@/lib/utils"

type NavLabels = Dictionary["nav"]

type SiteHeaderClientProps = {
  current: "game" | "updates"
  locale: Locale
  labels: NavLabels
  languageLinks: LanguageLink[]
}

function navLinkClass(active: boolean) {
  return cn(
    "text-white transition-colors duration-150 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-reduce:transition-none",
    active ? "text-lg leading-none font-bold" : "text-[15px] leading-none font-medium",
  )
}

function CommunityLabel({
  inline = false,
  labels,
}: {
  inline?: boolean
  labels: NavLabels
}) {
  if (inline) {
    return (
      <span className="flex items-center gap-1 text-[15px] font-medium text-white">
        {labels.community}
        <Badge className="h-5 rounded-full bg-brand px-2 text-[10px] font-semibold text-white">
          {labels.comingSoon}
        </Badge>
      </span>
    )
  }

  return (
    <span className="relative text-[15px] leading-none font-medium text-white">
      {labels.community}
      <Badge className="pointer-events-none ml-20 absolute bottom-[calc(100%+3px)] left-1/2 h-4 -translate-x-1/2 rounded-full bg-brand px-1.5 -mb-1 text-[10px] font-semibold text-white">
        {labels.comingSoon}
      </Badge>
    </span>
  )
}

export function SiteHeaderClient({
  current,
  locale,
  labels,
  languageLinks,
}: SiteHeaderClientProps) {
  const [open, setOpen] = useState(false)
  const gameHref = localePath(locale, "/")
  const updatesHref = localePath(locale, "/updates")

  return (
    <header className="px-3 pt-3 sm:px-5">
      <div className="mx-auto flex min-h-16 max-w-7xl items-stretch rounded-md border border-white/15 bg-[#2c2c2c]">
        <Link
          href={gameHref}
          aria-label={labels.home}
          className="flex shrink-0 items-center rounded-l-md border-r border-white/10 bg-[#1e1e1e] px-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:px-5"
        >
          <Image
            src="/images/idolrun-logo.png"
            alt=""
            width={200}
            height={184}
            preload
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <nav
            aria-label={labels.primary}
            className="hidden items-center gap-6 md:flex lg:gap-8"
          >
            <Link
              href={gameHref}
              aria-current={current === "game" ? "page" : undefined}
              className={navLinkClass(current === "game")}
            >
              {labels.game}
            </Link>
            <Link
              href={updatesHref}
              aria-current={current === "updates" ? "page" : undefined}
              className={navLinkClass(current === "updates")}
            >
              {labels.updates}
            </Link>
            <CommunityLabel labels={labels} />
          </nav>

          <div className="ml-auto hidden items-center gap-5 text-[15px] font-medium text-white md:flex lg:gap-6">
            <LanguageSwitcher
              locale={locale}
              links={languageLinks}
              label={labels.language}
            />
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-11 items-center justify-center rounded-md text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none md:hidden"
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">
              {open ? labels.closeMenu : labels.openMenu}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-menu"
          className="mx-auto mt-2 flex max-w-7xl flex-col gap-4 rounded-md border border-white/15 bg-[#2c2c2c] px-4 py-4 text-white md:hidden"
        >
          <Link
            href={gameHref}
            aria-current={current === "game" ? "page" : undefined}
            className={navLinkClass(current === "game")}
            onClick={() => setOpen(false)}
          >
            {labels.game}
          </Link>
          <Link
            href={updatesHref}
            aria-current={current === "updates" ? "page" : undefined}
            className={navLinkClass(current === "updates")}
            onClick={() => setOpen(false)}
          >
            {labels.updates}
          </Link>
          <CommunityLabel inline labels={labels} />
          <LanguageSwitcher
            variant="inline"
            locale={locale}
            links={languageLinks}
            label={labels.language}
          />
        </div>
      ) : null}
    </header>
  )
}
