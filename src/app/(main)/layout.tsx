import type { Metadata } from "next"

import { RootShell } from "@/components/root-shell"
import { getSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <RootShell lang="en">{children}</RootShell>
}
