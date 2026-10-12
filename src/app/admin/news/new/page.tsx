"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { NewsForm } from "@/components/admin/news-form"
import type { NewsFormValues } from "@/components/admin/news-form"
import { api } from "@/lib/api"

export default function NewNewsPage() {
  const router = useRouter()

  async function handleSubmit(values: NewsFormValues) {
    try {
      await api.post("/news", {
        title: values.title,
        imageUrl: values.imageUrl,
      })

      toast.success("News created")
      router.push("/admin/news")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create news")
      throw error
    }
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
        title="New news"
        description="Add a news item. Title is required. An image is optional."
      />
      <NewsForm submitLabel="Create news" onSubmit={handleSubmit} />
    </div>
  )
}
