"use client"

import { useCallback, useRef, useState } from "react"
import { CloudUpload, Copy, ExternalLink, File, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface UploadedFile {
  name: string
  size: number
  type: string
  url: string
}

interface UploadThingDropzoneProps {
  onUpload?: (files: File[]) => Promise<UploadedFile[]>
  onSelect?: (files: File[]) => void
  onProgress?: (progress: number) => void
  onFilesChange?: (files: UploadedFile[]) => void
  onUploadingChange?: (uploading: boolean) => void
  accept?: string
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  className?: string
  inputId?: string
  describedBy?: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function UploadThingDropzone({
  onUpload,
  onSelect,
  onProgress,
  onFilesChange,
  onUploadingChange,
  accept = "image/*",
  maxFiles = 4,
  maxSize = 4 * 1024 * 1024,
  disabled = false,
  className,
  inputId,
  describedBy,
}: UploadThingDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const errorId = inputId ? `${inputId}-status` : undefined
  const describedByIds = [describedBy, error && errorId ? errorId : null]
    .filter(Boolean)
    .join(" ")

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      const validFiles = files.slice(0, maxFiles)
      setError(null)

      for (const file of validFiles) {
        if (file.size > maxSize) {
          setError(`File too large. Max size: ${formatFileSize(maxSize)}`)
          return
        }
      }

      onSelect?.(validFiles)

      if (!onUpload) {
        return
      }

      let interval = 0

      try {
        setIsUploading(true)
        onUploadingChange?.(true)
        setProgress(0)

        interval = window.setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + 10, 90)
            onProgress?.(next)
            return next
          })
        }, 200)

        const results = await onUpload(validFiles)
        setProgress(100)
        onProgress?.(100)
        let nextFiles: UploadedFile[] = []
        setUploadedFiles((prev) => {
          nextFiles = [...prev, ...results].slice(-maxFiles)
          return nextFiles
        })
        onFilesChange?.(nextFiles)

        window.setTimeout(() => {
          setProgress(0)
        }, 1000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        window.clearInterval(interval)
        setIsUploading(false)
        onUploadingChange?.(false)
      }
    },
    [maxFiles, maxSize, onSelect, onUpload, onProgress, onFilesChange, onUploadingChange],
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!disabled && !isUploading) setIsDragOver(true)
    },
    [disabled, isUploading],
  )

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      if (disabled || isUploading) return

      handleFiles(Array.from(event.dataTransfer.files))
    },
    [disabled, isUploading, handleFiles],
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : []
      void handleFiles(files)
      event.target.value = ""
    },
    [handleFiles],
  )

  function openFileDialog() {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }

  function updateFiles(next: UploadedFile[]) {
    setUploadedFiles(next)
    onFilesChange?.(next)
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
    } catch {
      setError("Could not copy the image URL")
    }
  }

  const fileLimit =
    maxFiles === 1 ? "1 file" : `${maxFiles} files`

  return (
    <div data-slot="uploadthing-dropzone" className={cn("w-full space-y-4", className)}>
      <button
        id={inputId}
        type="button"
        onClick={openFileDialog}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || isUploading}
        aria-describedby={describedByIds || undefined}
        className={cn(
          "relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8",
          "transition-colors duration-200 motion-reduce:transition-none",
          "hover:border-primary/50 hover:bg-muted/30",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
          isDragOver && "border-primary bg-primary/5",
          (disabled || isUploading) &&
            "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent",
        )}
      >
        <CloudUpload
          aria-hidden="true"
          className={cn(
            "size-10 text-muted-foreground",
            isDragOver && "text-primary",
          )}
        />

        {isUploading ? (
          <div className="w-48 space-y-2">
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-2 rounded-full bg-primary motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{progress}% uploading...</p>
          </div>
        ) : (
          <span className="flex flex-col items-center gap-2 text-center">
            <span className="text-sm font-medium">
              {isDragOver
                ? "Drop files here"
                : "Drop files here or click to browse"}
            </span>
            <span className="text-xs text-muted-foreground">
              Max {fileLimit}, up to {formatFileSize(maxSize)} each
            </span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload image"
      />

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {copiedUrl ? (
        <p className="sr-only" aria-live="polite">
          Image URL copied
        </p>
      ) : null}

      {uploadedFiles.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploaded files</h4>
            <button
              type="button"
              onClick={() => updateFiles([])}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          <div className="grid max-h-48 gap-2 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {file.type.startsWith("image/") ? (
                    // Uploaded image URLs are not limited to next/image hosts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <File aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type || "unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void copyUrl(file.url)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    aria-label={copiedUrl === file.url ? "Image URL copied" : "Copy image URL"}
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    aria-label={`Open ${file.name}`}
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => updateFiles(uploadedFiles.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export type { UploadedFile, UploadThingDropzoneProps }
