import { type AuditEntry, verifyChain } from "./audit-chain";
import { type Generate, proposeNext } from "./agent";
import { confirmCard, createCard, setField, setShareScope } from "./card";
import { screenInput } from "./guardrails";
import { handOff, open, proofFor, recordReadBack, share, verifyPaper, viewFor, withdraw } from "./handoff";

/**
 * 「仕組みを見る」用のシナリオ。作り話の例だけを使い、実際のしくみ（本物の関数）を順に動かして、結果を並べる。
 * 見せるために結果を作っているのではなく、実際に動かした結果をそのまま返す。
 */
export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}
export interface Step {
  title: string;
  why: string;
  checks: Check[];
}

const FICTION = "家賃が払えなくて、役所で何度も同じ説明をしています。母が入院していて、手続きも分かりません。";

export async function runScenario(generate: Generate | null): Promise<Step[]> {
  const steps: Step[] = [];

  // 1. 入力の確認
  const sicknessInput = screenInput("母が入院していて、病気のことも心配です。");
  const phoneInput = screenInput("電話は 090-1234-5678 です。");
  const dangerInput = screenInput("同居の家族が暴れて、怖いです。");
  steps.push({
    title: "1. 本人が書いた言葉の確認",
    why: "本人の言葉は止めない。止めるのは、個人が特定される情報だけ。危険を示す言葉は、止めずに相談先を見せる。",
    checks: [
      { label: "病気や家族の事情を書いても、止めない", ok: sicknessInput.verdict === "allow", detail: `判定：${sicknessInput.verdict}` },
      { label: "電話番号を書いたら、止める", ok: phoneInput.verdict === "refuse", detail: `判定：${phoneInput.verdict}（${phoneInput.reasons.join(",")}）` },
      {
        label: "危険を示す言葉は、止めずに相談先（110/119/189）を先に見せる",
        ok: dangerInput.verdict === "escalate" && dangerInput.resources.length > 0,
        detail: `判定：${dangerInput.verdict}、相談先 ${dangerInput.resources.length} 件`,
      },
    ],
  });

  // 2. AI の質問選択と、検証
  const card0 = createCard("demo-1", FICTION, "text");
  const live = await proposeNext(card0, generate);
  const badGen: Generate = async () =>
    JSON.stringify({ field: "what", question: "あなたは何の病気ですか？診断してください", suggestions: [] });
  const bad = await proposeNext(card0, badGen);
  const fakeQuote: Generate = async () =>
    JSON.stringify({
      field: "what",
      question: "どんなことで困っていますか？",
      suggestions: [
        { text: "家賃が払えなくて", quote: "家賃が払えなくて" },
        { text: "うつ病", quote: "うつ病" },
      ],
    });
  const fq = await proposeNext(card0, fakeQuote);
  steps.push({
    title: "2. AI の質問選択と、出力の検証",
    why: "AI は「次の質問を選ぶ」ことと「本人の言葉からの引用候補」だけ。出力は必ず検証し、通らなければ固定の質問に戻す。",
    checks: [
      {
        label: "実際の質問選択（今の設定）",
        ok: live !== null,
        detail: live ? `${live.source === "gemini" ? "Gemini が選択" : "固定の質問（キー未設定、または失敗）"}：「${live.question}」` : "なし",
      },
      {
        label: "AI が診断のような質問を返しても、通さない（疑似の出力で確認）",
        ok: bad?.source === "fallback",
        detail: bad ? `採用：${bad.source}（固定の質問に戻した）` : "なし",
      },
      {
        label: "本人の発言にない引用は、候補から外す（疑似の出力で確認）",
        ok: fq?.source === "gemini" && fq.suggestions.length === 1 && fq.dropped === 1,
        detail: fq ? `残した候補 ${fq.suggestions.length} 件、外した候補 ${fq.dropped} 件` : "なし",
      },
    ],
  });

  // 3. カードと、見せる範囲
  let card = createCard("demo-2", FICTION, "text");
  card = setField(card, "what", "お金のこと、家族のこと", "chosen_from_suggestion");
  card = setField(card, "where", "役所・窓口", "chosen_from_suggestion");
  card = setField(card, "help", "手続きを一緒にしてほしい", "chosen_from_suggestion");
  card = setShareScope(card, ["what", "help"]);
  const view = viewFor(card);
  steps.push({
    title: "3. 本人が選んだ範囲だけが、窓口に見える",
    why: "窓口に渡る形には、本人が選んでいない項目は、そもそも含まれない。",
    checks: [
      { label: "本人のカードにある項目", ok: true, detail: Object.keys(card.fields).join("、") },
      { label: "窓口に見える項目", ok: Object.keys(view.fields).length === 2, detail: Object.keys(view.fields).join("、") },
      { label: "選ばなかった項目（where）は、見えない", ok: view.fields.where === undefined, detail: "窓口の表示に where は含まれない" },
    ],
  });

  // 4. 共有の条件と、引き継ぎの条件
  const notConfirmed = share(card, "demo-token");
  const confirmed = confirmCard(card);
  const shared = share(confirmed, "demo-token");
  if (!shared.ok) throw new Error("demo share failed");
  let h = shared.value;
  const early = handOff(h, "例：福祉の相談先");
  const rb = recordReadBack(h, "confirmed");
  if (!rb.ok) throw new Error("demo readback failed");
  h = rb.value;
  const later = handOff(h, "例：福祉の相談先");
  if (!later.ok) throw new Error("demo handoff failed");
  h = later.value;
  steps.push({
    title: "4. 本人の確認がないと、先へ進めない",
    why: "共有も引き継ぎも、本人の「合っている」が前提。窓口が先に進めることはできない。",
    checks: [
      { label: "本人が確認する前は、共有できない", ok: !notConfirmed.ok, detail: notConfirmed.ok ? "共有できてしまった" : `拒否：${notConfirmed.reason}` },
      { label: "読み返しで本人が答える前は、引き継げない", ok: !early.ok, detail: early.ok ? "引き継げてしまった" : `拒否：${early.reason}` },
      { label: "本人が「合っている」と答えた後は、引き継げる", ok: later.ok, detail: "引き継ぎを記録した" },
    ],
  });

  // 5. 記録と、改ざんの検知
  const log: AuditEntry[] = h.log;
  const intact = verifyChain(log);
  const tampered = log.map((e, i) => (i === 1 ? { ...e, actor: "system" as const } : e));
  const broken = verifyChain(tampered);
  const hasBody = JSON.stringify(log).includes("家賃");
  steps.push({
    title: "5. 経過の記録と、改ざんの検知",
    why: "誰がいつ何をしたかを、ハッシュでつないで残す。本文は記録に入れない。書き換えは、防げないが、検知できる。",
    checks: [
      { label: "記録の並び", ok: true, detail: log.map((e) => e.type).join(" → ") },
      { label: "そのままなら、異常なし", ok: intact.ok, detail: intact.ok ? "検証：異常なし" : "異常あり" },
      {
        label: "1か所を書き換えると、検知される（疑似の書き換えで確認）",
        ok: !broken.ok,
        detail: broken.ok ? "検知できなかった" : `検知：${broken.brokenAt + 1} 件目で不一致`,
      },
      { label: "記録に、本文が入っていない", ok: !hasBody, detail: hasBody ? "本文が混入" : "本文は含まれない" },
    ],
  });

  // 6. 紙の照合
  const { code, createdAt } = proofFor(h);
  const same = verifyPaper(h, code);
  const diff = verifyPaper(h, "000000000000");
  steps.push({
    title: "6. 紙の照合",
    why: "紙の内容が、記録と同じかを確かめる。1字でも違えば、コードが変わる。",
    checks: [
      { label: "作成日時（秒まで）", ok: true, detail: createdAt },
      { label: "正しいコードは、一致する", ok: same.match, detail: `照合コード ${code}` },
      { label: "違うコードは、一致しない", ok: !diff.match, detail: "不一致" },
    ],
  });

  // 7. 取り下げ
  const w = withdraw(h);
  const afterOpen = open(w, "例：窓口");
  const afterPaper = verifyPaper(w, code);
  steps.push({
    title: "7. 本人は、いつでも取り下げられる",
    why: "取り下げたら、窓口は見られず、紙の照合も無効になる。",
    checks: [
      { label: "取り下げ後、窓口は開けない", ok: !afterOpen.ok, detail: afterOpen.ok ? "開けてしまった" : `拒否：${afterOpen.reason}` },
      { label: "取り下げ後、紙の照合は無効", ok: !afterPaper.match, detail: afterPaper.match ? "有効のまま" : "無効" },
      { label: "取り下げも、記録に残る", ok: w.log[w.log.length - 1].type === "withdrawn", detail: `最後の記録：${w.log[w.log.length - 1].type}` },
    ],
  });

  return steps;
}
