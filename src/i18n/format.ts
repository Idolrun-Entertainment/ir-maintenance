/** Fills `{name}` placeholders. Kept apart from dictionary.ts so client components don't bundle every dictionary. */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
