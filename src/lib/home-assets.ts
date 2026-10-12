export type HomeImageAsset = {
  src: string
  alt: string
  width: number
  height: number
}

export const homeHeroAssets = {
  topBackground: {
    src: "/images/hero-3-black.webp",
    alt: "Three armored figures standing against a black background",
    width: 3024,
    height: 934,
  },
} as const satisfies Record<string, HomeImageAsset>

export const homePanelAssets = {
  blogBackground: {
    src: "/images/blog-background.png",
    alt: "",
    width: 1866,
    height: 1820,
  },
} as const satisfies Record<string, HomeImageAsset>
