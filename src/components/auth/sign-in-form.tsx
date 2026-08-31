"use client"

import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

type SignInFormProps = {
  showAccessDeniedError?: boolean
}

export function SignInForm({ showAccessDeniedError = false }: SignInFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    showAccessDeniedError
      ? "Google sign-in was cancelled or denied. Please try again."
      : null,
  )

  async function handleSignIn() {
    setLoading(true)
    setError(null)

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        errorCallbackURL: "/sign-in",
      })
    } catch {
      setError("Unable to start Google sign-in. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin sign in</CardTitle>
        <CardDescription>
          Sign in with an authorized Idolrun Google account to manage content.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={loading}
          onClick={handleSignIn}
        >
          {loading ? (
            <>
              <Spinner data-icon="inline-start" />
              Continuing with Google...
            </>
          ) : (
            "Continue with Google"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
