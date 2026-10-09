import type { ProblemCard } from "./card";

/**
 * サンプルの手帳（作り話）。審査や試用で、窓口の画面を、すぐ試せるようにする。
 * 押されるたびに、新しく作る。本人の情報は、入っていない。保存期間は、ふつうの手帳と同じ（30日）。
 */
export function sampleCard(id = `sample-${Date.now().toString(36)}`): ProblemCard {
  const f = (value: string) => ({ value, source: "chosen_from_suggestion" as const, confirmed: true });
  return {
    id,
    statement: "家賃が払えなくて、窓口で何度も同じ説明をしている。（これは、作り話のサンプルです）",
    inputMode: "text",
    fields: {
      when: f("ここ数か月"),
      where: f("役所・窓口"),
      what: f("お金のこと"),
      help: f("話を聞いてほしい"),
    },
    shareScope: ["what", "help", "when"],
    personConfirmed: true,
  };
}
