// Queues and processes translations for existing content. Safe to re-run or
// resume after an interruption: finished translations are skipped by source
// hash, and source rows are only read.
//
// Run: pnpm translations:backfill [--dry-run] [--entity blog|faq|news] [--batch 20] [--delay 1000]
import { createTranslationEngine } from "../src/server/translation/engine"
import { backfillAll } from "../src/server/translation/backfill"
import { createGoogleTranslator } from "../src/server/translation/google"
import { prismaTranslationStore } from "../src/server/translation/store.prisma"
import { KINDS, type Kind } from "../src/server/translation/types"

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : (process.argv[index + 1] ?? "")
}

const dryRun = process.argv.includes("--dry-run")
const entity = flag("entity")
const batch = Number(flag("batch") ?? 20)
const delayMs = Number(flag("delay") ?? 1000)

if (entity && !KINDS.includes(entity as Kind)) {
  throw new Error(`--entity must be one of: ${KINDS.join(", ")}`)
}

if (!Number.isInteger(batch) || batch < 1 || !Number.isFinite(delayMs) || delayMs < 0) {
  throw new Error("--batch must be a positive integer and --delay a non-negative number")
}

const kinds = entity ? [entity as Kind] : [...KINDS]
const engine = createTranslationEngine({
  store: prismaTranslationStore,
  translator: createGoogleTranslator(),
})

console.log(`Scanning ${kinds.join(", ")}${dryRun ? " (dry run)" : ""}...`)

const totals = await backfillAll(
  { store: prismaTranslationStore, engine },
  { kinds, dryRun, log: (line) => console.log(`  ${line}`) },
)

console.log(
  `${totals.needing} item(s) of ${totals.scanned} need work (${totals.queuedLocales} locale translations).`,
)

if (dryRun || totals.queuedLocales === 0) {
  process.exit(0)
}

const sum = { published: 0, retried: 0, failed: 0, skipped: 0 }

for (;;) {
  let handled = 0

  for (const kind of kinds) {
    const summary = await engine.drain({ kind, limit: batch })
    handled += summary.published + summary.retried + summary.failed
    sum.published += summary.published
    sum.retried += summary.retried
    sum.failed += summary.failed
  }

  console.log(`  published ${sum.published}, retry scheduled ${sum.retried}, failed ${sum.failed}`)

  if (handled === 0) break

  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

console.log(
  sum.retried || sum.failed
    ? "Done with leftovers: rows scheduled for retry are picked up by the cron sweep; failed ones need a retry from /admin."
    : "Done.",
)
process.exit(sum.failed ? 1 : 0)
