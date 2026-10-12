"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { PaginatedResponse } from "@/lib/types"

export default function AdminDashboardPage() {
  const [blogCount, setBlogCount] = useState<number | null>(null)
  const [newsCount, setNewsCount] = useState<number | null>(null)
  const [faqCount, setFaqCount] = useState<number | null>(null)
  const [commentCount, setCommentCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCounts() {
      try {
        const [blogsRes, newsRes, faqsRes, commentsRes] = await Promise.all([
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/blogs", {
            params: { page: 1, limit: 1 },
          }),
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/news", {
            params: { page: 1, limit: 1 },
          }),
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/faqs", {
            params: { page: 1, limit: 1 },
          }),
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/comments", {
            params: { page: 1, limit: 1 },
          }),
        ])

        setBlogCount(blogsRes.data.data?.meta.total ?? 0)
        setNewsCount(newsRes.data.data?.meta.total ?? 0)
        setFaqCount(faqsRes.data.data?.meta.total ?? 0)
        setCommentCount(commentsRes.data.data?.meta.total ?? 0)
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load dashboard"
        setError(message)
        toast.error(message)
      }
    }

    void loadCounts()
  }, [])

  const metrics = [
    { label: "Blogs", href: "/admin/blogs", count: blogCount },
    { label: "News", href: "/admin/news", count: newsCount },
    { label: "FAQs", href: "/admin/faqs", count: faqCount },
    { label: "Comments", href: "/admin/comments", count: commentCount },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Manage blog posts, news, FAQs, and comments for Idolrun."
      />

      <div className="flex flex-col gap-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-md border md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.href} className="bg-background min-w-0">
              <Link
                href={metric.href}
                className="hover:bg-muted focus-visible:bg-muted block p-4 motion-safe:transition-colors motion-safe:duration-150"
              >
                <dt className="text-muted-foreground text-sm">{metric.label}</dt>
                <dd className="mt-2 font-mono text-2xl tabular-nums tracking-tight">
                  {metric.count === null ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    metric.count
                  )}
                </dd>
              </Link>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
