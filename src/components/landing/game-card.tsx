import Image from "next/image"

import { displayFont } from "@/components/landing/display-font"

export function GameCard() {
  return (
    <article className="mx-auto mt-4 w-full max-w-[26rem] sm:mx-0">
      <div className="flex items-center justify-center bg-brand px-8 py-7">
        <Image
          src="/images/battle_kards_logo.png"
          alt="Battle Kards"
          width={708}
          height={619}
          sizes="16rem"
          className="h-auto w-56"
        />
      </div>
      <div className="bg-[#0b2a58] px-8 pt-7 pb-8 text-center">
        <p className="mx-auto max-w-[16rem] text-[15px] leading-6 text-white">
          A turn based MMO card game where players battle for glory
        </p>
        <p className="relative mx-auto mt-6 h-[3.05rem] w-56">
          <span className="absolute inset-x-2 inset-y-1.5 rounded-full bg-gradient-to-b from-[#ff8a3d] to-[#d24a14]" />
          <Image
            src="/images/button-outline.webp"
            alt=""
            fill
            sizes="14rem"
            className="object-fill"
          />
          <span
            className={`${displayFont} relative z-10 flex h-full items-center justify-center text-xl font-bold tracking-[0.14em] text-white`}
          >
            COMING SOON
          </span>
        </p>
      </div>
    </article>
  )
}
