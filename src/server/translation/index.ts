import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { localePath, type TargetLocale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"

import { createTranslationEngine, type TranslationEngine } from "./engine"
import { createGoogleTranslator } from "./google"
import { prismaTranslationStore } from "./store.prisma"
import type { Kind } from "./types"

async function revalidatePublished(kind: Kind, entityId: string, locale: TargetLocale) {
  if (kind === "blog") {
    const blog = await prisma.blog.findUnique({ where: { id: entityId }, select: { slug: true } })

    if (blog) {
      revalidatePath(localePath(locale, `/updates/${blog.slug}`))
    }
  }

  revalidatePath(localePath(locale, kind === "news" ? "/" : "/updates"))
  revalidatePath("/sitemap.xml")
}

let engine: TranslationEngine | undefined

/** Engine wired to Postgres + Google Cloud Translation (+ cache revalidation). */
export function getTranslationEngine(options: { revalidate?: boolean } = {}): TranslationEngine {
  if (options.revalidate === false) {
    return createTranslationEngine({
      store: prismaTranslationStore,
      translator: createGoogleTranslator(),
    })
  }

  engine ??= createTranslationEngine({
    store: prismaTranslationStore,
    translator: createGoogleTranslator(),
    onPublished: revalidatePublished,
  })

  return engine
}

/**
 * Called from the admin controllers after a successful save. Queueing is a few
 * indexed writes; a failure here must never fail the save itself, so it is
 * logged and swallowed - the cron sweep and backfill will pick the row up.
 */
export async function queueTranslations(kind: Kind, entityId: string): Promise<boolean> {
  try {
    await getTranslationEngine().enqueue(kind, entityId)
    return true
  } catch (error) {
    console.error(`Failed to queue ${kind} translations:`, error)
    return false
  }
}

/**
 * Queue and process translations after the response is sent, so saving
 * content never waits on them. If queueing fails it is logged, and the next
 * save, the admin retry or the backfill picks the item up.
 */
export function queueAndProcess(kind: Kind, entityId: string) {
  after(async () => {
    if (await queueTranslations(kind, entityId)) {
      await drainTranslations(kind, entityId)
    }
  })
}

export async function drainTranslations(kind: Kind, entityId: string) {
  try {
    await getTranslationEngine().drain({ kind, entityId })
  } catch (error) {
    console.error(`Failed to process ${kind} translations:`, error)
  }
}
