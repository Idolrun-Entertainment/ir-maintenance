"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LOCALE_META, type TargetLocale } from "@/i18n/config"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Kind, TranslationStatus } from "@/server/translation/types"

export type LocaleStatusDto = {
  locale: TargetLocale
  status: TranslationStatus
  attempts: number
  lastError: string | null
  publishedAt: string | null
}

type StatusMap = Record<string, LocaleStatusDto[]>

const STYLES: Record<TranslationStatus, { label: string; className: string }> = {
  NOT_TRANSLATED: { label: "Not translated", className: "border-border text-muted-foreground" },
  QUEUED: { label: "Queued", className: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  TRANSLATING: { label: "Translating", className: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  PUBLISHED: { label: "Published", className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  OUTDATED: { label: "Outdated", className: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  FAILED: { label: "Failed", className: "border-destructive/50 bg-destructive/10 text-destructive" },
}

const POLL_MS = 5000

/** Loads per-locale translation status for the rows on screen; polls while work is pending. */
export function useTranslationStatuses(kind: Kind, ids: string[]) {
  const [statuses, setStatuses] = useState<StatusMap>({})
  const [nonce, setNonce] = useState(0)
  const key = ids.join(",")

  useEffect(() => {
    if (!key) return

    let cancelled = false

    async function load() {
      try {
        const response = await api.get<ApiResponse<StatusMap>>("/admin/translations", {
          params: { kind, ids: key },
        })

        if (!cancelled) {
          setStatuses((current) => ({ ...current, ...(response.data.data ?? {}) }))
        }
      } catch {
        // Status is informational; the list itself must keep working.
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [kind, key, nonce])

  // Only rows currently on screen count: entries cached from other pages are
  // never refreshed, so they must not keep the poll alive.
  const pending = useMemo(
    () =>
      key.split(",").some((id) =>
        statuses[id]?.some(
          (s) => s.status === "QUEUED" || s.status === "TRANSLATING",
        ),
      ),
    [statuses, key],
  )

  useEffect(() => {
    if (!pending) return

    const timer = setInterval(() => setNonce((value) => value + 1), POLL_MS)
    return () => clearInterval(timer)
  }, [pending])

  return { statuses, reload: () => setNonce((value) => value + 1) }
}

export function TranslationStatusCell({
  kind,
  id,
  statuses,
  onChanged,
}: {
  kind: Kind
  id: string
  statuses: LocaleStatusDto[] | undefined
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  if (!statuses) {
    return <span className="text-muted-foreground text-xs">…</span>
  }

  const needsRetry = statuses.some(
    (s) => s.status === "FAILED" || s.status === "OUTDATED" || s.status === "NOT_TRANSLATED",
  )

  async function retry(force: boolean) {
    setBusy(true)

    try {
      await api.post("/admin/translations/retry", { kind, id, force })
      toast.success(force ? "Retranslation queued" : "Retry queued")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-wrap gap-1" aria-label="Translation status">
        {statuses.map((s) => {
          const style = STYLES[s.status]

          return (
            <li key={s.locale}>
              <Badge
                variant="outline"
                className={cn("font-mono text-[10px]", style.className)}
                title={[
                  `${LOCALE_META[s.locale].nativeName}: ${style.label}`,
                  s.lastError ? `Error: ${s.lastError}` : null,
                ]
                  .filter(Boolean)
                  .join("\n")}
              >
                {s.locale}
                <span className="sr-only">: {style.label}</span>
              </Badge>
            </li>
          )
        })}
      </ul>
      <div className="flex gap-1">
        {needsRetry ? (
          <Button variant="outline" size="xs" disabled={busy} onClick={() => retry(false)}>
            Retry
          </Button>
        ) : null}
        <Button variant="ghost" size="xs" disabled={busy} onClick={() => retry(true)}>
          Retranslate
        </Button>
      </div>
    </div>
  )
}
