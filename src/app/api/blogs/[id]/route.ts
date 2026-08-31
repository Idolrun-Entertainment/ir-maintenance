import type { NextRequest } from "next/server"

import { blogController } from "@/server/controllers/blog.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return blogController.getById(request, id)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return blogController.update(request, id)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return blogController.delete(request, id)
}
