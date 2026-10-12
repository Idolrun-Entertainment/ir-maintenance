"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { PaginatedResponse } from "@/lib/types"

type UseAdminPaginatedListOptions = {
  path: string
  loadError: string
  deletePath: (id: string) => string
  deleteError: string
  deletedMessage: string
}

export function useAdminPaginatedList<T extends { id: string }>({
  path,
  loadError,
  deletePath,
  deleteError,
  deletedMessage,
}: UseAdminPaginatedListOptions) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await api.get<ApiResponse<PaginatedResponse<T>>>(path, {
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

        setItems(response.data.data?.items ?? [])
        setTotalPages(nextTotalPages)
        setError(null)

        // Deleting the last row on the last page shrinks the set; without this
        // the table renders empty under "Page 3 of 2".
        if (page > nextTotalPages) {
          setPage(nextTotalPages)
        }
      } catch (loadFailure) {
        if (cancelled) {
          return
        }

        const message = loadFailure instanceof Error ? loadFailure.message : loadError
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [page, search, reloadNonce, path, loadError])

  function onSearchChange(value: string) {
    setPage(1)
    setSearch(value)
    setLoading(true)
  }

  function goToPrevious() {
    setLoading(true)
    setPage((current) => current - 1)
  }

  function goToNext() {
    setLoading(true)
    setPage((current) => current + 1)
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)

    try {
      await api.delete(deletePath(deleteTarget.id))
      toast.success(deletedMessage)
      setDeleteTarget(null)
      setLoading(true)
      setReloadNonce((current) => current + 1)
    } catch (deleteFailure) {
      toast.error(deleteFailure instanceof Error ? deleteFailure.message : deleteError)
    } finally {
      setDeleting(false)
    }
  }

  return {
    items,
    loading,
    error,
    search,
    page,
    totalPages,
    deleteTarget,
    setDeleteTarget,
    deleting,
    onSearchChange,
    goToPrevious,
    goToNext,
    confirmDelete,
  }
}
