import { destroyImage, publicIdFromCloudinaryUrl } from "@/lib/cloudinary"
import { collectContentImages, sanitizeBlogContent } from "@/lib/blog-content"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { getPaginationMeta } from "@/lib/schemas/common"
import type {
  CreateBlogInput,
  UpdateBlogInput,
} from "@/lib/schemas/blog"
import { slugify } from "@/lib/slugify"
import { blogRepository } from "@/server/repositories/blog.repository"

function coverFromContent(content: string): {
  imageUrl: string
  imagePublicId: string
} {
  const first = collectContentImages(content)[0]

  if (!first) {
    return { imageUrl: "", imagePublicId: "" }
  }

  return {
    imageUrl: first.src,
    imagePublicId: publicIdFromCloudinaryUrl(first.src),
  }
}

function publicIdsFromBlog(content: string, coverPublicId?: string) {
  const ids = new Set<string>()

  if (coverPublicId) {
    ids.add(coverPublicId)
  }

  for (const image of collectContentImages(content)) {
    const publicId = publicIdFromCloudinaryUrl(image.src)

    if (publicId) {
      ids.add(publicId)
    }
  }

  return ids
}

async function destroyPublicIds(publicIds: Iterable<string>) {
  for (const publicId of publicIds) {
    try {
      await destroyImage(publicId)
    } catch (error) {
      console.error("Failed to delete Cloudinary asset:", error)
    }
  }
}

async function generateUniqueSlug(title: string, excludeId?: string) {
  const baseSlug = slugify(title)

  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty")
  }

  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await blogRepository.findBySlug(slug)

    if (!existing || existing.id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}

export const blogService = {
  async list(params: { page: number; limit: number; search?: string }) {
    const skip = (params.page - 1) * params.limit
    const [items, total] = await Promise.all([
      blogRepository.findMany({
        skip,
        take: params.limit,
        search: params.search,
      }),
      blogRepository.count(params.search),
    ])

    return {
      items,
      meta: getPaginationMeta(total, params.page, params.limit),
    }
  },

  async getById(id: string) {
    const blog = await blogRepository.findById(id)

    if (!blog) {
      throw new NotFoundError("Blog not found")
    }

    return blog
  },

  async create(input: CreateBlogInput) {
    const slug = input.slug
      ? slugify(input.slug)
      : await generateUniqueSlug(input.title)

    if (!slug) {
      throw new ValidationError("Slug cannot be empty")
    }

    const existing = await blogRepository.findBySlug(slug)

    if (existing) {
      throw new ConflictError("A blog with this slug already exists")
    }

    const content = sanitizeBlogContent(input.content)
    const cover = coverFromContent(content)

    return blogRepository.create({
      title: input.title,
      slug,
      date: input.date,
      content,
      imageUrl: input.imageUrl || cover.imageUrl,
      imagePublicId: input.imagePublicId || cover.imagePublicId,
      views: input.views ?? 0,
    })
  },

  // Public, unauthenticated: the only write a visitor can make to a blog.
  // A missing id surfaces as Prisma P2025, which handleError maps to 404.
  incrementViews(id: string) {
    return blogRepository.incrementViews(id)
  },

  // Same shape as incrementViews, for callers that are over the view-rate
  // window and should see the real count without adding to it.
  getViews(id: string) {
    return blogRepository.findViews(id)
  },

  async update(id: string, input: UpdateBlogInput) {
    const existing = await blogRepository.findById(id)

    if (!existing) {
      throw new NotFoundError("Blog not found")
    }

    let slug = existing.slug

    if (input.slug) {
      slug = slugify(input.slug)

      if (!slug) {
        throw new ValidationError("Slug cannot be empty")
      }
    }

    if (slug !== existing.slug) {
      const slugTaken = await blogRepository.findBySlug(slug)

      if (slugTaken && slugTaken.id !== id) {
        throw new ConflictError("A blog with this slug already exists")
      }
    }

    const nextContent = sanitizeBlogContent(input.content ?? existing.content)
    const cover = coverFromContent(nextContent)
    const nextImageUrl = input.imageUrl || cover.imageUrl
    const nextImagePublicId = input.imagePublicId || cover.imagePublicId
    const removedPublicIds = [...publicIdsFromBlog(existing.content, existing.imagePublicId)].filter(
      (publicId) => !publicIdsFromBlog(nextContent, nextImagePublicId).has(publicId),
    )

    const updated = await blogRepository.update(id, {
      ...input,
      slug,
      content: nextContent,
      imageUrl: nextImageUrl,
      imagePublicId: nextImagePublicId,
    })

    await destroyPublicIds(removedPublicIds)

    return updated
  },

  async delete(id: string) {
    const existing = await blogRepository.findById(id)

    if (!existing) {
      throw new NotFoundError("Blog not found")
    }

    const deleted = await blogRepository.delete(id)

    await destroyPublicIds(publicIdsFromBlog(existing.content, existing.imagePublicId))

    return deleted
  },
}
