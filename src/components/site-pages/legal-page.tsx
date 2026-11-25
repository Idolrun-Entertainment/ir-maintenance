import type { Metadata } from "next"
import Image from "next/image"

import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import {
  CONTACT_EMAIL,
  LEGAL_UPDATED,
  legalDocs,
  type LegalSlug,
} from "@/components/site-pages/legal-docs"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import { homePanelAssets } from "@/lib/home-assets"
import { buildAlternates, buildOpenGraph } from "@/lib/seo"

// Legal, About and Support text is English-only: the header and footer follow `locale`, the
// article body stays in English so no unreviewed translation is shown as law.
export function LegalPage({ locale, slug }: { locale: Locale; slug: LegalSlug }) {
  const doc = legalDocs[slug]
  const { blogBackground } = homePanelAssets

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-black text-white">
      <SiteHeader current="none" locale={locale} path={`/${slug}`} />
      <main className="flex-1 px-3 pb-16 sm:px-5">
        <div className="mx-auto mt-4 w-full max-w-7xl">
          <article lang={DEFAULT_LOCALE} className="home-panel home-panel__article">
            <Image
              src={blogBackground.src}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 72rem"
              className="home-panel__texture"
            />
            <div className="home-panel__content">
              <h1 className="home-panel__title">{doc.title}</h1>
              {doc.undated ? null : (
                <p className="home-panel__meta">Last updated {LEGAL_UPDATED}</p>
              )}
              <div className="home-panel__body">
                <p>{doc.intro}</p>
                {doc.sections.map((section) => (
                  <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
                    {section.bullets ? (
                      <ul className="list-disc">
                        {section.bullets.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
                <section>
                  <h2>Contact</h2>
                  <p>
                    {doc.contactIntro ?? "Questions about this page? Email us at"}{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                  </p>
                </section>
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

export function legalMetadata(locale: Locale, slug: LegalSlug): Metadata {
  const doc = legalDocs[slug]
  const path = `/${slug}`
  const title = `${doc.title} - Idolrun Entertainment`

  return {
    title,
    description: doc.description,
    // English body under a localized URL: canonical points at the English page.
    alternates: buildAlternates({ path, available: [], canonicalLocale: DEFAULT_LOCALE }),
    robots: locale === DEFAULT_LOCALE ? undefined : { index: false, follow: true },
    openGraph: buildOpenGraph({
      locale,
      path,
      title,
      description: doc.description,
      available: [],
    }),
  }
}
