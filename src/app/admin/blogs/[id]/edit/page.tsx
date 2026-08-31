"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
      <div className="flex flex-col gap-4">
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit blog</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update blog content. Images in the editor stay in the order you add them.
        </p>
      </div>

      <BlogForm
        initialValues={blogToFormValues(blog)}
        submitLabel="Save changes"
        contentEditorKey={blog.id}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
