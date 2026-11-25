import type { NextRequest } from "next/server"

import { contactController } from "@/server/controllers/contact.controller"

export async function POST(request: NextRequest) {
  return contactController.create(request)
}
