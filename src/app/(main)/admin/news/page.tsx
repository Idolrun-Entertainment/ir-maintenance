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
import { isAllowedNewsImageUrl } from "@/lib/news-image"
import type { News } from "@/lib/types"

export default function AdminNewsPage() {
  const router = useRouter()
  const list = useAdminPaginatedList<News>({
    path: "/news",
    loadError: "Failed to load news",
    deletePath: (id) => `/news/${id}`,
    deleteError: "Delete failed",
    deletedMessage: "News deleted",
  })
  const translations = useTranslationStatuses(
    "news",
    list.items.map((item) => item.id),
  )

  return (
    <div className="min-w-0">
      <AdminPageHeader
        title="News"
        description="Create, edit, and delete news items."
        actions={
          <Button render={<Link href="/admin/news/new" />}>New news</Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="max-w-sm">
          <label htmlFor="news-search" className="sr-only">
            Search news
          </label>
          <Input
            id="news-search"
            type="search"
            placeholder="Search news..."
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
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
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
                : list.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imageUrl && isAllowedNewsImageUrl(item.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-10 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatBlogDateShort(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <TranslationStatusCell
                          kind="news"
                          id={item.id}
                          statuses={translations.statuses[item.id]}
                          onChanged={translations.reload}
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/news/${item.id}/edit`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => list.setDeleteTarget(item)}
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
                    No news found.
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
        title="Delete news"
        description={`Are you sure you want to delete "${list.deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={list.confirmDelete}
        loading={list.deleting}
      />
    </div>
  )
}
