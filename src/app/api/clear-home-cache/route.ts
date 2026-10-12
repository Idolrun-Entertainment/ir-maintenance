// Only browsers that cached the old `/` → `/updates` 308 are sent here, by
// ClearCachedHomeRedirect. Keep Clear-Site-Data off page responses: it wipes
// the whole origin cache on every visit.
export function GET() {
  return new Response('<meta http-equiv="refresh" content="0;url=/">', {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Clear-Site-Data": '"cache"',
      "Cache-Control": "no-store",
    },
  })
}
