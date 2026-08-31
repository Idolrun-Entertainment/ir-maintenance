import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const blogs = [
  {
    title: "Getting Started with Idolrun",
    slug: "getting-started-with-idolrun",
    date: new Date("2025-01-15"),
    content:
      "Welcome to Idolrun! This is your first step into a world of community-driven events and unforgettable experiences.",
    imageUrl: "https://placehold.co/800x450/png?text=Getting+Started",
    imagePublicId: "seed/getting-started",
  },
  {
    title: "Training Tips for Your First 5K",
    slug: "training-tips-first-5k",
    date: new Date("2025-02-01"),
    content:
      "Preparing for your first 5K? Start slow, stay consistent, and remember that every run counts toward your goal.",
    imageUrl: "https://placehold.co/800x450/png?text=5K+Training",
    imagePublicId: "seed/training-tips",
  },
  {
    title: "Community Spotlight: March 2025",
    slug: "community-spotlight-march-2025",
    date: new Date("2025-03-10"),
    content:
      "This month we celebrate the runners who went above and beyond to support their local communities.",
    imageUrl: "https://placehold.co/800x450/png?text=Community",
    imagePublicId: "seed/community-spotlight",
  },
]

const faqs = [
  {
    question: "What is Idolrun?",
    answer:
      "Idolrun is a community platform for organizing and participating in running events.",
    order: 1,
  },
  {
    question: "How do I register for an event?",
    answer:
      "Browse upcoming events on our homepage and click Register. You will receive a confirmation email.",
    order: 2,
  },
  {
    question: "Can I cancel my registration?",
    answer:
      "Yes, you can cancel up to 48 hours before the event start time from your account dashboard.",
    order: 3,
  },
  {
    question: "Are events open to all skill levels?",
    answer:
      "Absolutely! Our events welcome runners and walkers of all experience levels.",
    order: 4,
  },
  {
    question: "How do I contact support?",
    answer:
      "Email us at support@idolrun.com or use the contact form on our website.",
    order: 5,
  },
]

async function main() {
  for (const blog of blogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {},
      create: blog,
    })
  }

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { question: faq.question },
    })

    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: faq,
      })
    } else {
      await prisma.faq.create({ data: faq })
    }
  }

  console.log("Seeded 3 blogs and 5 FAQs")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
