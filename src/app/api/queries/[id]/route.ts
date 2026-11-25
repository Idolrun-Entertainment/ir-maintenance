import type { NextRequest } from "next/server"

import { contactController } from "@/server/controllers/contact.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return contactController.setRead(request, id)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return contactController.delete(request, id)
}
