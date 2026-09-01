"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import { formatBlogDateShort } from "@/lib/format-date"
import type { Blog, PaginatedResponse } from "@/lib/types"

export default function AdminBlogsPage() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadBlogs() {
      try {
        const response = await api.get<ApiResponse<PaginatedResponse<Blog>>>(
          "/blogs",
          {
            params: {
              page,
              limit: 10,
              search: search || undefined,
            },
          },
        )

        if (cancelled) {
          return
        }

        setBlogs(response.data.data?.items ?? [])
        setTotalPages(response.data.data?.meta.totalPages ?? 1)
        setError(null)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : "Failed to load blogs"
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadBlogs()

    return () => {
      cancelled = true
    }
  }, [page, search, reloadNonce])

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)

    try {
      await api.delete(`/blogs/${deleteTarget.id}`)
      toast.success("Blog deleted")
      setDeleteTarget(null)
      setLoading(true)
      setReloadNonce((current) => current + 1)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blogs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, edit, and delete blog posts.
          </p>
        </div>
        <Button render={<Link href="/admin/blogs/new" />}>New blog</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search blogs..."
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
            setLoading(true)
          }}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
                    <TableCell>{blog.slug}</TableCell>
                    <TableCell>
                      {formatBlogDateShort(blog.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/blogs/${blog.id}/edit`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(blog)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!loading && blogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  No blogs found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              setLoading(true)
              setPage((current) => current - 1)
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              setLoading(true)
              setPage((current) => current + 1)
            }}
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete blog"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
