"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { PaginatedResponse } from "@/lib/types"

export default function AdminDashboardPage() {
  const [blogCount, setBlogCount] = useState<number | null>(null)
  const [faqCount, setFaqCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCounts() {
      try {
        const [blogsRes, faqsRes] = await Promise.all([
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/blogs", {
            params: { page: 1, limit: 1 },
          }),
          api.get<ApiResponse<PaginatedResponse<unknown>>>("/faqs", {
            params: { page: 1, limit: 1 },
          }),
        ])

        setBlogCount(blogsRes.data.data?.meta.total ?? 0)
        setFaqCount(faqsRes.data.data?.meta.total ?? 0)
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load dashboard"
        setError(message)
        toast.error(message)
      }
    }

    void loadCounts()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage blog posts and FAQs for Idolrun.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blogs</CardTitle>
            <CardDescription>Published and draft blog posts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {blogCount === null ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-semibold">{blogCount}</p>
            )}
            <Button render={<Link href="/admin/blogs" />}>Manage blogs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
            <CardDescription>Frequently asked questions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {faqCount === null ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-semibold">{faqCount}</p>
            )}
            <Button render={<Link href="/admin/faqs" />}>Manage FAQs</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
