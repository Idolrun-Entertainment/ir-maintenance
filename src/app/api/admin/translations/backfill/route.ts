import type { NextRequest } from "next/server"

import { translationController } from "@/server/controllers/translation.controller"

export const runtime = "nodejs"
export const maxDuration = 60

export function POST(request: NextRequest) {
  return translationController.backfill(request)
}
