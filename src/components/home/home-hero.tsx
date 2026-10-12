import Image from "next/image"

import { displayFont } from "@/components/landing/display-font"
import { homeHeroAssets } from "@/lib/home-assets"

export function HomeHero() {
  const { topBackground } = homeHeroAssets

  return (
    <section className="relative mt-2 w-full bg-black" aria-labelledby="updates-heading">
      <div className="relative aspect-[2.05/1] w-full overflow-hidden sm:aspect-[2.4/1] lg:aspect-[3024/934]">
        <Image
          src={topBackground.src}
          alt={topBackground.alt}
          fill
          preload
          sizes="(max-width: 1280px) calc(100vw - 1.5rem), 1280px"
          className="object-cover object-center"
        />
        <h1
          id="updates-heading"
          className={`${displayFont} italic absolute bottom-[7%] left-[2%] text-[2.35rem] leading-none font-extrabold tracking-[0.04em] text-white sm:text-5xl md:text-7xl lg:text-[5.25rem]`}
        >
          UPDATES
        </h1>
      </div>
    </section>
  )
}
