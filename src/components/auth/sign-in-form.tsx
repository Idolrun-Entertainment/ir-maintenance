"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { CircleAlert } from "lucide-react"

import { displayFont } from "@/components/landing/display-font"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

import styles from "./sign-in.module.css"

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
    <section className={styles.panel} aria-labelledby="sign-in-title">
      <Link
        href="/"
        aria-label="Idolrun Entertainment"
        className={cn(
          styles.rise,
          "inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
        )}
      >
        <Image
          src="/images/idolrun-logo.png"
          alt=""
          width={200}
          height={184}
          className="h-16 w-auto transition-transform duration-300 ease-out hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
        />
      </Link>

      <p
        className={cn(
          styles.rise,
          styles.d1,
          "mt-7 text-[11px] font-semibold tracking-[0.28em] text-white/60 uppercase",
        )}
      >
        Admin
      </p>

      <h1
        id="sign-in-title"
        className={cn(
          displayFont,
          styles.rise,
          styles.d2,
          "mt-3 text-[3.35rem] leading-none font-extrabold tracking-[0.03em] text-white italic sm:text-6xl",
        )}
      >
        Sign in
      </h1>

      <p
        className={cn(
          styles.rise,
          styles.d3,
          "mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/90",
        )}
      >
        Sign in with an authorized Idolrun Google account to manage content.
      </p>

      <div className={cn(styles.rise, styles.d4, "mt-8 flex flex-col gap-4")}>
        {error ? (
          <Alert variant="destructive" className={cn(styles.alert, styles.rise)}>
            <CircleAlert aria-hidden />
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className={cn(
            "h-12 w-full cursor-pointer gap-3 rounded-md border-0 bg-white px-4 text-[15px] font-semibold text-[#121212] shadow-none transition-opacity duration-200 ease-out hover:bg-white hover:text-[#121212] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none active:opacity-80 disabled:transform-none motion-reduce:transition-none",
          )}
          disabled={loading}
          aria-busy={loading}
          onClick={handleSignIn}
        >
          {loading ? (
            <>
              <Spinner data-icon="inline-start" className="text-[#121212]" />
              Continuing with Google...
            </>
          ) : (
            <>
              <GoogleMark className="transition-transform duration-200 ease-out group-hover/button:translate-x-px motion-reduce:transition-none" />
              Continue with Google
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className={cn("size-4", className)}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}
