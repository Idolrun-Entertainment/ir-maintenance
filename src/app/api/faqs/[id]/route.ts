import type { NextRequest } from "next/server"

import { faqController } from "@/server/controllers/faq.controller"

// Translation runs after the response (see queueAndProcess) and needs Node.
export const runtime = "nodejs"
export const maxDuration = 60

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return faqController.getById(request, id)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return faqController.update(request, id)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return faqController.delete(request, id)
}
