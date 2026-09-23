export type HomeImageAsset = {
  src: string
  alt: string
  width: number
  height: number
}

export const homeHeroAssets = {
  topBackground: {
    src: "/images/hero-background-battle.png",
    alt: "Battle Kards lightning and card artwork",
    width: 6120,
    height: 1892,
  },
  topMark: {
    src: "/images/idolrun-logo.png",
    alt: "Idolrum Entertainment",
    width: 200,
    height: 184,
  },
  wordmark: {
    src: "/images/battle_kards_logo.png",
    alt: "Battle Kards",
    width: 708,
    height: 619,
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

export const homeScreenshotAssets: HomeImageAsset[] = [
  {
    src: "/images/fox.png",
    alt: "Battle Kards character artwork",
    width: 897,
    height: 894,
  },
]
