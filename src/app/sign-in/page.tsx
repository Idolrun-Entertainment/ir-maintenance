import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams

  if (error && error !== "access_denied") {
    redirect("/unauthorized")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignInForm showAccessDeniedError={error === "access_denied"} />
    </div>
  )
}
