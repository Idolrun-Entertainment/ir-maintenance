import { revalidatePath } from "next/cache"
import type { NextRequest } from "next/server"

import { TooManyRequestsError, ValidationError } from "@/lib/errors"
import { handleError, successResponse } from "@/lib/http"
import { createCommentSchema } from "@/lib/schemas/comment"
import { rateLimit } from "@/lib/rate-limit"
import { paginationQuerySchema } from "@/lib/schemas/common"
import { requireAdmin } from "@/lib/require-admin"
import { commentService } from "@/server/services/comment.service"

// Comments are the only unauthenticated write in the app, so the body is
// size-checked before it is read into memory.
const MAX_BODY_BYTES = 16_384

export const commentController = {
  // Admin-only moderation listing. The public per-blog list below stays open;
  // this one spans every blog and is admin tooling, so it is gated.
  async listAll(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })

      const { searchParams } = new URL(request.url)
      const query = paginationQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })

      const data = await commentService.list(query)
      return successResponse(data, "Comments retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await commentService.delete(id)

      // Drop the deleted comment from the ISR-cached home page immediately.
      revalidatePath("/")

      return successResponse(data, "Comment deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async list(_request: NextRequest, blogId: string) {
    try {
      const data = await commentService.listByBlog(blogId)
      return successResponse(data, "Comments retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async create(request: NextRequest, blogId: string) {
    try {
      const declaredLength = Number(request.headers.get("content-length") ?? 0)

      if (declaredLength > MAX_BODY_BYTES) {
        throw new ValidationError("Comment is too large")
      }

      // Unauthenticated, and every accepted comment invalidates the ISR cache
      // for "/". Without a cap a POST loop forces the home page to regenerate
      // continuously and fills it with spam.
      if (!rateLimit(request, "comment", { limit: 5, windowMs: 60_000 })) {
        throw new TooManyRequestsError(
          "Too many comments. Try again in a minute.",
        )
      }

      const body = createCommentSchema.parse(await request.json())
      const data = await commentService.create(blogId, body)

      // The home page is ISR with revalidate = 300; without this a new comment
      // would be invisible to everyone else for up to five minutes.
      revalidatePath("/")

      return successResponse(data, "Comment posted successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },
}
