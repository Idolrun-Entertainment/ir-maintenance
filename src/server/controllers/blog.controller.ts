import { revalidatePath } from "next/cache"
import type { NextRequest } from "next/server"

import { handleError, successResponse } from "@/lib/http"
import { rateLimit } from "@/lib/rate-limit"
import {
  createBlogSchema,
  updateBlogSchema,
} from "@/lib/schemas/blog"
import { paginationQuerySchema } from "@/lib/schemas/common"
import { requireAdmin } from "@/lib/require-admin"
import { blogService } from "@/server/services/blog.service"

// How long one browser's view of a given blog stays counted. Long enough that
// reloading does not inflate the number, short enough that a genuine return
// visit still registers.
const VIEW_COOKIE_MAX_AGE_SECONDS = 30 * 60
const VIEW_COOKIE_PREFIX = "bv_"

// Abuse ceiling only -- NOT the dedup rule. The home page fires one of these
// per listed blog (at most 20), so a reader loading it several times a minute
// stays well under this, while a script ignoring Set-Cookie is still capped.
const VIEW_ABUSE_LIMIT = { limit: 120, windowMs: 60_000 }

export const blogController = {
  async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const query = paginationQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })

      const data = await blogService.list(query)
      return successResponse(data, "Blogs retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async getById(_request: NextRequest, id: string) {
    try {
      const data = await blogService.getById(id)
      return successResponse(data, "Blog retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  // Public and unauthenticated by design. Deliberately does NOT call
  // revalidatePath("/") -- that would regenerate the home page on every visit.
  async incrementViews(request: NextRequest, id: string) {
    try {
      // Dedup is per browser, not per IP: readers sharing one office NAT are
      // distinct people and each should count. The cookie is the dedup key;
      // the rate limit is only an abuse ceiling, because a script can simply
      // drop Set-Cookie. Either way the caller still gets the real count back,
      // it just does not always add to it.
      const cookieName = `${VIEW_COOKIE_PREFIX}${id}`
      const counted =
        !request.cookies.has(cookieName) &&
        rateLimit(request, "views", VIEW_ABUSE_LIMIT)

      const data = counted
        ? await blogService.incrementViews(id)
        : await blogService.getViews(id)

      const response = successResponse(data, "Blog views updated successfully")

      if (counted) {
        response.cookies.set(cookieName, "1", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
        })
      }

      return response
    } catch (error) {
      return handleError(error)
    }
  },

  async create(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const body = createBlogSchema.parse(await request.json())
      const data = await blogService.create(body)
      revalidatePath("/")
      return successResponse(data, "Blog created successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const body = updateBlogSchema.parse(await request.json())
      const data = await blogService.update(id, body)
      revalidatePath("/")
      return successResponse(data, "Blog updated successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await blogService.delete(id)
      revalidatePath("/")
      return successResponse(data, "Blog deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },
}
