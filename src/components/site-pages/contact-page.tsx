import type { Metadata } from "next"
import Image from "next/image"
import { Fragment, type ReactNode } from "react"

import { ContactForm } from "@/components/home/contact-form"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { CONTACT_EMAIL } from "@/components/site-pages/legal-docs"
import { LOCALES, localePath, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionary"
import { homePanelAssets } from "@/lib/home-assets"
import { buildAlternates, buildOpenGraph } from "@/lib/seo"

// Fills the `{email}` / `{privacy}` placeholders with links.
function withLinks(template: string, links: Record<string, ReactNode>) {
  return template
    .split(/(\{\w+\})/)
    .map((part, index) => <Fragment key={index}>{links[part.slice(1, -1)] ?? part}</Fragment>)
}

export function ContactPage({ locale }: { locale: Locale }) {
  const { blogBackground } = homePanelAssets
  const dict = getDictionary(locale)
  const { contact } = dict

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-black text-white">
      <SiteHeader current="none" locale={locale} path="/contact" />
      <main className="flex-1 px-3 pb-16 sm:px-5">
        <div className="mx-auto mt-4 w-full max-w-7xl">
          <article lang={locale} className="home-panel home-panel__article">
            <Image
              src={blogBackground.src}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 72rem"
              className="home-panel__texture"
            />
            <div className="home-panel__content">
              <h1 className="home-panel__title">{contact.title}</h1>
              <div className="home-panel__body">
                <p>{contact.intro}</p>
              </div>
              <ContactForm labels={contact} />
              <div className="home-panel__body mt-6">
                <p>
                  {withLinks(contact.preferEmail, {
                    email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>,
                    privacy: (
                      <a href={localePath(locale, "/privacy")}>{dict.footer.privacy}</a>
                    ),
                  })}
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

export function contactMetadata(locale: Locale): Metadata {
  const path = "/contact"
  const { contact } = getDictionary(locale)

  return {
    title: contact.metaTitle,
    description: contact.metaDescription,
    alternates: buildAlternates({ path, available: LOCALES, canonicalLocale: locale }),
    openGraph: buildOpenGraph({
      locale,
      path,
      title: contact.metaTitle,
      description: contact.metaDescription,
      available: LOCALES,
    }),
  }
}
