import ImageResize from "tiptap-extension-resize-image"

/**
 * `tiptap-extension-resize-image` ships its node under the name `imageResize`.
 * Everything else in this codebase speaks `image`: content already stored in the
 * database, the public renderer in `blog-body.tsx`, and `collectContentImages`
 * in `blog-content.ts` (which derives each blog's cover and its Cloudinary
 * cleanup set). Renaming the node back keeps all of that working and means
 * existing posts need no migration.
 *
 * Resizing is width-only -- height stays `auto` -- so the aspect ratio is
 * preserved by construction.
 */
export const ResizableImage = ImageResize.extend({ name: "image" })
