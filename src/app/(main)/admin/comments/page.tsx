"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { useAdminPaginatedList } from "@/components/admin/use-admin-paginated-list"
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
import { formatBlogDateShort } from "@/lib/format-date"
import type { AdminComment } from "@/lib/types"

export default function AdminCommentsPage() {
  const list = useAdminPaginatedList<AdminComment>({
    path: "/comments",
    loadError: "Failed to load comments",
    deletePath: (id) => `/comments/${id}`,
    deleteError: "Delete failed",
    deletedMessage: "Comment deleted",
  })

  return (
    <div className="min-w-0">
      <AdminPageHeader
        title="Comments"
        description="Comments are posted by visitors without signing in. Review and delete them here."
      />

      <div className="flex flex-col gap-6">
        <div className="max-w-sm">
          <label htmlFor="comment-search" className="sr-only">
            Search comments
          </label>
          <Input
            id="comment-search"
            type="search"
            placeholder="Search by name, comment, or blog..."
            value={list.search}
            onChange={(event) => list.onSearchChange(event.target.value)}
          />
        </div>

        {list.error ? (
          <Alert variant="destructive">
            <AlertDescription>{list.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="min-w-0 overflow-hidden rounded-md border">
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
              {list.loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : list.items.map((comment) => (
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
                      <TableCell className="tabular-nums">
                        {formatBlogDateShort(comment.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => list.setDeleteTarget(comment)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!list.loading && list.items.length === 0 ? (
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

        <AdminPagination
          page={list.page}
          totalPages={list.totalPages}
          onPrevious={list.goToPrevious}
          onNext={list.goToNext}
        />
      </div>

      <DeleteConfirmDialog
        open={list.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            list.setDeleteTarget(null)
          }
        }}
        title="Delete comment"
        description={
          list.deleteTarget
            ? `Delete the comment by ${list.deleteTarget.name}? This cannot be undone.`
            : ""
        }
        onConfirm={list.confirmDelete}
        loading={list.deleting}
      />
    </div>
  )
}
