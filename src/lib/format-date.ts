const blogDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

const newsMonth = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
})

export function formatBlogDate(date: string): string {
  const formatted = blogDate.format(new Date(date))

  return formatted.replace(/ (\d{4})$/, ", $1")
}

export function formatNewsDate(date: Date): string {
  return `${newsMonth.format(date).toUpperCase()} ${date.getUTCDate()}`
}

export function formatBlogDateShort(date: string): string {
  return blogDate.format(new Date(date))
}
