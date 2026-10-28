import { NewsCard } from "@/components/landing/news-card"
import { displayFont } from "@/components/landing/display-font"
import { Skeleton } from "@/components/ui/skeleton"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { formatNewsDate } from "@/lib/format-date"
import { localizeNews } from "@/server/translation/read"
import { newsService } from "@/server/services/news.service"

export type RecentNewsItem = {
  id: string
  title: string
  imageUrl: string | null
  dateLabel: string
}

export type RecentNewsState =
  | { status: "ready"; items: RecentNewsItem[] }
  | { status: "empty" }
  | { status: "error" }

export async function loadRecentNews(locale: Locale = DEFAULT_LOCALE): Promise<RecentNewsState> {
  try {
    const { items: source } = await newsService.list({ page: 1, limit: 3 })
    const items = await localizeNews(source, locale)

    if (items.length === 0) {
      return { status: "empty" }
    }

    return {
      status: "ready",
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        dateLabel: formatNewsDate(item.createdAt, locale),
      })),
    }
  } catch (error) {
    console.error("Failed to load news:", error)
    return { status: "error" }
  }
}

function NewsHeading({ locale }: { locale: Locale }) {
  return (
    <h2
      id="recent-news-heading"
      className={`${displayFont} text-3xl font-extrabold tracking-wide text-white italic sm:text-4xl`}
    >
      {getDictionary(locale).home.recentNews}
    </h2>
  )
}

export function RecentNewsFallback({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <section
      className="mx-auto mt-14 w-full max-w-7xl"
      aria-labelledby="recent-news-heading"
      aria-busy="true"
    >
      <NewsHeading locale={locale} />
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-72 rounded-none bg-[#0b2a58]" />
        ))}
      </div>
    </section>
  )
}

export function RecentNews({
  state,
  locale = DEFAULT_LOCALE,
}: {
  state: RecentNewsState
  locale?: Locale
}) {
  const { home } = getDictionary(locale)

  return (
    <section className="mx-auto mt-14 w-full max-w-7xl" aria-labelledby="recent-news-heading">
      <NewsHeading locale={locale} />
      {state.status === "error" ? (
        <p className="mt-6 text-sm text-white/80">{home.newsUnavailable}</p>
      ) : null}
      {state.status === "empty" ? (
        <p className="mt-6 text-sm text-white/80">{home.newsEmpty}</p>
      ) : null}
      {state.status === "ready" ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {state.items.map((item) => (
            <NewsCard
              key={item.id}
              title={item.title}
              imageUrl={item.imageUrl}
              dateLabel={item.dateLabel}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
