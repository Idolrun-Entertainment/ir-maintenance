export function isAllowedNewsImageUrl(
  value: string,
  cloudName = process.env.CLOUDINARY_CLOUD_NAME,
): boolean {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== "https:") {
    return false
  }

  if (url.hostname === "placehold.co") {
    return true
  }

  if (url.hostname !== "res.cloudinary.com") {
    return false
  }

  // The cloud name is a server env var. The admin form validates in the browser,
  // where it is unset, so any Cloudinary host is accepted there and the server
  // still requires this project's path.
  if (!cloudName) {
    return true
  }

  return url.pathname.startsWith(`/${cloudName}/`)
}
