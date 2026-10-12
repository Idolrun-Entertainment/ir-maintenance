"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  NewsForm,
  newsToFormValues,
} from "@/components/admin/news-form"
import type { NewsFormValues } from "@/components/admin/news-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { News } from "@/lib/types"

type EditNewsPageProps = {
  params: Promise<{ id: string }>
}

export default function EditNewsPage({ params }: EditNewsPageProps) {
  const router = useRouter()
  const [item, setItem] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newsId, setNewsId] = useState<string | null>(null)

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setNewsId(resolved.id)
    }

    void resolveParams()
  }, [params])

  useEffect(() => {
    if (!newsId) {
      return
    }

    async function loadNews() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get<ApiResponse<News>>(`/news/${newsId}`)
        setItem(response.data.data)
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load news"
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    void loadNews()
  }, [newsId])

  async function handleSubmit(values: NewsFormValues) {
    if (!newsId) {
      return
    }

    try {
      await api.patch(`/news/${newsId}`, {
        title: values.title,
        imageUrl: values.imageUrl,
      })

      toast.success("News updated")
      router.push("/admin/news")
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update news",
      )
      throw submitError
    }
  }

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "News not found"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/news"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex text-sm motion-safe:transition-colors motion-safe:duration-150"
      >
        Back to news
      </Link>
      <AdminPageHeader
        title="Edit news"
        description="Update the title or image. Clearing the image removes it from the card."
      />

      <NewsForm
        initialValues={newsToFormValues(item)}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
