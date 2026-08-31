"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import type { Faq, PaginatedResponse } from "@/lib/types"

type FaqDraft = {
  question: string
  answer: string
  order: number
}

const emptyDraft: FaqDraft = {
  question: "",
  answer: "",
  order: 0,
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | "new" | null>(null)
  const [draft, setDraft] = useState<FaqDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadFaqs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Faq>>>(
        "/faqs",
        {
          params: {
            page: 1,
            limit: 100,
            search: search || undefined,
          },
        },
      )

      setFaqs(response.data.data?.items ?? [])
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load FAQs"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void loadFaqs()
  }, [loadFaqs])

  function startCreate() {
    setEditingId("new")
    setDraft(emptyDraft)
  }

  function startEdit(faq: Faq) {
    setEditingId(faq.id)
    setDraft({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  async function handleSave() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast.error("Question and answer are required")
      return
    }

    setSaving(true)

    try {
      if (editingId === "new") {
        await api.post("/faqs", draft)
        toast.success("FAQ created")
      } else if (editingId) {
        await api.put(`/faqs/${editingId}`, draft)
        toast.success("FAQ updated")
      }

      cancelEdit()
      await loadFaqs()
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)

    try {
      await api.delete(`/faqs/${deleteTarget.id}`)
      toast.success("FAQ deleted")
      setDeleteTarget(null)
      await loadFaqs()
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
          <h1 className="text-2xl font-semibold">FAQs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage frequently asked questions.
          </p>
        </div>
        <Button onClick={startCreate}>Add FAQ</Button>
      </div>

      <Input
        placeholder="Search FAQs..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {editingId ? (
        <div className="rounded-xl border p-4">
          <h2 className="mb-4 text-lg font-medium">
            {editingId === "new" ? "New FAQ" : "Edit FAQ"}
          </h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="faq-question">Question</FieldLabel>
              <Input
                id="faq-question"
                value={draft.question}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="faq-answer">Answer</FieldLabel>
              <Textarea
                id="faq-answer"
                value={draft.answer}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    answer: event.target.value,
                  }))
                }
                rows={4}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="faq-order">Order</FieldLabel>
              <Input
                id="faq-order"
                type="number"
                min={0}
                value={draft.order}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    order: Number(event.target.value),
                  }))
                }
              />
            </Field>
          </FieldGroup>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
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
              : faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>{faq.order}</TableCell>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="max-w-md truncate">{faq.answer}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(faq)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(faq)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!loading && faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  No FAQs found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete FAQ"
        description={`Are you sure you want to delete "${deleteTarget?.question}"?`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
