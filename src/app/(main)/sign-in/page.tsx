import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import styles from "@/components/auth/sign-in.module.css"

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams

  if (error && error !== "access_denied") {
    redirect("/unauthorized")
  }

  return (
    <main className={styles.stage}>
      <SignInForm showAccessDeniedError={error === "access_denied"} />
    </main>
  )
}
