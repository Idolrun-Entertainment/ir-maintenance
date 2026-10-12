"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AdminShellProps = {
  children: React.ReactNode
  user: {
    name: string
    email: string
    image?: string | null
  }
}

export function AdminShell({ children, user }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="admin flex min-h-screen bg-background">
      <a
        href="#admin-main"
        className="focus:not-sr-only focus:bg-background focus:ring-ring sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:text-sm focus:ring-2"
      >
        Skip to content
      </a>

      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
        <div className="px-4 py-6">
          <Link
            href="/admin"
            className="text-sidebar-foreground text-sm font-semibold tracking-tight"
          >
            Idolrun Admin
          </Link>
        </div>
        <div className="px-3 pb-6">
          <AdminNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-background border-sidebar-border sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            Idolrun Admin
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
            Menu
          </Button>
        </div>

        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogContent id="admin-menu" className="admin">
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
              <DialogDescription>Admin sections</DialogDescription>
            </DialogHeader>
            <AdminNav onNavigate={() => setMenuOpen(false)} />
          </DialogContent>
        </Dialog>

        <main
          id="admin-main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 outline-none md:px-8"
        >
          <AdminHeader user={user} />
          {children}
        </main>
      </div>
    </div>
  )
}
