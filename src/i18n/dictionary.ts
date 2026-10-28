import type { Locale } from "@/i18n/config"
import { en, type Dictionary } from "@/i18n/dictionaries/en"
import { id } from "@/i18n/dictionaries/id"
import { ja } from "@/i18n/dictionaries/ja"
import { ko } from "@/i18n/dictionaries/ko"
import { zhCN } from "@/i18n/dictionaries/zh-CN"

export type { Dictionary }

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ja,
  id,
  ko,
  "zh-CN": zhCN,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
