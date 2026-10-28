import type { NextRequest } from "next/server"

import { newsController } from "@/server/controllers/news.controller"

// Translation runs after the response (see queueAndProcess) and needs Node.
export const runtime = "nodejs"
export const maxDuration = 60

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return newsController.getById(request, id)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return newsController.update(request, id)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return newsController.delete(request, id)
}
