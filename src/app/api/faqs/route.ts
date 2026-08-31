import type { NextRequest } from "next/server"

import { faqController } from "@/server/controllers/faq.controller"

export async function GET(request: NextRequest) {
  return faqController.list(request)
}

export async function POST(request: NextRequest) {
  return faqController.create(request)
}
