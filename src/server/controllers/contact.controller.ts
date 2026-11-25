import type { NextRequest } from "next/server"

import { TooManyRequestsError } from "@/lib/errors"
import { handleError, successResponse } from "@/lib/http"
import { rateLimit } from "@/lib/rate-limit"
import { readCappedJson } from "@/lib/read-capped-json"
import { requireAdmin } from "@/lib/require-admin"
import { paginationQuerySchema } from "@/lib/schemas/common"
import {
  contactSchema,
  contactStatusSchema,
  setContactReadSchema,
} from "@/lib/schemas/contact"
import { contactService } from "@/server/services/contact.service"

// Unauthenticated write: size-check the body before it is read into memory.
const MAX_BODY_BYTES = 8_192

export const contactController = {
  async create(request: NextRequest) {
    try {
      const json = await readCappedJson(request, MAX_BODY_BYTES, "Message")

      if (!rateLimit(request, "contact", { limit: 3, windowMs: 10 * 60_000 })) {
        throw new TooManyRequestsError(
          "Too many messages. Please try again in a few minutes.",
        )
      }

      const body = contactSchema.parse(json)

      // Honeypot filled: pretend success so bots learn nothing, store nothing.
      if (!body.website) {
        await contactService.create(body)
      }

      return successResponse(null, "Message sent", 201)
    } catch (error) {
      return handleError(error)
    }
  },

  async list(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })

      const { searchParams } = new URL(request.url)
      const query = paginationQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })
      const status = contactStatusSchema.parse(
        searchParams.get("status") ?? undefined,
      )

      const data = await contactService.list({
        ...query,
        unreadOnly: status === "unread",
      })
      return successResponse(data, "Queries retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async setRead(request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const body = setContactReadSchema.parse(await request.json().catch(() => null))
      const data = await contactService.setRead(id, body.read)
      return successResponse(data, "Query updated successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await contactService.delete(id)
      return successResponse(data, "Query deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },
}
