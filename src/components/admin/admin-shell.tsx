"use client"

import Link from "next/link"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminNav } from "@/components/admin/admin-nav"
import { Separator } from "@/components/ui/separator"

type AdminShellProps = {
  children: React.ReactNode
  user: {
    name: string
    email: string
    image?: string | null
  }
}

export function AdminShell({ children, user }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r p-6 md:block">
          <div className="mb-6">
            <Link href="/admin" className="text-lg font-semibold">
              Idolrun Admin
            </Link>
            <p className="text-muted-foreground mt-1 text-sm">Content management</p>
          </div>
          <AdminNav />
        </aside>
        <main className="flex-1 p-6">
          <div className="mb-6 md:hidden">
            <Link href="/admin" className="text-lg font-semibold">
              Idolrun Admin
            </Link>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              <AdminNav />
            </div>
            <Separator className="mt-4" />
          </div>
          <AdminHeader user={user} />
          {children}
        </main>
      </div>
    </div>
  )
}
