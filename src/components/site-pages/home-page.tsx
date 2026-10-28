import type { Metadata } from "next"
import Image from "next/image"

import { ForgetCachedHomeRedirect } from "@/components/home/clear-cached-home-redirect"
import { GameCard } from "@/components/landing/game-card"
import { GameHero } from "@/components/landing/game-hero"
import { loadRecentNews, RecentNews } from "@/components/landing/recent-news"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { buildAlternates, buildOpenGraph } from "@/lib/seo"

export async function HomePage({ locale }: { locale: Locale }) {
  const news = await loadRecentNews(locale)

  return (
    <div className="relative min-h-svh bg-black text-white">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[34rem] overflow-hidden"
        aria-hidden
      >
        <Image
          src="/images/black-blue-background.webp"
          alt=""
          width={3024}
          height={3102}
          sizes="100vw"
          className="absolute bottom-0 left-0 h-auto w-full max-w-none translate-y-[max(0px,calc(42%-22rem))]"
        />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col">
        {locale === DEFAULT_LOCALE ? <ForgetCachedHomeRedirect /> : null}
        <SiteHeader locale={locale} path="/" />
        <main className="flex-1 px-3 pb-16 sm:px-5">
          <GameHero locale={locale} />
          <div className="mx-auto w-full max-w-7xl">
            <GameCard locale={locale} />
            <RecentNews state={news} locale={locale} />
          </div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    </div>
  )
}

export function homeMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale)

  return {
    title: meta.homeTitle,
    description: meta.homeDescription,
    alternates: buildAlternates({ path: "/", available: LOCALES, canonicalLocale: locale }),
    openGraph: buildOpenGraph({
      locale,
      path: "/",
      title: meta.homeTitle,
      description: meta.homeDescription,
      available: LOCALES,
    }),
  }
}
