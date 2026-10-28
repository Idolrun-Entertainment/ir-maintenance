import type { NextRequest } from "next/server"

import { faqController } from "@/server/controllers/faq.controller"

// Translation runs after the response (see queueAndProcess) and needs Node.
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  return faqController.list(request)
}

export async function POST(request: NextRequest) {
  return faqController.create(request)
}
