"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { useAdminPaginatedList } from "@/components/admin/use-admin-paginated-list"
import {
  TranslationStatusCell,
  useTranslationStatuses,
} from "@/components/admin/translation-status"
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
import type { Blog } from "@/lib/types"

export default function AdminBlogsPage() {
  const router = useRouter()
  const list = useAdminPaginatedList<Blog>({
    path: "/blogs",
    loadError: "Failed to load blogs",
    deletePath: (id) => `/blogs/${id}`,
    deleteError: "Delete failed",
    deletedMessage: "Blog deleted",
  })

  const translations = useTranslationStatuses(
    "blog",
    list.items.map((blog) => blog.id),
  )

  return (
    <div className="min-w-0">
      <AdminPageHeader
        title="Blogs"
        description="Create, edit, and delete blog posts."
        actions={
          <Button render={<Link href="/admin/blogs/new" />}>New blog</Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="max-w-sm">
          <label htmlFor="blog-search" className="sr-only">
            Search blogs
          </label>
          <Input
            id="blog-search"
            type="search"
            placeholder="Search blogs..."
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
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Translations</TableHead>
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
                : list.items.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {blog.slug}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatBlogDateShort(blog.date)}
                      </TableCell>
                      <TableCell>
                        <TranslationStatusCell
                          kind="blog"
                          id={blog.id}
                          statuses={translations.statuses[blog.id]}
                          onChanged={translations.reload}
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
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
                            onClick={() => list.setDeleteTarget(blog)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!list.loading && list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No blogs found.
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
        open={Boolean(list.deleteTarget)}
        onOpenChange={(open) => !open && list.setDeleteTarget(null)}
        title="Delete blog"
        description={`Are you sure you want to delete "${list.deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={list.confirmDelete}
        loading={list.deleting}
      />
    </div>
  )
}
