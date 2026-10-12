import Image from "next/image"

import { displayFont } from "@/components/landing/display-font"
import { isAllowedNewsImageUrl } from "@/lib/news-image"

type NewsCardProps = {
  title: string
  imageUrl: string | null
  dateLabel: string
}

function NewsImage({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  if (!imageUrl || !isAllowedNewsImageUrl(imageUrl)) {
    return <div className="absolute inset-0 bg-brand" />
  }

  return (
    <Image
      src={imageUrl}
      alt={title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 22rem"
      className="object-cover"
    />
  )
}

export function NewsCard({ title, imageUrl, dateLabel }: NewsCardProps) {
  return (
    <article className="flex h-full flex-col bg-[#0b2a58] px-4 pt-4 pb-4">
      <h3 className={`${displayFont} text-lg leading-tight font-bold tracking-wide text-white uppercase`}>
        {title}
      </h3>
      <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden bg-black">
        <NewsImage imageUrl={imageUrl} title={title} />
      </div>
      <p className={`${displayFont} mt-auto pt-4 text-sm tracking-wide text-white/90`}>
        {dateLabel}
      </p>
    </article>
  )
}
