import { NotFoundError } from "@/lib/errors"
import { getPaginationMeta } from "@/lib/schemas/common"
import type { CreateCommentInput } from "@/lib/schemas/comment"
import { DEFAULT_COMMENT_NAME } from "@/lib/schemas/comment"
import { blogRepository } from "@/server/repositories/blog.repository"
import { commentRepository } from "@/server/repositories/comment.repository"

// The public page renders every blog inline, so cap what a single request can
// pull back rather than loading an unbounded thread per blog.
const MAX_COMMENTS_PER_BLOG = 100

export const commentService = {
  listByBlog(blogId: string) {
    return commentRepository.findManyByBlogId(blogId, MAX_COMMENTS_PER_BLOG)
  },

  // One capped query per blog rather than a single `blogId IN (...)` with a
  // shared take. A shared take is not a per-blog cap: the newest N rows can all
  // belong to one busy thread, and every other blog on the page then renders as
  // having no comments at all. The home page lists at most 20 blogs.
  async listByBlogIds(blogIds: string[]) {
    const threads = await Promise.all(
      blogIds.map((blogId) =>
        commentRepository.findManyByBlogId(blogId, MAX_COMMENTS_PER_BLOG),
      ),
    )

    return new Map(blogIds.map((blogId, index) => [blogId, threads[index]]))
  },

  // Admin moderation listing across every blog.
  async list(params: { page: number; limit: number; search?: string }) {
    const skip = (params.page - 1) * params.limit
    const [items, total] = await Promise.all([
      commentRepository.findManyForAdmin({
        skip,
        take: params.limit,
        search: params.search,
      }),
      commentRepository.countForAdmin(params.search),
    ])

    return {
      items,
      meta: getPaginationMeta(total, params.page, params.limit),
    }
  },

  async delete(id: string) {
    const existing = await commentRepository.findById(id)

    if (!existing) {
      throw new NotFoundError("Comment not found")
    }

    return commentRepository.delete(id)
  },

  async create(blogId: string, input: CreateCommentInput) {
    const blog = await blogRepository.findById(blogId)

    if (!blog) {
      throw new NotFoundError("Blog not found")
    }

    return commentRepository.create({
      blogId,
      name: input.name?.trim() || DEFAULT_COMMENT_NAME,
      content: input.content,
    })
  },
}
