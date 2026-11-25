import { LegalPage, legalMetadata } from "@/components/site-pages/legal-page"

export const metadata = legalMetadata("en", "support")

export default function Page() {
  return <LegalPage locale="en" slug="support" />
}
