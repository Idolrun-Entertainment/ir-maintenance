import { UpdatesPage, updatesMetadata } from "@/components/site-pages/updates-page"

// Home content comes from the database and is edited from /admin.
// Without this the page would be prerendered once at build time and never
// pick up blogs or FAQs created afterwards in production.
export const revalidate = 300

export const metadata = updatesMetadata("en")

export default function Page() {
  return <UpdatesPage locale="en" />
}
