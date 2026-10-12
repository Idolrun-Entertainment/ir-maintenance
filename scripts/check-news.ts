// Self-check for news request validation: trimming, URLs, immutable fields,
// ids, and the shared pagination query.
//
// Run: pnpm tsx scripts/check-news.ts
import assert from "node:assert/strict"
import { ZodError } from "zod"

import { paginationQuerySchema } from "../src/lib/schemas/common"
import {
  createNewsSchema,
  newsIdSchema,
  updateNewsSchema,
} from "../src/lib/schemas/news"

process.env.CLOUDINARY_CLOUD_NAME = "demo"

const imageUrl = "https://res.cloudinary.com/demo/image/upload/v1/news.jpg"

const created = createNewsSchema.parse({
  title: "  Example News  ",
  imageUrl: `  ${imageUrl}  `,
})
assert.deepEqual(created, {
  title: "Example News",
  imageUrl,
})

const withoutImage = createNewsSchema.parse({ title: "Headline" })
assert.deepEqual(withoutImage, { title: "Headline" })

const clearedOnCreate = createNewsSchema.parse({
  title: "Headline",
  imageUrl: null,
})
assert.equal(clearedOnCreate.imageUrl, null)

assert.throws(
  () => createNewsSchema.parse({ title: "   " }),
  ZodError,
)
assert.throws(
  () => createNewsSchema.parse({ title: "Ok", imageUrl: "not-a-url" }),
  ZodError,
)
assert.throws(
  () =>
    createNewsSchema.parse({
      title: "Ok",
      imageUrl: "https://example.com/news-image.jpg",
    }),
  ZodError,
)
assert.throws(
  () =>
    createNewsSchema.parse({
      title: "Ok",
      imageUrl: "https://res.cloudinary.com/other/image/upload/v1/news.jpg",
    }),
  ZodError,
)
assert.equal(
  createNewsSchema.parse({
    title: "Ok",
    imageUrl: "https://placehold.co/600x400",
  }).imageUrl,
  "https://placehold.co/600x400",
)
assert.throws(
  () => createNewsSchema.parse({ title: "Ok", id: "c123456" }),
  ZodError,
)
assert.throws(
  () =>
    createNewsSchema.parse({
      title: "Ok",
      createdAt: "2020-01-01T00:00:00.000Z",
    }),
  ZodError,
)
assert.throws(
  () =>
    createNewsSchema.parse({
      title: "Ok",
      updatedAt: "2020-01-01T00:00:00.000Z",
    }),
  ZodError,
)

const titleOnly = updateNewsSchema.parse({ title: "  Updated  " })
assert.deepEqual(titleOnly, { title: "Updated" })

const clearImage = updateNewsSchema.parse({ imageUrl: null })
assert.deepEqual(clearImage, { imageUrl: null })

assert.deepEqual(updateNewsSchema.parse({}), {})

assert.throws(
  () => updateNewsSchema.parse({ id: "c123456" }),
  ZodError,
)
assert.throws(
  () => updateNewsSchema.parse({ createdAt: "2020-01-01T00:00:00.000Z" }),
  ZodError,
)
assert.throws(
  () => updateNewsSchema.parse({ updatedAt: "2020-01-01T00:00:00.000Z" }),
  ZodError,
)

assert.equal(newsIdSchema.parse("c123456"), "c123456")
assert.throws(() => newsIdSchema.parse("not-an-id"), ZodError)
assert.throws(() => newsIdSchema.parse(""), ZodError)

const page = paginationQuerySchema.parse({
  page: "2",
  limit: "5",
  search: "launch",
})
assert.deepEqual(page, { page: 2, limit: 5, search: "launch" })

const defaults = paginationQuerySchema.parse({})
assert.equal(defaults.page, 1)
assert.equal(defaults.limit, 10)
assert.equal(defaults.search, undefined)

assert.throws(
  () => paginationQuerySchema.parse({ page: "0", limit: "10" }),
  ZodError,
)
assert.throws(
  () => paginationQuerySchema.parse({ page: "1", limit: "101" }),
  ZodError,
)

console.log("news schema checks passed")
