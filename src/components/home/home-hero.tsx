import Image from "next/image"

import { homeHeroAssets } from "@/lib/home-assets"

export function HomeHero() {
  const { topBackground, topMark, wordmark } = homeHeroAssets

  return (
    <header className="home-hero">
      <div className="home-hero__inner">
        <Image
          src={topBackground.src}
          alt={topBackground.alt}
          width={topBackground.width}
          height={topBackground.height}
          priority
          className="home-hero__background"
          sizes="100vw"
        />
        <div className="home-hero__brand">
          <Image
            src={topMark.src}
            alt={topMark.alt}
            width={topMark.width}
            height={topMark.height}
            priority
            className="home-hero__mark"
          />
          <Image
            src={wordmark.src}
            alt={wordmark.alt}
            width={wordmark.width}
            height={wordmark.height}
            priority
            className="home-hero__logo"
          />
        </div>
      </div>
    </header>
  )
}
