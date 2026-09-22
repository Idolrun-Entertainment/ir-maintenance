"use client"

import { useEffect, useRef } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { toast } from "sonner"

import { ResizableImage } from "@/components/tiptap-node/image-node/image-resize-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { LinkPopover } from "@/components/tiptap-ui/link-popover"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { parseBlogContent, serializeBlogContent } from "@/lib/blog-content"
import { uploadBlogImage } from "@/lib/upload-blog-image"
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { cn } from "@/lib/utils"

import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss"
import "./blog-content-editor.scss"

type BlogContentEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function imageFilesFromList(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith("image/"))
}

async function insertCloudinaryImages(
  editor: Editor,
  files: File[],
  position?: number,
) {
  const imageFiles = imageFilesFromList(files)

  if (imageFiles.length === 0) {
    return
  }

  try {
    const uploaded = []

    for (const file of imageFiles) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `${file.name} exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        )
      }

      const result = await uploadBlogImage(file)
      uploaded.push({
        type: "image" as const,
        attrs: {
          src: result.imageUrl,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          title: file.name.replace(/\.[^/.]+$/, ""),
        },
      })
    }

    const chain = editor.chain().focus()

    if (typeof position === "number") {
      chain.insertContentAt(position, uploaded)
    } else {
      chain.insertContent(uploaded)
    }

    chain.run()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Image upload failed")
  }
}

function BlogContentEditorToolbar() {
  return (
    <div className="blog-content-editor__toolbar">
      <UndoRedoButton action="undo" hideWhenUnavailable />
      <UndoRedoButton action="redo" hideWhenUnavailable />
      <HeadingDropdownMenu levels={[1, 2, 3]} />
      <MarkButton type="bold" hideWhenUnavailable />
      <MarkButton type="italic" hideWhenUnavailable />
      <ListDropdownMenu types={["bulletList", "orderedList"]} />
      <LinkPopover autoOpenOnLinkActive hideWhenUnavailable />
      <ImageUploadButton hideWhenUnavailable />
    </div>
  )
}

export function BlogContentEditor({
  value,
  onChange,
  disabled = false,
}: BlogContentEditorProps) {
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          enableClickSelection: true,
          protocols: ["http", "https", "mailto"],
        },
      }),
      // Registers node name `image` (see image-resize-extension), so this
      // replaces the plain Image extension rather than adding to it.
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        minWidth: 80,
        maxWidth: 1200,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 10,
        upload: async (file, onProgress) => {
          onProgress?.({ progress: 25 })
          const result = await uploadBlogImage(file)
          onProgress?.({ progress: 100 })
          return result.imageUrl
        },
        onError: (error) => {
          toast.error(error.message || "Image upload failed")
        },
      }),
    ],
    content: parseBlogContent(value),
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(serializeBlogContent(currentEditor.getJSON()))
    },
    editorProps: {
      handlePaste(_view, event) {
        const current = editorRef.current
        const files = imageFilesFromList(event.clipboardData?.files)

        if (!current || files.length === 0) {
          return false
        }

        event.preventDefault()
        void insertCloudinaryImages(current, files)
        return true
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) {
          return false
        }

        const current = editorRef.current
        const files = imageFilesFromList(event.dataTransfer?.files)

        if (!current || files.length === 0) {
          return false
        }

        event.preventDefault()
        const dropPosition = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos
        void insertCloudinaryImages(current, files, dropPosition)
        return true
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setEditable(!disabled)
  }, [disabled, editor])

  return (
    <EditorContext.Provider value={{ editor }}>
      <div
        className={cn(
          "blog-content-editor rounded-2xl border border-border bg-background",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <BlogContentEditorToolbar />
        <EditorContent
          editor={editor}
          className="blog-content-editor__content"
        />
      </div>
    </EditorContext.Provider>
  )
}
