"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { BlogForm } from "@/components/admin/blog-form"
import type { BlogFormValues } from "@/components/admin/blog-form"
import { api } from "@/lib/api"

export default function NewBlogPage() {
  const router = useRouter()

  async function handleSubmit(values: BlogFormValues) {
    try {
      await api.post("/blogs", {
        title: values.title,
        slug: values.slug || undefined,
        date: values.date,
        views: Number(values.views),
        content: values.content,
      })

      toast.success("Blog created")
      router.push("/admin/blogs")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create blog")
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New blog</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new blog post. Add images in the editor to keep them in order with the text.
        </p>
      </div>

      <BlogForm submitLabel="Create blog" onSubmit={handleSubmit} />
    </div>
  )
}
