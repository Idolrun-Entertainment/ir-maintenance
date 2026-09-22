// Self-check for the one piece of non-trivial pure logic added with image
// resizing: reading an admin-chosen size back out of the raw CSS that
// `tiptap-extension-resize-image` persists in the `containerStyle` attribute.
//
// Run: pnpm tsx scripts/check-blog-content.ts
import assert from "node:assert/strict"

import { parseImageLayout } from "../src/lib/blog-content"

// Shapes the extension actually writes (StyleManager.getContainerStyle plus the
// margin shorthand its alignment controls set).
assert.deepEqual(
  parseImageLayout({ containerStyle: "width: 420px; height: auto; cursor: pointer;" }),
  { width: 420, align: "left" },
)
assert.deepEqual(
  parseImageLayout({ containerStyle: "width: 420px; height: auto; margin: 0px auto;" }),
  { width: 420, align: "center" },
)
assert.deepEqual(
  parseImageLayout({ containerStyle: "width: 300px; margin: 0px 0px 0px auto;" }),
  { width: 300, align: "right" },
)
assert.deepEqual(
  parseImageLayout({ containerStyle: "width: 300px; margin: 0px auto 0px 0px;" }),
  { width: 300, align: "left" },
)

// Fractional widths come out of a drag mid-pixel.
assert.equal(parseImageLayout({ containerStyle: "width: 419.6px;" }).width, 420)

// Images saved before resizing existed: no containerStyle at all.
assert.deepEqual(parseImageLayout({ src: "https://x/y.png" }), {
  width: null,
  align: "left",
})
assert.deepEqual(parseImageLayout(undefined), { width: null, align: "left" })
assert.deepEqual(parseImageLayout(null), { width: null, align: "left" })
assert.deepEqual(parseImageLayout({ containerStyle: null }), {
  width: null,
  align: "left",
})

// Percentages and other units are not a pixel width, so they fall back.
assert.equal(parseImageLayout({ containerStyle: "width: 100%;" }).width, null)
assert.equal(parseImageLayout({ containerStyle: "width: 30em;" }).width, null)
assert.equal(parseImageLayout({ containerStyle: "garbage" }).width, null)

// `max-width` / `min-width` must not be mistaken for the width itself.
assert.equal(parseImageLayout({ containerStyle: "max-width: 640px;" }).width, null)
assert.equal(
  parseImageLayout({ containerStyle: "min-width: 80px; width: 200px;" }).width,
  200,
)

// A hand-edited document cannot force an absurd size onto the public page.
assert.equal(parseImageLayout({ containerStyle: "width: 999999px;" }).width, 2000)
assert.equal(parseImageLayout({ containerStyle: "width: 1px;" }).width, 40)
assert.equal(parseImageLayout({ containerStyle: "width: 0px;" }).width, null)

console.log("blog-content: all checks passed")
