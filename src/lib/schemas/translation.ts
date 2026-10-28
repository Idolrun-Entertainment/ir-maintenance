import { z } from "zod"

import { TARGET_LOCALES } from "@/i18n/config"

const kind = z.enum(["blog", "faq", "news"])
const locale = z.enum(TARGET_LOCALES)

export const translationStatusQuerySchema = z.object({
  kind,
  ids: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(1).max(64)).min(1).max(100)),
})

export const translationRetrySchema = z.object({
  kind,
  id: z.string().min(1).max(64),
  locales: z.array(locale).min(1).optional(),
  // Redo even if the translation is current (e.g. after a glossary change).
  force: z.boolean().optional(),
})

export const translationBackfillSchema = z.object({
  kind,
  cursor: z.string().min(1).max(64).nullish(),
  limit: z.number().int().min(1).max(200).optional(),
  dryRun: z.boolean().optional(),
})
