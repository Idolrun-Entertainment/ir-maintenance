// English is the shape every other dictionary must match. Placeholders in
// braces ({count}, {language}) are filled by `format()` in ../dictionary.ts.
export const en = {
  meta: {
    homeTitle: "Idolrun Entertainment - Battle Kards",
    homeDescription:
      "Idolrun Entertainment builds Battle Kards, a turn based MMO card game where players battle for glory.",
    updatesTitle: "Updates - Idolrun Entertainment",
    updatesDescription:
      "Latest updates, screenshots and FAQ for Battle Kards from Idolrun Entertainment.",
  },
  nav: {
    primary: "Primary",
    home: "Idolrun Entertainment",
    game: "Game",
    updates: "Updates",
    community: "Community",
    comingSoon: "Coming soon",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  footer: {
    about: "About",
    support: "Support",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms",
    legal: "Legal",
    cookies: "Cookie Policy",
    copyright:
      "©2026 Idolrun Entertainment, Inc. All trademarks referenced herein are the properties of respective owner",
    paymentPartners: "Our payment partners",
  },
  home: {
    ourGames: "OUR GAMES",
    heroAlt: "Three armored figures standing against a black background",
    tagline: "A turn based MMO card game where players battle for glory",
    comingSoonButton: "COMING SOON",
    recentNews: "RECENT NEWS",
    newsUnavailable: "News is unavailable right now.",
    newsEmpty: "No news yet. Check back soon.",
  },
  updates: {
    heading: "UPDATES",
    sectionsLabel: "Updates sections",
    tabUpdates: "Updates",
    tabScreenshots: "Screen Shots",
    tabFaq: "F.A.Q",
    panelScreenshots: "Screen shots",
    latest: "Latest",
    oldest: "Oldest",
    sortLabel: "{current}. Show {next} blogs first",
    emptyUpdates: "No updates yet. Check back soon.",
    emptyScreenshots: "No screenshots available yet.",
    emptyFaq: "No FAQs available yet.",
    screenshotPreview: "Screenshot preview",
    screenshotEnlarged: "Enlarged screenshot preview",
    views: "{count} views",
    permalink: "Permalink",
    backToUpdates: "Back to updates",
  },
  comments: {
    label: "Comments",
    heading: "Comments ({count})",
    shareToggle: "Share Your Thoughts",
    nameLabel: "Name (optional)",
    anonymous: "Anonymous",
    commentLabel: "Comment",
    placeholder: "Share your thoughts",
    posting: "Posting...",
    submit: "Post comment",
    posted: "Comment posted",
    failed: "Failed to post comment",
    invalid: "Comment is invalid",
    empty: "No comments yet. Be the first to say something.",
  },
  fallback: {
    notTranslated:
      "This article is not available in {language} yet. Showing the English original.",
  },
} as const

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export type Dictionary = Widen<typeof en>
