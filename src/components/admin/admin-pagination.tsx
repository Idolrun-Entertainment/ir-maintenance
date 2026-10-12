import { Button } from "@/components/ui/button"

type AdminPaginationProps = {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export function AdminPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: AdminPaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm tabular-nums">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
