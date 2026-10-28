import type { NextRequest } from "next/server"

import { translationController } from "@/server/controllers/translation.controller"

export const runtime = "nodejs"

export function GET(request: NextRequest) {
  return translationController.status(request)
}
