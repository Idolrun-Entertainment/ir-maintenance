import { PostPage, postMetadata } from "@/components/site-pages/post-page"

export const revalidate = 300

// Render on first request, then cache (ISR); no posts are known at build time.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps<"/updates/[slug]">) {
  const { slug } = await params
  return postMetadata("en", slug)
}

export default async function Page({ params }: PageProps<"/updates/[slug]">) {
  const { slug } = await params
  return <PostPage locale="en" slug={slug} />
}
