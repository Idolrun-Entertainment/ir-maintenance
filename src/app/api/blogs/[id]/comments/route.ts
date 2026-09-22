import type { NextRequest } from "next/server"

import { commentController } from "@/server/controllers/comment.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return commentController.list(request, id)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return commentController.create(request, id)
}
