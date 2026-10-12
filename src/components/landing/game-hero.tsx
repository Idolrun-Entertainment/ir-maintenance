import Image from "next/image"

import { displayFont } from "@/components/landing/display-font"

export function GameHero() {
  return (
    <section className="relative mx-auto mt-2 w-full max-w-7xl" aria-labelledby="our-games-heading">
      <Image
        src="/images/hero-3-black.webp"
        alt="Three armored figures standing against a black background"
        width={3024}
        height={934}
        preload
        sizes="(max-width: 1152px) 100vw, 1152px"
        className="h-auto w-full"
      />
      <h1
        id="our-games-heading"
        className={`${displayFont} absolute bottom-[6%] left-[1%] text-5xl font-extrabold tracking-wide text-white italic sm:text-6xl md:text-7xl lg:text-[5.5rem]`}
      >
        OUR GAMES
      </h1>
    </section>
  )
}
