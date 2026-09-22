"use client"

import { EyeIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"

/**
 * Counts resolved during this page load, keyed by blog id.
 *
 * Module scope rather than a ref, because it has to survive three separate
 * things at once: React StrictMode invoking the effect twice, ordinary
 * re-renders, and `UpdatesPanel` unmounting when the visitor switches to
 * another tab and back (home-tabs renders `null` for inactive panels). It
 * resets on a hard page load, which is exactly "once per visit".
 *
 * A present key means "already counted", so the map doubles as the increment
 * guard. It also carries the authoritative count forward across a remount --
 * without it the display would fall back to the ISR-cached `initialViews` and
 * appear to count backwards.
 */
const countedViews = new Map<string, number | null>()

type BlogViewsProps = {
  blogId: string
  initialViews: number
}

export function BlogViews({ blogId, initialViews }: BlogViewsProps) {
  const [views, setViews] = useState(
    () => countedViews.get(blogId) ?? initialViews,
  )

  useEffect(() => {
    if (countedViews.has(blogId)) {
      return
    }

    countedViews.set(blogId, null)

    // The home page is ISR-cached, so `initialViews` may be up to five minutes
    // stale. The response carries the authoritative count.
    api
      .post<ApiResponse<{ views: number }>>(`/blogs/${blogId}/views`)
      .then((response) => {
        const next = response.data.data?.views

        if (typeof next === "number") {
          countedViews.set(blogId, next)
          setViews(next)
        }
      })
      .catch(() => {
        // A view counter is not worth interrupting the reader over. The id
        // stays in the map on purpose: retrying risks a double increment if
        // the write actually landed and only the response was lost.
      })
  }, [blogId])

  return (
    <span className="home-panel__views">
      <EyeIcon className="home-panel__meta-icon" aria-hidden />
      <span className="sr-only">Views: </span>
      {views.toLocaleString("en-GB")}
    </span>
  )
}
