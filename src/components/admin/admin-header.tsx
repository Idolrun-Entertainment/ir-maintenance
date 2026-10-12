"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { ThemeToggle } from "@/components/admin/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

type AdminHeaderProps = {
  user: {
    name: string
    email: string
    image?: string | null
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)

    try {
      await authClient.signOut()
      router.push("/sign-in")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="mb-6 flex items-center justify-end gap-3 border-b pb-4">
      <ThemeToggle />
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? (
          <>
            <Spinner data-icon="inline-start" />
            Signing out...
          </>
        ) : (
          "Sign out"
        )}
      </Button>
    </div>
  )
}
