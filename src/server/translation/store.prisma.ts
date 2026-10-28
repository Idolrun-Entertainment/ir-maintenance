import { prisma } from "@/lib/prisma"

import {
  KINDS,
  type Fields,
  type JobState,
  type Kind,
  type Row,
  type Source,
  type TranslationStore,
} from "./types"

// The three translation tables share their job columns but differ in typed
// fields, so Prisma's generated delegates cannot be called through a union.
// This narrow structural view is the only place that is cast.
type Args = Record<string, unknown>
type Record_ = Record<string, unknown>
type Delegate = {
  findMany(args: Args): Promise<Record_[]>
  findUnique(args: Args): Promise<Record_ | null>
  createMany(args: Args): Promise<{ count: number }>
  updateMany(args: Args): Promise<{ count: number }>
}

const TABLES: Record<Kind, { translation: Delegate; entityKey: string }> = {
  blog: { translation: prisma.blogTranslation as unknown as Delegate, entityKey: "blogId" },
  faq: { translation: prisma.faqTranslation as unknown as Delegate, entityKey: "faqId" },
  news: { translation: prisma.newsTranslation as unknown as Delegate, entityKey: "newsId" },
}

function toRow(kind: Kind, record: Record_): Row {
  return {
    kind,
    id: record.id as string,
    entityId: record[TABLES[kind].entityKey] as string,
    locale: record.locale as string,
    jobState: record.jobState as JobState,
    attempts: record.attempts as number,
    nextAttemptAt: (record.nextAttemptAt as Date | null) ?? null,
    lockedUntil: (record.lockedUntil as Date | null) ?? null,
    translatedHash: (record.translatedHash as string | null) ?? null,
    publishedAt: (record.publishedAt as Date | null) ?? null,
    lastError: (record.lastError as string | null) ?? null,
  }
}

function claimable(now: Date): Args {
  return {
    OR: [
      {
        jobState: "QUEUED",
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      { jobState: "RUNNING", lockedUntil: { lt: now } },
    ],
  }
}

export const prismaTranslationStore: TranslationStore = {
  async getSource(kind, id) {
    if (kind === "blog") {
      const blog = await prisma.blog.findUnique({
        where: { id },
        select: { id: true, title: true, content: true },
      })
      return blog ? { kind, ...blog } : null
    }

    if (kind === "faq") {
      const faq = await prisma.faq.findUnique({
        where: { id },
        select: { id: true, question: true, answer: true },
      })
      return faq ? { kind, ...faq } : null
    }

    const news = await prisma.news.findUnique({
      where: { id },
      select: { id: true, title: true },
    })
    return news ? { kind, ...news } : null
  },

  async pageSources(kind, afterId, take) {
    const page = {
      take,
      orderBy: { id: "asc" as const },
      ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
    }

    if (kind === "blog") {
      const rows = await prisma.blog.findMany({
        ...page,
        select: { id: true, title: true, content: true },
      })
      return rows.map((row): Source => ({ kind, ...row }))
    }

    if (kind === "faq") {
      const rows = await prisma.faq.findMany({
        ...page,
        select: { id: true, question: true, answer: true },
      })
      return rows.map((row): Source => ({ kind, ...row }))
    }

    const rows = await prisma.news.findMany({
      ...page,
      select: { id: true, title: true },
    })
    return rows.map((row): Source => ({ kind, ...row }))
  },

  async listRows(kind, entityIds) {
    if (entityIds.length === 0) return []

    const { translation, entityKey } = TABLES[kind]
    const rows = await translation.findMany({
      where: { [entityKey]: { in: entityIds } },
    })

    return rows.map((row) => toRow(kind, row))
  },

  async createRowIfMissing(kind, entityId, locale) {
    const { translation, entityKey } = TABLES[kind]
    await translation.createMany({
      data: [{ [entityKey]: entityId, locale, jobState: "QUEUED" }],
      skipDuplicates: true,
    })
  },

  async requeue(kind, rowId, opts) {
    await TABLES[kind].translation.updateMany({
      // Never steal a row another worker holds.
      where: { id: rowId, jobState: { not: "RUNNING" } },
      data: {
        jobState: "QUEUED",
        attempts: 0,
        nextAttemptAt: null,
        lockedUntil: null,
        lastError: null,
        ...(opts?.resetHash ? { translatedHash: null } : {}),
      },
    })
  },

  async markDirty(kind, rowId, now) {
    await TABLES[kind].translation.updateMany({
      where: { id: rowId, jobState: "RUNNING" },
      data: { nextAttemptAt: now },
    })
  },

  async claim(kind, rowId, now, leaseUntil) {
    const { translation } = TABLES[kind]
    const { count } = await translation.updateMany({
      where: { id: rowId, ...claimable(now) },
      data: {
        jobState: "RUNNING",
        lockedUntil: leaseUntil,
        nextAttemptAt: null,
        attempts: { increment: 1 },
      },
    })

    if (count !== 1) return null

    const record = await translation.findUnique({ where: { id: rowId } })
    return record ? toRow(kind, record) : null
  },

  async complete(kind, row, fields: Fields, hash, now) {
    const { translation } = TABLES[kind]
    const data = {
      ...fields,
      translatedHash: hash,
      publishedAt: row.publishedAt ?? now,
      lockedUntil: null,
      lastError: null,
      attempts: 0,
    }

    // Clean finish: nothing changed while we were translating.
    const clean = await translation.updateMany({
      where: { id: row.id, jobState: "RUNNING", nextAttemptAt: null },
      data: { ...data, jobState: "IDLE", nextAttemptAt: null },
    })

    if (clean.count === 1) return

    // The source was edited mid-flight (markDirty): keep this translation
    // live, but go round again.
    await translation.updateMany({
      where: { id: row.id, jobState: "RUNNING" },
      data: { ...data, jobState: "QUEUED", nextAttemptAt: null },
    })
  },

  async fail(kind, row, result) {
    await TABLES[kind].translation.updateMany({
      where: { id: row.id, jobState: "RUNNING" },
      data: {
        jobState: result.state,
        lockedUntil: null,
        lastError: result.error,
        nextAttemptAt: result.nextAttemptAt,
      },
    })
  },

  async due(now, opts) {
    const kinds = opts.kind ? [opts.kind] : KINDS
    const perKind = await Promise.all(
      kinds.map(async (kind) => {
        const { translation, entityKey } = TABLES[kind]
        const rows = await translation.findMany({
          where: {
            ...claimable(now),
            ...(opts.entityId ? { [entityKey]: opts.entityId } : {}),
          },
          orderBy: { createdAt: "asc" },
          take: opts.limit,
        })

        return rows.map((row) => toRow(kind, row))
      }),
    )

    return perKind.flat().slice(0, opts.limit)
  },
}
