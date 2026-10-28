# Translations (en → ja, id, ko, zh-CN)

English is the source. Blog posts, FAQs and news titles are machine-translated
with Google Cloud Translation into Japanese, Indonesian, Korean and Simplified
Chinese, stored in Postgres, and served under locale-prefixed URLs.

## How it works

| Piece | Where |
|---|---|
| Languages, native names, Google codes, `localePath()` | `src/i18n/config.ts` |
| UI strings (header, footer, labels) | `src/i18n/dictionaries/*.ts` |
| Data model | `BlogTranslation`, `FaqTranslation`, `NewsTranslation` in `prisma/schema.prisma` |
| Engine (queue, retries, idempotency) | `src/server/translation/engine.ts` |
| Format-aware splitting of the Tiptap JSON | `src/server/translation/tiptap.ts` |
| Google client + keyless auth | `src/server/translation/google.ts` |
| Public reads (published-only) | `src/server/translation/read.ts` |
| Backfill | `src/server/translation/backfill.ts`, `scripts/backfill-translations.ts` |
| Admin API + cron | `src/server/controllers/translation.controller.ts` |

**URLs.** English keeps its existing URLs (`/`, `/updates`, `/updates/<slug>`).
Other languages are prefixed: `/ja/updates/<slug>`, `/zh-CN/…`. The slug is the
English slug in every language (translated titles are not slugified; this keeps
URLs stable and makes the language switcher deterministic). Layouts: `(main)`
is the English root layout (`<html lang="en">`), `[locale]` is the root layout
for translated pages (`<html lang={locale}>`).

**Data model.** One row per (post, locale), unique on `(entityId, locale)`,
`ON DELETE CASCADE` from the source. The row holds the translated text plus job
state: `jobState` (`IDLE|QUEUED|RUNNING|FAILED`), `translatedHash` (hash of the
English the text was made from), `publishedAt`, `attempts`, `nextAttemptAt`,
`lockedUntil`, `lastError`. English tables are untouched.

**Source hash.** `sha256(pipeline version + translatable fields)`. A translation
is *current* when `translatedHash` equals the hash of today's English; otherwise
it is *outdated*. Bump `TRANSLATION_PIPELINE_VERSION` in
`src/server/translation/types.ts` to force everything to be redone.

**Status shown in admin** (per language): Not translated, Queued, Translating,
Published, Outdated, Failed. A transient error shows as Queued with the error in
the tooltip until it retries; only permanent errors / exhausted retries are Failed.

**Public visibility.** A translation is served only when `publishedAt` is set
and the translated text is non-empty. Queued/failed/never-completed rows are
never exposed. An *outdated* translation stays live until its replacement is
written (one atomic row update). If the requested language has no published
translation, `/<locale>/updates/<slug>` shows the English text with a notice,
`noindex`, and a canonical link to the English page. An unknown post is a 404.

## Triggering

1. Admin saves a blog/FAQ/news item (existing flow, unchanged). The controller
   queues four rows (a few indexed writes; failures here are logged and never
   fail the save), then uses `after()` to process them once the response is sent.
2. **Vercel Cron** (`vercel.json`, every 5 min → `GET /api/cron/translations`,
   `Authorization: Bearer $CRON_SECRET`) sweeps anything due: scheduled retries,
   rows whose worker died (expired lease), and anything the inline pass missed.
   Vercel Hobby only allows daily crons; use Pro for the 5-minute schedule.
3. Rows are claimed with an atomic conditional update plus a 5-minute lease, so
   duplicate invocations never translate the same row twice. Editing a post while
   it is being translated flags the row so it is re-queued when it finishes.
4. Errors: 3 in-call retries with exponential backoff + full jitter for
   transient errors (429, 5xx, UNAVAILABLE, DEADLINE_EXCEEDED, network), then a
   scheduled retry (up to 5 attempts, backoff up to 1 h). Permanent errors
   (invalid argument, permission denied, oversize source > 200k chars, missing
   config) fail immediately and are not retried automatically. Each language is
   independent: one failing never affects the others or the English post.

Visitors never trigger the Translation API; pages read from the database.

## What is translated and preserved

Blog title, body text (paragraphs, headings, list items), image alt/title, SEO
title (= translated title) and SEO description (first translated paragraph).
Body text is sent as HTML fragments where bold/italic/link/code runs are wrapped
in `<span data-m="n">` placeholders; hrefs, image sources, code blocks and all
document structure stay on the server and are re-attached afterwards. If the API
returns an unexpected tag structure for a block, that block falls back to plain
translated text (no marks) rather than risking corrupt content. FAQ answers are
translated line by line. Output links go through the existing `sanitizeBlogHref`.

## Environment variables (server-only)

See `.env.example`.

| Variable | Purpose |
|---|---|
| `GCP_PROJECT_ID` | Project with the Translation API enabled (required) |
| `GCP_TRANSLATE_LOCATION` | Defaults to `global` |
| `GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL`, `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Production keyless auth (below) |
| `CRON_SECRET` | Shared secret for the cron route (route refuses all calls if unset) |
| `SITE_URL` | Public origin for canonical / hreflang / sitemap URLs |

No credential ever reaches the browser, and no service-account JSON key is used
(the org policy `iam.disableServiceAccountKeyCreation` is respected).

## Google Cloud setup (keyless)

Production on Vercel uses **Workload Identity Federation** with Vercel's OIDC
token; locally you use Application Default Credentials. Replace the UPPERCASE
placeholders. Check Vercel's OIDC docs for the exact issuer/audience of your
team (team-scoped issuer shown).

```bash
gcloud config set project PROJECT_ID
gcloud services enable translate.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

# Identity the app impersonates
gcloud iam service-accounts create translate-runner
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:translate-runner@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtranslate.user"

# Trust Vercel's OIDC tokens (restrict to this Vercel project)
gcloud iam workload-identity-pools create vercel --location=global
gcloud iam workload-identity-pools providers create-oidc vercel \
  --location=global --workload-identity-pool=vercel \
  --issuer-uri="https://oidc.vercel.com/TEAM_SLUG" \
  --allowed-audiences="https://vercel.com/TEAM_SLUG" \
  --attribute-mapping="google.subject=assertion.sub" \
  --attribute-condition='assertion.sub.startsWith("owner:TEAM_SLUG:project:PROJECT_NAME:")'

# Let that pool impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  translate-runner@PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vercel/*"
```

Then set in Vercel (Production + Preview as needed): `GCP_PROJECT_ID`,
`GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL=translate-runner@PROJECT_ID.iam.gserviceaccount.com`,
`GCP_WORKLOAD_IDENTITY_POOL_ID=vercel`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel`,
`CRON_SECRET`, `SITE_URL`. Ensure OIDC token issuance is enabled for the project
(Vercel → Settings → Security).

**Local development**

```bash
gcloud auth application-default login
# .env: GCP_PROJECT_ID=PROJECT_ID  (leave GCP_WORKLOAD_IDENTITY_POOL_ID empty)
```

Your user needs `roles/cloudtranslate.user` on the project.

## Database migration

The migration `prisma/migrations/20261027120000_add_translations` only adds an
enum and three tables (backward compatible; no existing data is touched).

```bash
pnpm db:up        # local Postgres
pnpm db:migrate   # applies it locally (prisma migrate dev)
```

In production, `pnpm build` runs `prisma migrate deploy` (see
`scripts/migrate-deploy.mjs`), so deploying applies it.

## Backfilling existing content

```bash
pnpm translations:backfill --dry-run            # counts only, writes nothing
pnpm translations:backfill                      # queue + translate everything missing/outdated
pnpm translations:backfill --entity blog --batch 10 --delay 2000
```

It pages through the source tables by id (50 per page), queues only locales
whose translation is missing, outdated or failed, then drains the queue in
batches with a delay between batches. Re-running (or resuming after Ctrl-C)
repeats no finished work, because finished rows match the source hash. Source
rows are never modified. The CLI cannot revalidate the live site's cache; pages
refresh within 5 minutes (ISR), or sooner via a new publish.

Alternatively, one page at a time through the admin API (also admin-only):

```bash
# from a signed-in admin browser session
fetch("/api/admin/translations/backfill", {method: "POST", headers: {"Content-Type": "application/json"},
  body: JSON.stringify({kind: "blog", dryRun: true})}).then(r => r.json())
# pass the returned nextCursor as `cursor` for the next page; the cron sweep does the translating
```

## Monitoring and retrying

* **Admin → Blogs / FAQs / News** has a *Translations* column: one badge per
  language, with last error in the tooltip, a **Retry** button (failed / outdated
  / missing) and **Retranslate** (forces a redo even if current).
* `GET /api/admin/translations?kind=blog&ids=a,b` returns the same data
  (admin-only; includes error text). `POST /api/admin/translations/retry`
  `{ "kind": "blog", "id": "...", "locales": ["ko"], "force": false }`.
* Logs: one JSON line per event (`scope: "translation"`, `event: published |
  retry_scheduled | failed | hook_failed`) with kind, entity id, locale, attempt.

## Adding another language

1. Add the code to `LOCALES` and `LOCALE_META` in `src/i18n/config.ts`
   (native name, Google code, BCP 47 tag).
2. Add `src/i18n/dictionaries/<code>.ts` (typed against `en`) and register it in
   `src/i18n/dictionary.ts`.
3. Deploy, then `pnpm translations:backfill`. Routes, switcher, sitemap, hreflang
   and the admin status column are all driven by `TARGET_LOCALES`.

## Cost and quota notes

* Billing is per input character (markup inside the HTML fragments is counted).
  Roughly: characters × languages (4) per post, once. The first 500k characters
  per month are free on the Translation API (check current pricing).
* The source hash prevents repeat charges: unchanged content is never resent,
  deploys and page views never call the API, and a duplicate job is rejected by
  the atomic claim. Editing a post retranslates that post only.
* Requests are capped at 100 strings / 20k characters; sources over 200k
  characters are rejected. Rate-limit/quota errors (429) back off and retry.
  Request a quota increase in the Cloud console for very large backfills, or
  lower `--batch` / raise `--delay`.
