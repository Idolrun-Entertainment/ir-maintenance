"use client"

import { useEffect, useState } from "react"
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
import type { AdminComment, PaginatedResponse } from "@/lib/types"

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadComments() {
      try {
        const response = await api.get<
          ApiResponse<PaginatedResponse<AdminComment>>
        >("/comments", {
          params: {
            page,
            limit: 10,
            search: search || undefined,
          },
        })

        if (cancelled) {
          return
        }

        const nextTotalPages = response.data.data?.meta.totalPages ?? 1

        setComments(response.data.data?.items ?? [])
        setTotalPages(nextTotalPages)
        setError(null)

        // Deleting the last row on the last page shrinks the set; without this
        // the table renders empty under "Page 3 of 2".
        if (page > nextTotalPages) {
          setPage(nextTotalPages)
        }
      } catch (loadError) {
        if (cancelled) {
          return
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load comments"
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadComments()

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
      await api.delete(`/comments/${deleteTarget.id}`)
      toast.success("Comment deleted")
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
      <div>
        <h1 className="text-2xl font-semibold">Comments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Comments are posted by visitors without signing in. Review and delete
          them here.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search by name, comment, or blog..."
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
              <TableHead>Name</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Blog</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="font-medium">
                      {comment.name}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {comment.content}
                      </span>
                    </TableCell>
                    <TableCell>{comment.blog.title}</TableCell>
                    <TableCell>
                      {formatBlogDateShort(comment.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(comment)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!loading && comments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  No comments found.
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
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Delete comment"
        description={
          deleteTarget
            ? `Delete the comment by ${deleteTarget.name}? This cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
