"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider as NextThemesProvider } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname()

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      // Dark mode is admin-only; public pages always render light.
      forcedTheme={pathname?.startsWith("/admin") ? undefined : "light"}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
