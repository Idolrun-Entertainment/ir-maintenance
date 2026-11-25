import { LegalPage, legalMetadata } from "@/components/site-pages/legal-page"

export const metadata = legalMetadata("en", "legal")

export default function Page() {
  return <LegalPage locale="en" slug="legal" />
}
