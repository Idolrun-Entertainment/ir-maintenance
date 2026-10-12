import { ValidationError } from "@/lib/errors"

export async function readCappedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const reader = request.body?.getReader()

  if (!reader) {
    throw new ValidationError("Invalid JSON")
  }

  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    total += value.byteLength

    if (total > maxBytes) {
      await reader.cancel()
      throw new ValidationError("Comment is too large")
    }

    chunks.push(value)
  }

  const raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")

  try {
    return JSON.parse(raw)
  } catch {
    throw new ValidationError("Invalid JSON")
  }
}
