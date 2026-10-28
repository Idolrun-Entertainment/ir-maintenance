"use client"

import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { LOCALE_COOKIE, LOCALE_META, type Locale } from "@/i18n/config"
import type { LanguageLink } from "@/i18n/links"
import { cn } from "@/lib/utils"

type LanguageSwitcherProps = {
  locale: Locale
  links: LanguageLink[]
  label: string
  /** `menu`: desktop dropdown. `inline`: always-open list for the mobile panel. */
  variant?: "menu" | "inline"
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

function rememberChoice(locale: Locale) {
  // URL stays authoritative for the page; the cookie only seeds the default
  // language on later visits (see src/proxy.ts).
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

function LanguageList({
  locale,
  links,
  onNavigate,
  className,
  itemClassName,
}: {
  locale: Locale
  links: LanguageLink[]
  onNavigate?: () => void
  className?: string
  itemClassName?: string
}) {
  return (
    <ul className={className}>
      {links.map((link) => {
        const current = link.locale === locale

        return (
          <li key={link.locale}>
            {/* Plain anchor: crossing between the English and prefixed
                locales switches root layouts, which is a full navigation. */}
            <a
              href={link.href}
              lang={link.locale}
              hrefLang={link.locale}
              aria-current={current ? "true" : undefined}
              data-language-link
              className={cn(
                "flex items-center justify-between gap-3 text-[15px] transition-colors duration-150 motion-reduce:transition-none",
                focusRing,
                current ? "font-semibold" : "font-medium",
                itemClassName,
              )}
              onClick={() => {
                rememberChoice(link.locale)
                onNavigate?.()
              }}
            >
              {link.nativeName}
              {current ? <CheckIcon className="size-4" aria-hidden /> : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function LanguageSwitcher({
  locale,
  links,
  label,
  variant = "menu",
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  if (variant === "inline") {
    return (
      <div className="border-t border-white/15 pt-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/70 uppercase">
          <GlobeIcon className="size-3.5" aria-hidden />
          {label}
        </p>
        <LanguageList
          locale={locale}
          links={links}
          className="flex flex-col gap-1"
          itemClassName="min-h-11 rounded-md px-2 text-white hover:bg-white/10"
        />
      </div>
    )
  }

  function moveFocus(direction: 1 | -1) {
    const items = Array.from(
      rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-language-link]") ?? [],
    )
    const index = items.indexOf(document.activeElement as HTMLAnchorElement)
    const next = items[(index + direction + items.length) % items.length]
    next?.focus()
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault()
          setOpen(false)
          buttonRef.current?.focus()
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault()
          setOpen(true)
          if (open) {
            moveFocus(event.key === "ArrowDown" ? 1 : -1)
          } else {
            requestAnimationFrame(() =>
              rootRef.current?.querySelector<HTMLAnchorElement>("[data-language-link]")?.focus(),
            )
          }
        }
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-white/10 motion-reduce:transition-none",
          focusRing,
        )}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${LOCALE_META[locale].nativeName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon className="size-4" aria-hidden />
        <span lang={locale}>{LOCALE_META[locale].nativeName}</span>
        <ChevronDownIcon
          className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <div
        id={listId}
        hidden={!open}
        className="absolute right-0 z-50 mt-2 min-w-48 rounded-md border border-white/15 bg-[#2c2c2c] p-1 shadow-lg"
      >
        <LanguageList
          locale={locale}
          links={links}
          onNavigate={() => setOpen(false)}
          itemClassName="min-h-10 rounded-sm px-3 text-white hover:bg-white/10"
        />
      </div>
    </div>
  )
}
