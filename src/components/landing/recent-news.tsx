import { NewsCard } from "@/components/landing/news-card"
import { displayFont } from "@/components/landing/display-font"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNewsDate } from "@/lib/format-date"
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

export async function loadRecentNews(): Promise<RecentNewsState> {
  try {
    const { items } = await newsService.list({ page: 1, limit: 3 })

    if (items.length === 0) {
      return { status: "empty" }
    }

    return {
      status: "ready",
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        dateLabel: formatNewsDate(item.createdAt),
      })),
    }
  } catch (error) {
    console.error("Failed to load news:", error)
    return { status: "error" }
  }
}

function NewsHeading() {
  return (
    <h2
      id="recent-news-heading"
      className={`${displayFont} text-3xl font-extrabold tracking-wide text-white italic sm:text-4xl`}
    >
      RECENT NEWS
    </h2>
  )
}

export function RecentNewsFallback() {
  return (
    <section
      className="mx-auto mt-14 w-full max-w-7xl"
      aria-labelledby="recent-news-heading"
      aria-busy="true"
    >
      <NewsHeading />
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-72 rounded-none bg-[#0b2a58]" />
        ))}
      </div>
    </section>
  )
}

export function RecentNews({ state }: { state: RecentNewsState }) {
  return (
    <section className="mx-auto mt-14 w-full max-w-7xl" aria-labelledby="recent-news-heading">
      <NewsHeading />
      {state.status === "error" ? (
        <p className="mt-6 text-sm text-white/80">News is unavailable right now.</p>
      ) : null}
      {state.status === "empty" ? (
        <p className="mt-6 text-sm text-white/80">No news yet. Check back soon.</p>
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
