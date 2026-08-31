import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"

import { isAdminEmail } from "@/lib/admin-emails"
import { prisma } from "@/lib/prisma"

const ACCESS_DENIED_MESSAGE =
  "This Google account is not authorized to access the admin panel."

function assertAllowlistedEmail(email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    throw new APIError("FORBIDDEN", {
      code: "UNAUTHORIZED",
      message: ACCESS_DENIED_MESSAGE,
    })
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          assertAllowlistedEmail(user.email)
          return { data: user }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          })

          assertAllowlistedEmail(user?.email)
          return { data: session }
        },
      },
    },
  },
  onAPIError: {
    errorURL: "/sign-in",
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
