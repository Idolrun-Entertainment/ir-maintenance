import { LegalPage, legalMetadata } from "@/components/site-pages/legal-page"

export const metadata = legalMetadata("en", "cookies")

export default function Page() {
  return <LegalPage locale="en" slug="cookies" />
}
