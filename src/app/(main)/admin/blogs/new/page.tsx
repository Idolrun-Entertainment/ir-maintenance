"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
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
    <div className="max-w-3xl">
      <Link
        href="/admin/blogs"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex text-sm motion-safe:transition-colors motion-safe:duration-150"
      >
        Back to blogs
      </Link>
      <AdminPageHeader
        title="New blog"
        description="Create a new blog post. Add images in the editor to keep them in order with the text."
      />
      <BlogForm submitLabel="Create blog" onSubmit={handleSubmit} />
    </div>
  )
}
