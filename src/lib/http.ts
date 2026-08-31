import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@/generated/prisma/client"

import { AppError } from "./errors"

export type ApiResponse<T = unknown> = {
  success: boolean
  data: T | null
  message: string
}

export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200,
) {
  return NextResponse.json(
    { success: true, data, message } satisfies ApiResponse<T>,
    { status },
  )
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { success: false, data: null, message } satisfies ApiResponse<null>,
    { status },
  )
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode)
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(", ")
    return errorResponse(message, 400)
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse("A record with this value already exists", 409)
    }

    if (error.code === "P2025") {
      return errorResponse("Resource not found", 404)
    }
  }

  console.error(error)
  return errorResponse("Internal server error", 500)
}
