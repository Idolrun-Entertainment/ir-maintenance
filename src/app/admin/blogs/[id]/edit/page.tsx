"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  BlogForm,
  blogToFormValues,
} from "@/components/admin/blog-form"
import type { BlogFormValues } from "@/components/admin/blog-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { Blog } from "@/lib/types"

type EditBlogPageProps = {
  params: Promise<{ id: string }>
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const router = useRouter()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blogId, setBlogId] = useState<string | null>(null)

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setBlogId(resolved.id)
    }

    void resolveParams()
  }, [params])

  useEffect(() => {
    if (!blogId) {
      return
    }

    async function loadBlog() {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get<ApiResponse<Blog>>(`/blogs/${blogId}`)
        setBlog(response.data.data)
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load blog"
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    void loadBlog()
  }, [blogId])

  async function handleSubmit(values: BlogFormValues) {
    if (!blogId) {
      return
    }

    try {
      await api.put(`/blogs/${blogId}`, {
        title: values.title,
        slug: values.slug || undefined,
        date: values.date,
        // Only send the counter when the admin actually changed it. Visitors
        // increment it while the form sits open, so resubmitting the value
        // loaded at page load would silently roll those views back.
        views:
          Number(values.views) === blog?.views
            ? undefined
            : Number(values.views),
        content: values.content,
      })

      toast.success("Blog updated")
      router.push("/admin/blogs")
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Failed to update blog",
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

  if (error || !blog) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "Blog not found"}</AlertDescription>
      </Alert>
    )
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
        title="Edit blog"
        description="Update blog content. Images in the editor stay in the order you add them."
      />

      <BlogForm
        initialValues={blogToFormValues(blog)}
        submitLabel="Save changes"
        contentEditorKey={blog.id}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
