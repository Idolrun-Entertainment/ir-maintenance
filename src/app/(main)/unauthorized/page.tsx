import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            This Google account is not authorized to access the Idolrun admin
            panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            If you believe this is a mistake, contact an administrator to have
            your email added to the allowlist.
          </p>
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full")}
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
