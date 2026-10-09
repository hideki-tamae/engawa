/**
 * エージェントが「自ら止まる」ための入力・依頼の事前チェック（ルールベース）。
 * これはヒューリスティックであり、完全性を保証するものではない。
 * 判定は、拒否・緊急・許可のいずれか。拒否と緊急には理由コードが付き、画面と監査ログに出す。
 *
 * 守る線：
 *  - 診断・病名の断定をしない
 *  - ACE スコアの採点、リスクの点数化、寿命などの個人予測をしない
 *  - 本人や第三者を非難・辱める文面を作らない
 *  - 本人についての推測（本心の読み取りなど）を足さない
 *  - 個人が特定される情報を受け取らない
 *  - 緊急の気配があるときは、会話を続けず公的な窓口を案内する
 */

export type ReasonCode =
  | "emergency"
  | "pii_detected"
  | "blame_tone"
  | "diagnosis_request"
  | "scoring_request"
  | "inference_about_person";

export type Verdict = "allow" | "refuse" | "escalate";

export interface Resource {
  label: string;
  contact: string;
}

export interface ScreenResult {
  verdict: Verdict;
  reasons: ReasonCode[];
  resources: Resource[];
}

/** 公的な窓口。番号は、全国共通で確認できているものだけを置く。 */
export const EMERGENCY_RESOURCES: Resource[] = [
  { label: "警察", contact: "110" },
  { label: "救急", contact: "119" },
  { label: "児童相談所 虐待対応ダイヤル（全国共通・通話無料）", contact: "189" },
  { label: "DV相談ナビ（最寄りの相談機関につながる。受付時間は機関によります）", contact: "#8008" },
  { label: "DV相談+（24時間の電話。チャット相談は12:00〜22:00）", contact: "0120-279-889" },
  { label: "性犯罪・性暴力の相談 全国共通短縮ダイヤル（通話無料）", contact: "#8891" },
];

/** 電話をかけるためのリンク（# は %23 にする） */
export function telHref(contact: string): string {
  return `tel:${contact.replace(/#/g, "%23").replace(/-/g, "")}`;
}

const PII_PATTERNS: RegExp[] = [
  /0\d{1,4}[-ー−\s]?\d{1,4}[-ー−\s]?\d{3,4}/, // 電話番号
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // メールアドレス
  /〒?\s?\d{3}[-ー−]\d{4}/, // 郵便番号
  /(?<!\d)\d{12}(?!\d)/, // 12桁の番号
];

const EMERGENCY_PATTERNS: RegExp[] = [
  /死にたい|消えたい|自殺|自傷|首を(吊|つ)/,
  /殺される|殺されそう/,
  /(殴|蹴)られ(て|ている|そう)/,
  /虐待(されて|を受けて)/,
  /今すぐ(助けて|逃げ)/,
  // 身近な人が、ほかの人に暴力をふるっている（本人の言葉。止めずに、相談先を先に見せる）
  /(暴れ|暴力を(ふる|振る)|手を上げ|髪を引っ?張|叩い|叩か|殴って|蹴って)/,
];

const BLAME_PATTERNS: RegExp[] = [
  /(親|母|父|家族|職員|本人|あの人)(が|は|の).{0,12}(悪い|せい|最低|ダメ|だらしな|無責任|責任を取)/,
  /(責め|非難|叱責|罵倒|批判)(る|して|する|たい|てやりたい)/,
  /(恥を|辱め|晒し|さらし)(かか|て|る|たい)/,
];

const DIAGNOSIS_PATTERNS: RegExp[] = [
  /診断(して|してください|してほしい|を)/,
  /(何の|どんな|どの)(病気|障害|疾患)/,
  /(うつ病|統合失調症|発達障害|依存症|ADHD|自閉症|認知症)(です|だと思|でしょ|ですか|かどうか)/,
  /病名/,
];

const SCORING_PATTERNS: RegExp[] = [
  /(ACE|ACEs|エース).{0,8}(スコア|点数|採点|判定|診断)/i,
  /(リスク|危険度|深刻度).{0,6}(点数|スコア|数値|採点|何点)/,
  /寿命.{0,8}(予測|何年|あと|短)/,
  /(点数|スコア)を(つけ|付け|出し)/,
];

const INFERENCE_PATTERNS: RegExp[] = [
  /(本心|本音|心の中|裏の気持ち).{0,8}(推測|当てて|読んで|教えて|予想)/,
  /(この人|本人|相手)は(本当は|きっと|おそらく).{0,12}(思って|考えて|感じて)/,
];

const matches = (patterns: RegExp[], text: string): boolean =>
  patterns.some((p) => p.test(text));

export function screenRequest(input: string): ScreenResult {
  const text = input.normalize("NFKC");
  const reasons: ReasonCode[] = [];

  if (matches(EMERGENCY_PATTERNS, text)) {
    return {
      verdict: "escalate",
      reasons: ["emergency"],
      resources: EMERGENCY_RESOURCES,
    };
  }

  if (matches(PII_PATTERNS, text)) reasons.push("pii_detected");
  if (matches(BLAME_PATTERNS, text)) reasons.push("blame_tone");
  if (matches(DIAGNOSIS_PATTERNS, text)) reasons.push("diagnosis_request");
  if (matches(SCORING_PATTERNS, text)) reasons.push("scoring_request");
  if (matches(INFERENCE_PATTERNS, text)) reasons.push("inference_about_person");

  if (reasons.length > 0) {
    return { verdict: "refuse", reasons, resources: [] };
  }
  return { verdict: "allow", reasons: [], resources: [] };
}

/**
 * 本人が書いた言葉（困りごと）の確認。
 * 本人の言葉は、本人のもの。病名・怒り・身近な人への言及を、理由に止めない。
 * 止めるのは、個人が特定される情報（電話・住所・メール等）だけ。
 * 危険を示す言葉があれば、止めずに、相談先を先に見せる。
 * 診断・採点・責める表現・推測の規則は、AI への依頼と、AI の出力にだけ使う（screenRequest）。
 */
export function screenInput(input: string): ScreenResult {
  const text = input.normalize("NFKC");
  if (matches(EMERGENCY_PATTERNS, text)) {
    return { verdict: "escalate", reasons: ["emergency"], resources: EMERGENCY_RESOURCES };
  }
  if (matches(PII_PATTERNS, text)) {
    return { verdict: "refuse", reasons: ["pii_detected"], resources: [] };
  }
  return { verdict: "allow", reasons: [], resources: [] };
}

/** 画面に出す、拒否の理由（やさしい言葉）。 */
export const REFUSAL_MESSAGES: Record<Exclude<ReasonCode, "emergency">, string> = {
  pii_detected:
    "個人が特定される情報（電話番号、住所、メールなど）は、入れないでください。入力された内容は受け取っていません。",
  blame_tone:
    "誰かを責めたり、辱めたりする文面は、作りません。起きたことと、困っていることを、事実の言葉で書き直してみませんか。",
  diagnosis_request:
    "病名の判断や診断は、行いません。専門の方につなぐための、困りごとの整理なら、お手伝いできます。",
  scoring_request:
    "点数をつけたり、リスクや寿命を予測したりすることは、行いません。個人の将来は、点数では分かりません。",
  inference_about_person:
    "ご本人の気持ちを推測して足すことは、しません。ご本人の言葉のまま、整理します。",
};
