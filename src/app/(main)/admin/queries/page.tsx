"use client"

import { useState } from "react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { useAdminPaginatedList } from "@/components/admin/use-admin-paginated-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { formatBlogDateShort } from "@/lib/format-date"
import type { ContactMessage } from "@/lib/types"

type Status = "all" | "unread"

export default function AdminQueriesPage() {
  const [status, setStatus] = useState<Status>("all")

  return (
    <div className="min-w-0">
      <AdminPageHeader
        title="Queries"
        description="Messages sent through the public Contact page. Open one to read it and reply by email."
      />
      <div className="mb-4 flex gap-2">
        {(["all", "unread"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={status === value ? "default" : "outline"}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {value === "all" ? "All" : "Unread"}
          </Button>
        ))}
      </div>
      {/* Keyed so a filter change starts from page 1 with a fresh list. */}
      <QueriesList key={status} status={status} />
    </div>
  )
}

function QueriesList({ status }: { status: Status }) {
  const list = useAdminPaginatedList<ContactMessage>({
    path: "/queries",
    loadError: "Failed to load queries",
    deletePath: (id) => `/queries/${id}`,
    deleteError: "Delete failed",
    deletedMessage: "Query deleted",
    status,
  })
  const [viewing, setViewing] = useState<ContactMessage | null>(null)

  async function setRead(query: ContactMessage, read: boolean) {
    try {
      await api.patch(`/queries/${query.id}`, { read })
      list.reload()
      return true
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Update failed")
      return false
    }
  }

  async function open(query: ContactMessage) {
    setViewing(query)

    if (!query.readAt) {
      await setRead(query, true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <label htmlFor="query-search" className="sr-only">
          Search queries
        </label>
        <Input
          id="query-search"
          type="search"
          placeholder="Search by email or message..."
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
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Received</TableHead>
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
              : list.items.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>
                      <Badge variant={query.readAt ? "outline" : "default"}>
                        {query.readAt ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell className={query.readAt ? "" : "font-semibold"}>
                      <a
                        href={`mailto:${query.email}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {query.email}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {query.message}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatBlogDateShort(query.createdAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void open(query)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void setRead(query, !query.readAt)}
                        >
                          {query.readAt ? "Mark unread" : "Mark read"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => list.setDeleteTarget(query)}
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
                  No queries found.
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

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
      >
        <DialogContent className="admin">
          <DialogHeader>
            <DialogTitle>Query from {viewing?.email}</DialogTitle>
            <DialogDescription>
              {viewing
                ? `Received ${formatBlogDateShort(viewing.createdAt)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="max-h-[50vh] overflow-y-auto text-sm break-words whitespace-pre-wrap">
            {viewing?.message}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewing(null)}
            >
              Close
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={
                <a
                  href={`mailto:${viewing?.email ?? ""}?subject=${encodeURIComponent("Re: your message to Idolrun")}`}
                />
              }
            >
              Reply by email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={list.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) list.setDeleteTarget(null)
        }}
        title="Delete query"
        description={
          list.deleteTarget
            ? `Delete the query from ${list.deleteTarget.email}? This cannot be undone.`
            : ""
        }
        onConfirm={list.confirmDelete}
        loading={list.deleting}
      />
    </div>
  )
}
