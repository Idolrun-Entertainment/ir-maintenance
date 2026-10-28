import type { TargetLocale } from "@/i18n/config"

export type Kind = "blog" | "faq" | "news"

export const KINDS: readonly Kind[] = ["blog", "faq", "news"]

export type JobState = "IDLE" | "QUEUED" | "RUNNING" | "FAILED"

// Bump to force every translation to be regenerated (e.g. after changing how
// content is split for the API). It is part of the source hash.
export const TRANSLATION_PIPELINE_VERSION = 1

export type Source =
  | { kind: "blog"; id: string; title: string; content: string }
  | { kind: "faq"; id: string; question: string; answer: string }
  | { kind: "news"; id: string; title: string }

/** Translated columns written to the translation row. */
export type Fields = Record<string, string | null>

export type Row = {
  kind: Kind
  id: string
  entityId: string
  locale: string
  jobState: JobState
  attempts: number
  nextAttemptAt: Date | null
  lockedUntil: Date | null
  translatedHash: string | null
  publishedAt: Date | null
  lastError: string | null
}

export type TranslationStatus =
  | "NOT_TRANSLATED"
  | "QUEUED"
  | "TRANSLATING"
  | "PUBLISHED"
  | "OUTDATED"
  | "FAILED"

export type LocaleStatus = {
  locale: TargetLocale
  status: TranslationStatus
  attempts: number
  lastError: string | null
  publishedAt: Date | null
}

/**
 * Persistence used by the engine. Prisma implementation in store.prisma.ts;
 * tests use an in-memory one. Every mutating method must be atomic - that is
 * what makes duplicate job execution safe.
 */
export interface TranslationStore {
  getSource(kind: Kind, id: string): Promise<Source | null>
  /** Cursor pagination by id; never loads everything at once. */
  pageSources(kind: Kind, afterId: string | null, take: number): Promise<Source[]>
  listRows(kind: Kind, entityIds: string[]): Promise<Row[]>
  /** Creates a QUEUED row; a no-op if (entity, locale) already exists. */
  createRowIfMissing(kind: Kind, entityId: string, locale: string): Promise<void>
  /** Back to QUEUED, attempts reset. Not applied to a live RUNNING row. */
  requeue(kind: Kind, rowId: string, opts?: { resetHash?: boolean }): Promise<void>
  /** Flags a RUNNING row so it is re-queued when it finishes. */
  markDirty(kind: Kind, rowId: string, now: Date): Promise<void>
  /** Atomically takes a claimable row (QUEUED and due, or RUNNING with an expired lease). */
  claim(kind: Kind, rowId: string, now: Date, leaseUntil: Date): Promise<Row | null>
  /** Writes the translation. Re-queues instead of going IDLE if the row was flagged dirty. */
  complete(kind: Kind, row: Row, fields: Fields, hash: string, now: Date): Promise<void>
  fail(
    kind: Kind,
    row: Row,
    result: { state: "QUEUED" | "FAILED"; error: string; nextAttemptAt: Date | null },
  ): Promise<void>
  due(
    now: Date,
    opts: { kind?: Kind; entityId?: string; limit: number },
  ): Promise<Row[]>
}

export interface Translator {
  /** Translates HTML fragments from English. Output has the same length and order. */
  translateHtml(texts: string[], targetGoogleCode: string): Promise<string[]>
}

export class PermanentTranslationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PermanentTranslationError"
  }
}
