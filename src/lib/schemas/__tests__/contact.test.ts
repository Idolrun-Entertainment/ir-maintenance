import { describe, expect, it } from "vitest"

import { contactSchema } from "../contact"

const message = "Hello, I have a question about Battle Kards."

function parse(email: string, text = message) {
  return contactSchema.safeParse({ email, message: text })
}

describe("contactSchema email", () => {
  it.each(["a@b.co", "first.last+tag@sub.example.com", "x_y-z@example.io"])(
    "accepts %s",
    (email) => {
      expect(parse(email).success).toBe(true)
    },
  )

  it.each([
    "",
    "   ",
    "plainaddress",
    "foo@",
    "@bar.com",
    "foo@bar",
    "a@@b.com",
    "a b@c.com",
    "foo@bar..com",
    ".foo@bar.com",
    "foo@-bar.com",
    "foo@bar.com.",
    `${"a".repeat(250)}@b.com`,
  ])("rejects %j", (email) => {
    expect(parse(email).success).toBe(false)
  })

  it("trims and lowercases", () => {
    const result = parse("  Jane.Doe@Example.COM ")
    expect(result.success && result.data.email).toBe("jane.doe@example.com")
  })

  it("explains an invalid address", () => {
    const result = parse("nope")
    expect(!result.success && result.error.issues[0]?.message).toBe(
      "Enter a valid email address",
    )
  })
})

describe("contactSchema message", () => {
  it("trims and accepts the 10..2000 range", () => {
    expect(parse("a@b.co", "  ten chars!  ").success).toBe(true)
    expect(parse("a@b.co", "x".repeat(2000)).success).toBe(true)
  })

  it.each(["", "          ", "too short", "x".repeat(2001)])("rejects %j", (text) => {
    expect(parse("a@b.co", text).success).toBe(false)
  })
})
