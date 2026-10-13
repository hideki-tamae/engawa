import type { ProblemCard } from "./card";

/**
 * サンプルの手帳（作り話）。審査や試用で、窓口の画面を、すぐ試せるようにする。
 * 押されるたびに、新しく作る。本人の情報は、入っていない。保存期間は、ふつうの手帳と同じ（30日）。
 */
export function sampleCard(id = `sample-${Date.now().toString(36)}`, lang: "ja" | "en" = "ja"): ProblemCard {
  const f = (value: string) => ({ value, source: "chosen_from_suggestion" as const, confirmed: true });
  return {
    id,
    statement:
      lang === "en"
        ? "A family member is unwell, and I don't know where to start.\n(This is a fictional sample.)"
        : "家族の具合が悪く、何から話せばいいか分からない。\n（作り話のサンプルです）",
    inputMode: "text",
    fields: {
      when: f("ここ数か月"),
      where: f("役所・窓口"),
      what: f("家族のこと"),
      help: f("話を聞いてほしい"),
    },
    shareScope: ["what", "help", "when"],
    personConfirmed: true,
  };
}

/** 英語を選んだ人には、英語のサンプルを出す（Translator と同じ記憶を読む）。 */
export function sampleLang(): "ja" | "en" {
  try {
    return localStorage.getItem("engawa_lang") === "en" ? "en" : "ja";
  } catch {
    return "ja";
  }
}
