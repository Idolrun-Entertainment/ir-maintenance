import { HomeHero } from "@/components/home/home-hero"
import { HomeTabs } from "@/components/home/home-tabs"
import { collectContentImages } from "@/lib/blog-content"
import { blogService } from "@/server/services/blog.service"
import { faqService } from "@/server/services/faq.service"

// Home content comes from the database and is edited from /admin.
// Without this the page would be prerendered once at build time and never
// pick up blogs or FAQs created afterwards in production.
export const revalidate = 300

export default async function Page() {
  let blogs: {
    id: string
    title: string
    date: string
    content: string
  }[] = []
  let faqs: {
    id: string
    question: string
    answer: string
  }[] = []

  try {
    const [blogResult, faqResult] = await Promise.all([
      blogService.list({ page: 1, limit: 20 }),
      faqService.list({ page: 1, limit: 50 }),
    ])

    blogs = blogResult.items.map((blog) => ({
      id: blog.id,
      title: blog.title,
      date: blog.date.toISOString(),
      content: blog.content,
    }))

    faqs = faqResult.items.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    }))
  } catch (error) {
    console.error("Failed to load home page content:", error)
  }

  const seenScreenshotSrcs = new Set<string>()
  const screenshots = blogs.flatMap((blog) =>
    collectContentImages(blog.content).flatMap((image) => {
      if (seenScreenshotSrcs.has(image.src)) {
        return []
      }

      seenScreenshotSrcs.add(image.src)

      return [
        {
          src: image.src,
          alt: image.alt || blog.title,
        },
      ]
    }),
  )

  return (
    <div className="home-page">
      <div className="home-page__shell">
        <HomeHero />
        <HomeTabs blogs={blogs} faqs={faqs} screenshots={screenshots} />
      </div>
    </div>
  )
}
