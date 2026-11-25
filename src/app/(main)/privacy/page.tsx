import { LegalPage, legalMetadata } from "@/components/site-pages/legal-page"

export const metadata = legalMetadata("en", "privacy")

export default function Page() {
  return <LegalPage locale="en" slug="privacy" />
}
