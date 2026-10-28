import Image from "next/image"

import { displayFont } from "@/components/landing/display-font"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { homeHeroAssets } from "@/lib/home-assets"

export function HomeHero({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { topBackground } = homeHeroAssets
  const { updates, home } = getDictionary(locale)

  return (
    <section className="relative mt-2 w-full bg-black" aria-labelledby="updates-heading">
      <div className="relative aspect-[2.05/1] w-full overflow-hidden sm:aspect-[2.4/1] lg:aspect-[3024/934]">
        <Image
          src={topBackground.src}
          alt={locale === DEFAULT_LOCALE ? topBackground.alt : home.heroAlt}
          fill
          preload
          sizes="(max-width: 1280px) calc(100vw - 1.5rem), 1280px"
          className="object-cover object-center"
        />
        <h1
          id="updates-heading"
          className={`${displayFont} italic absolute bottom-[7%] left-[2%] text-[2.35rem] leading-none font-extrabold tracking-[0.04em] text-white sm:text-5xl md:text-7xl lg:text-[5.25rem]`}
        >
          {updates.heading}
        </h1>
      </div>
    </section>
  )
}
