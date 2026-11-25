import type { NextRequest } from "next/server"

import { contactController } from "@/server/controllers/contact.controller"

export async function GET(request: NextRequest) {
  return contactController.list(request)
}
