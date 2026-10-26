"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { UkFlag } from "@/components/landing/uk-flag"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  current?: "game" | "updates"
}

function navLinkClass(active: boolean) {
  return cn(
    "text-white transition-colors duration-150 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-reduce:transition-none",
    active ? "text-lg leading-none font-bold" : "text-[15px] leading-none font-medium",
  )
}

function CommunityLabel({ inline = false }: { inline?: boolean }) {
  if (inline) {
    return (
      <span className="flex items-center gap-1 text-[15px] font-medium text-white">
        Community
        <Badge className="h-5 rounded-full bg-brand px-2 text-[10px] font-semibold text-white">
          Coming soon
        </Badge>
      </span>
    )
  }

  return (
    <span className="relative text-[15px] leading-none font-medium text-white">
      Community
      <Badge className="pointer-events-none ml-20 absolute bottom-[calc(100%+3px)] left-1/2 h-4 -translate-x-1/2 rounded-full bg-brand px-1.5 -mb-1 text-[10px] font-semibold text-white">
        Coming soon
      </Badge>
    </span>
  )
}

export function SiteHeader({ current = "game" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="px-3 pt-3 sm:px-5">
      <div className="mx-auto flex min-h-16 max-w-7xl items-stretch rounded-md border border-white/15 bg-[#2c2c2c]">
        <Link
          href="/"
          aria-label="Idolrun Entertainment"
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
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex lg:gap-8">
            <Link href="/" aria-current={current === "game" ? "page" : undefined} className={navLinkClass(current === "game")}>
              Game
            </Link>
            <Link
              href="/updates"
              aria-current={current === "updates" ? "page" : undefined}
              className={navLinkClass(current === "updates")}
            >
              Updates
            </Link>
            <CommunityLabel />
          </nav>

          <div className="ml-auto hidden items-center gap-5 text-[15px] font-medium text-white md:flex lg:gap-6">
            <span className="flex items-center gap-2">
              <UkFlag />
              English
            </span>
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-11 items-center justify-center rounded-md text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none md:hidden"
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-menu"
          className="mx-auto mt-2 flex max-w-7xl flex-col gap-4 rounded-md border border-white/15 bg-[#2c2c2c] px-4 py-4 text-white md:hidden"
        >
          <Link
            href="/"
            aria-current={current === "game" ? "page" : undefined}
            className={navLinkClass(current === "game")}
            onClick={() => setOpen(false)}
          >
            Game
          </Link>
          <Link
            href="/updates"
            aria-current={current === "updates" ? "page" : undefined}
            className={navLinkClass(current === "updates")}
            onClick={() => setOpen(false)}
          >
            Updates
          </Link>
          <CommunityLabel inline />
          <span className="flex items-center gap-2 text-[15px] font-medium">
            <UkFlag />
            English
          </span>
        </div>
      ) : null}
    </header>
  )
}
