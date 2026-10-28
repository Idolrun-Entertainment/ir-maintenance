import { createTranslationEngine } from "../engine"
import { createMemoryStore } from "../memory-store"
import { PermanentTranslationError, type Source, type Translator } from "../types"

/** Prefixes every text node with [code], leaving tags (and attributes) alone. */
export function fakeTranslate(html: string, code: string): string {
  return html.replace(/(^|>)([^<>]+)(?=<|$)/g, (_m, edge: string, text: string) => `${edge}[${code}]${text}`)
}

export function createFakeTranslator(
  behaviour: (texts: string[], code: string, call: number) => string[] | Promise<string[]> = (texts, code) =>
    texts.map((t) => fakeTranslate(t, code)),
) {
  const calls: Array<{ code: string; texts: string[] }> = []
  const translator: Translator = {
    async translateHtml(texts, code) {
      calls.push({ code, texts })
      return behaviour(texts, code, calls.length)
    },
  }
  return { translator, calls }
}

export function blogSource(id: string, title = "Hello", text = "World"): Source {
  return {
    kind: "blog",
    id,
    title,
    content: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    }),
  }
}

export function setup(
  sources: Source[],
  translator: Translator,
  extra: { log?: boolean; clock?: Parameters<typeof createTranslationEngine>[0]["clock"] } = {},
) {
  const memory = createMemoryStore(sources)
  const engine = createTranslationEngine({
    store: memory.store,
    translator,
    clock: { sleep: async () => {}, random: () => 0.5, ...extra.clock },
    log: () => {},
  })
  return { ...memory, engine }
}

export { PermanentTranslationError }
