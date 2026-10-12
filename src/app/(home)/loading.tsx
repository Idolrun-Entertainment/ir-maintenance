import { GameCard } from "@/components/landing/game-card"
import { GameHero } from "@/components/landing/game-hero"
import { RecentNewsFallback } from "@/components/landing/recent-news"
import { SiteHeader } from "@/components/landing/site-header"

export default function HomeLoading() {
  return (
    <div className="min-h-svh bg-black text-white">
      <SiteHeader accountHref="/sign-in" />
      <main className="px-3 pb-16 sm:px-5">
        <GameHero />
        <div className="mx-auto w-full max-w-7xl">
          <GameCard />
          <RecentNewsFallback />
        </div>
      </main>
    </div>
  )
}
