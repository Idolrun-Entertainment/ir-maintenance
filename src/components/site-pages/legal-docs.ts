export const CONTACT_EMAIL = "hello@idolrun.com"
export const LEGAL_UPDATED = "25 November 2026"

export type LegalSlug = "privacy" | "terms" | "legal" | "cookies"

export type LegalDoc = {
  title: string
  description: string
  intro: string
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[]
}

export const LEGAL_SLUGS = ["privacy", "terms", "legal", "cookies"] as const

export const legalDocs: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "How Idolrun Entertainment collects, uses and protects personal information on the Battle Kards website.",
    intro:
      "This policy explains what personal information Idolrun Entertainment, Inc. (“Idolrun”, “we”, “us”) collects when you visit the Battle Kards website, how we use it, and the choices you have. Battle Kards is still in development, so this policy covers the website and its updates blog only. A game-specific policy will be published before the game launches.",
    sections: [
      {
        heading: "Information we collect",
        bullets: [
          "Comments: if you post a comment on an update, we store the name and message you type. Comments need no account and are shown publicly.",
          "Page views: we count how many times each update is viewed. The count is not tied to your identity.",
          "Language preference: if you switch language, we remember your choice in a cookie (see the Cookie Policy).",
          "Technical logs: our hosting provider automatically records standard request data such as IP address, browser type and pages requested, for security and reliability.",
          "Messages to us: if you email us, we keep your message and address so we can reply.",
        ],
      },
      {
        heading: "How we use it",
        bullets: [
          "To show your comments and keep the site free of spam and abuse.",
          "To understand which updates players read.",
          "To show the site in your preferred language.",
          "To secure and maintain the site, and to answer your questions.",
        ],
        paragraphs: [
          "We do not sell your personal information, and we do not use advertising or cross-site tracking cookies.",
        ],
      },
      {
        heading: "Service providers",
        paragraphs: [
          "We share information only with providers that help us run the site, under their own privacy terms:",
        ],
        bullets: [
          "Vercel hosts the website and processes request data on our behalf.",
          "Google Cloud Translation translates our published updates, FAQs and news into other languages. Only our own published text is sent, not visitor comments.",
          "Payment providers (such as Stripe, Apple Pay and Google Pay) will process purchases once in-game sales begin. They handle card details directly and we do not store full card numbers.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Comments stay online until we remove them or you ask us to. Server logs are kept by our host for a limited period. Emails are kept for as long as needed to handle your request.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can ask us to access, correct or delete personal information we hold about you, including a comment you posted, by emailing us from the address below. Tell us the update and the name you used so we can find it. Depending on where you live, you may have additional rights under local law, and we will honour them.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "The site is not directed to children under 13, and we do not knowingly collect their personal information. If you believe a child has posted a comment, contact us and we will remove it.",
        ],
      },
      {
        heading: "International visitors",
        paragraphs: [
          "Our providers may process data in countries other than your own. By using the site you understand your information may be transferred there.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this policy as Battle Kards develops, for example when accounts or purchases are introduced. The date at the top shows the latest version.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    description:
      "The rules for using the Battle Kards website and its updates, comments and content.",
    intro:
      "These terms govern your use of the Battle Kards website operated by Idolrun Entertainment, Inc. (“Idolrun”, “we”, “us”). By using the site you agree to them. If you do not agree, please do not use the site.",
    sections: [
      {
        heading: "The site and the game",
        paragraphs: [
          "Battle Kards is a turn-based card game in development with Coast 2 Coast Games. The site shares news, updates and information about it. Features, names, release timing and plans described here may change and are not a promise of any specific feature or date. Separate terms will apply to the game itself, including accounts and purchases, when it launches.",
        ],
      },
      {
        heading: "Comments and community conduct",
        paragraphs: [
          "You are responsible for what you post. When you comment, you agree not to:",
        ],
        bullets: [
          "harass, threaten or discriminate against anyone;",
          "post spam, advertising, malware or misleading links;",
          "share personal information about others, or anything illegal;",
          "impersonate another person or Idolrun staff.",
        ],
      },
      {
        heading: "Your content",
        paragraphs: [
          "You keep ownership of your comments. By posting, you give us a non-exclusive, worldwide, royalty-free licence to display and store them on the site. We may remove any comment at our discretion, with or without notice.",
        ],
      },
      {
        heading: "Our content",
        paragraphs: [
          "The site, its text, art, logos, card designs and game materials belong to Idolrun and its licensors and are protected by intellectual property laws. You may view and share links to the site for personal, non-commercial use. You may not copy, scrape, resell or modify our content without written permission.",
        ],
      },
      {
        heading: "Third-party links",
        paragraphs: [
          "The site links to third-party services, including social networks. We do not control them and are not responsible for their content or practices.",
        ],
      },
      {
        heading: "Disclaimer",
        paragraphs: [
          "The site is provided “as is” and “as available”, without warranties of any kind. We do not guarantee it will be uninterrupted, error-free or always accurate.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, Idolrun will not be liable for indirect, incidental or consequential damages arising from your use of the site. Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        heading: "Changes and termination",
        paragraphs: [
          "We may change these terms or the site at any time. Continued use after a change means you accept the updated terms. We may restrict access for anyone who breaks these terms.",
        ],
      },
    ],
  },

  legal: {
    title: "Legal Notice",
    description:
      "Operator, trademark, copyright and disclaimer information for the Battle Kards website.",
    intro:
      "This notice identifies who runs the Battle Kards website and sets out the ownership of its content.",
    sections: [
      {
        heading: "Operator",
        paragraphs: [
          "This website is operated by Idolrun Entertainment, Inc. Battle Kards is developed together with Coast 2 Coast Games.",
        ],
      },
      {
        heading: "Trademarks",
        paragraphs: [
          "“Battle Kards”, “Idolrun” and the related logos are trademarks of Idolrun Entertainment, Inc. All other names, logos and brands, including the payment and social media brands shown in the footer, belong to their respective owners and appear for identification only. Their use does not imply endorsement.",
        ],
      },
      {
        heading: "Copyright",
        paragraphs: [
          "All artwork, card and captain designs, realm and world content, text and code on this site are © 2026 Idolrun Entertainment, Inc. or used under licence. All rights reserved.",
        ],
      },
      {
        heading: "Community and fan content",
        paragraphs: [
          "Screenshots and artwork from Battle Kards may be shared on social media and in non-commercial fan content with credit to Battle Kards. Commercial use of our materials needs our written permission.",
        ],
      },
      {
        heading: "Information on this site",
        paragraphs: [
          "The game is in development. Descriptions of gameplay, cards, currencies, realms and release plans are for information only and may change before launch.",
        ],
      },
      {
        heading: "Copyright and takedown requests",
        paragraphs: [
          "If you believe content on this site infringes your rights, email us with the page address, a description of the material and proof of your ownership. We will review and respond promptly.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    description:
      "Which cookies the Battle Kards website uses and how you can control them.",
    intro:
      "Cookies are small text files a website stores in your browser. We keep their use to a minimum: the site sets no advertising, analytics or cross-site tracking cookies.",
    sections: [
      {
        heading: "Cookies we use",
        bullets: [
          "NEXT_LOCALE (functional, up to 1 year): remembers the language you picked so the site opens in it next time. Set only when you choose a language.",
          "Sign-in session (strictly necessary, session): used only by Idolrun staff signing in to manage site content. Visitors never receive it.",
        ],
      },
      {
        heading: "Cookies we do not use",
        paragraphs: [
          "We do not use advertising cookies, analytics cookies or third-party tracking cookies. Because we only use functional and strictly necessary cookies, the site shows no cookie banner. If that changes we will update this policy and ask for your consent first where required.",
        ],
      },
      {
        heading: "Third-party sites",
        paragraphs: [
          "Links to social networks such as X, Instagram, TikTok and Facebook leave our site. Those services may set their own cookies, governed by their policies.",
        ],
      },
      {
        heading: "Managing cookies",
        paragraphs: [
          "You can delete or block cookies in your browser settings. If you block the language cookie, the site still works but may open in the default language. Instructions are available in your browser’s help pages.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We will update this page if we add new cookies, for example when game accounts or payments launch.",
        ],
      },
    ],
  },
}
