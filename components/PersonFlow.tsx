"use client";

import { useEffect, useRef, useState } from "react";
import {
  FIELD_KEYS,
  type FieldKey,
  clearField,
  joinItems,
  type InputMode,
  type ProblemCard,
  confirmCard,
  createCard,
  setField,
  setShareScope,
} from "@/lib/card";
import { REFUSAL_MESSAGES, screenInput, type ScreenResult } from "@/lib/guardrails";
import { followUpQuestions } from "@/lib/suggestions";
import type { AgentProposal } from "@/lib/agent";
import Qr from "@/components/Qr";
import HandbookCard from "@/components/HandbookCard";

const FIELD_LABEL: Record<FieldKey, string> = {
  when: "いつ頃",
  where: "どこで",
  what: "どんなこと",
  help: "してほしいこと",
};

type Step = "write" | "ask" | "confirm" | "scope" | "done";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function PersonFlow({ intro }: { intro?: React.ReactNode }) {
  const [step, setStep] = useState<Step>("write");
  const [text, setText] = useState("");
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<ScreenResult | null>(null);
  const [card, setCard] = useState<ProblemCard | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const [qi, setQi] = useState(0);
  const qiRef = useRef(0);
  useEffect(() => {
    qiRef.current = qi;
  }, [qi]);
  const DEFAULT_ORDER: FieldKey[] = ["what", "help", "when", "where"];
  // 質問の順序。最初の質問が決まったら固定する（途中で組み替えて、同じ質問を繰り返さないため）
  const [order, setOrder] = useState<FieldKey[]>(DEFAULT_ORDER);
  const [link, setLink] = useState<string | null>(null);
  const [mineLink, setMineLink] = useState<string | null>(null);
  const [showLink, setShowLink] = useState<string | null>(null);
  const [proof, setProof] = useState<{ createdAt: string; code: string; url: string } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  async function publish(c: ProblemCard) {
    const r = await fetch("/api/cards", { method: "POST", body: JSON.stringify(c) });
    const j = await r.json();
    if (!r.ok) {
      setShareError("カードを渡す準備ができませんでした。");
      return;
    }
    setLink(`${window.location.origin}/window/${j.token}`);
    setMineLink(`${window.location.origin}/card/${j.token}`);
    setShowLink(`${window.location.origin}/show/${j.token}`);
    setProof({
      createdAt: j.proof.createdAt,
      code: j.proof.code,
      url: `${window.location.origin}/verify/${j.token}?code=${j.proof.code}`,
    });
  }

  const statementForAgent = card?.statement;
  useEffect(() => {
    if (step !== "ask" || !card) return;
    let alive = true;
    fetch("/api/agent", { method: "POST", body: JSON.stringify(card) })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const p: AgentProposal | null = j.proposal ?? null;
        setProposal(p);
        if (p && qiRef.current === 0) {
          setOrder([p.field, ...DEFAULT_ORDER.filter((k) => k !== p.field)]);
        }
      })
      .catch(() => alive && setProposal(null));
    return () => {
      alive = false;
    };
    // 発言が変わったときだけ、聞き直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, statementForAgent]);

  function toggleVoice() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = getRecognition();
    if (!r) {
      alert("このブラウザでは音声入力が使えません。文字で書いてください。");
      return;
    }
    r.lang = "ja-JP";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      setText((prev) => prev + last[0].transcript);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setVoiceUsed(true);
    setListening(true);
    r.start();
  }

  function submitStatement() {
    const result = screenInput(text);
    setNotice(result);
    if (result.verdict === "refuse") return;
    const mode: InputMode = voiceUsed ? (text ? "text_and_voice" : "voice") : "text";
    setCard(createCard(crypto.randomUUID(), text.trim(), mode));
    setQi(0);
    setOrder(DEFAULT_ORDER);
    setProposal(null);
    setStep("ask");
  }

  // 全ての質問は、複数選択できる。選んだもの＋自分の言葉を、まとめて1つの項目にする。
  const [picks, setPicks] = useState<Record<FieldKey, string[]>>({ when: [], where: [], what: [], help: [] });
  const [own, setOwn] = useState<Record<FieldKey, string>>({ when: "", where: "", what: "", help: "" });

  function sync(field: FieldKey, nextPicks: string[], nextOwn: string) {
    if (!card) return;
    setPicks((p) => ({ ...p, [field]: nextPicks }));
    setOwn((o) => ({ ...o, [field]: nextOwn }));
    const text = joinItems([...nextPicks, nextOwn]);
    if (!text) {
      setCard(clearField(card, field));
      return;
    }
    setCard(setField(card, field, text, nextOwn.trim() ? "own_words" : "chosen_from_suggestion"));
  }

  function togglePick(field: FieldKey, value: string) {
    const cur = picks[field];
    sync(field, cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value], own[field]);
  }

  function toggleScope(k: FieldKey) {
    if (!card) return;
    const next = card.shareScope.includes(k)
      ? card.shareScope.filter((x) => x !== k)
      : [...card.shareScope, k];
    setCard(setShareScope(card, next));
  }

  const btn =
    "rounded-full px-6 py-3 text-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const primary = `${btn} bg-[#7a5a2f] text-white hover:bg-[#654a26] disabled:opacity-40`;
  const quiet = `${btn} border border-[#7a5a2f]/40 text-[#4a3a22] hover:bg-[#7a5a2f]/10`;

  return (
    <>
      {step === "write" && intro}
    <section className="mx-auto w-full max-w-xl px-5 py-10 text-[#2d2418]">
      {notice && notice.verdict === "escalate" && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-base print:hidden">
          <p className="font-medium">いま危険が迫っているときは、先にここへ連絡してください。</p>
          <ul className="mt-2 space-y-1">
            {notice.resources.map((r) => (
              <li key={r.contact}>
                {r.label}：<span className="font-semibold">{r.contact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {notice && notice.verdict === "refuse" && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base">
          {notice.reasons
            .filter((r) => r !== "emergency")
            .map((r) => (
              <p key={r}>{REFUSAL_MESSAGES[r as keyof typeof REFUSAL_MESSAGES]}</p>
            ))}
        </div>
      )}

      {step === "write" && (
        <div>
          <h2 className="text-2xl font-semibold">いま、困っていること</h2>
          <p className="mt-2 text-base text-[#5b4a33]">
            うまく書けなくても大丈夫です。一言でも、話すだけでも構いません。
            お名前や連絡先は、書かなくて大丈夫です。
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            aria-label="困っていること"
            className="mt-5 w-full rounded-2xl border border-[#7a5a2f]/40 bg-white p-4 text-lg leading-8 focus:outline-2 focus:outline-[#7a5a2f]"
          />
          <p className="mt-2 text-sm text-[#5b4a33]">
            音声は保存しません。文字に直した内容だけを使い、直せます。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={toggleVoice} className={quiet}>
              {listening ? "話すのをやめる" : "話して入力する"}
            </button>
            <button
              type="button"
              disabled={text.trim().length === 0}
              onClick={submitStatement}
              className={primary}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {step === "ask" && card && (() => {
        const field = order[Math.min(qi, order.length - 1)];
        const fixed = followUpQuestions(createCard("tmp", "x", "text")).find((q) => q.field === field)!;
        const useAi = proposal?.field === field;
        const question = useAi && proposal ? proposal.question : fixed.question;
        const last = qi >= order.length - 1;
        return (
          <div>
            <p className="text-sm text-[#5b4a33]" aria-live="polite">
              {qi + 1} / {order.length}
            </p>
            <blockquote className="mt-3 rounded-2xl bg-[#f3ead9] p-4 text-base leading-7">
              {card.statement}
            </blockquote>
            <h2 className="mt-6 text-2xl font-semibold leading-9">{question}</h2>
            <p className="mt-1 text-sm text-[#5b4a33]">いくつでも選べます。飛ばしても大丈夫です。</p>
            {useAi && proposal?.source === "gemini" && (
              <p className="mt-2 text-xs text-[#5b4a33]">この質問は、AI（Gemini）が選びました。</p>
            )}
            {useAi && proposal && proposal.suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-[#5b4a33]">あなたの言葉から。合っていれば、選んでください。</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {proposal.suggestions.map((sg) => (
                    <button
                      key={sg.text}
                      type="button"
                      aria-pressed={picks[sg.field].includes(sg.text)}
                      onClick={() => togglePick(sg.field, sg.text)}
                      className={`rounded-full border px-4 py-3 text-lg ${
                        picks[sg.field].includes(sg.text)
                          ? "border-[#7a5a2f] bg-[#7a5a2f] text-white"
                          : "border-[#7a5a2f] hover:bg-[#7a5a2f]/10"
                      }`}
                    >
                      「{sg.text}」
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {fixed.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={picks[field].includes(o)}
                  onClick={() => togglePick(field, o)}
                  className={`rounded-full border px-5 py-3 text-lg ${
                    picks[field].includes(o)
                      ? "border-[#7a5a2f] bg-[#7a5a2f] text-white"
                      : "border-[#7a5a2f]/40 hover:bg-[#7a5a2f]/10"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <input
              type="text"
              aria-label={`${FIELD_LABEL[field]}（自分の言葉で）`}
              placeholder="自分の言葉で書く"
              value={own[field]}
              onChange={(e) => sync(field, picks[field], e.target.value)}
              className="mt-5 w-full rounded-xl border border-[#7a5a2f]/40 bg-white p-4 text-lg"
            />
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => (qi === 0 ? setStep("write") : setQi(qi - 1))}
                className={quiet}
              >
                戻る
              </button>
              <button
                type="button"
                onClick={() => (last ? setStep("confirm") : setQi(qi + 1))}
                className={primary}
              >
                {last ? "確認へ" : picks[field].length || own[field] ? "次へ" : "飛ばす"}
              </button>
            </div>
          </div>
        );
      })()}

      {step === "confirm" && card && (
        <div>
          <h2 className="text-2xl font-semibold">これで、合っていますか？</h2>
          <p className="mt-2 text-base text-[#5b4a33]">
            あなたの言葉のまま、まとめました。違うところは、戻って直せます。
          </p>
          <dl className="mt-5 space-y-4 rounded-2xl bg-[#f3ead9] p-5">
            <div>
              <dt className="text-sm text-[#5b4a33]">あなたの言葉</dt>
              <dd className="mt-1 text-lg leading-8">{card.statement}</dd>
            </div>
            {FIELD_KEYS.map((k) => (
              <div key={k}>
                <dt className="text-sm text-[#5b4a33]">{FIELD_LABEL[k]}</dt>
                <dd className="mt-1 text-lg">{card.fields[k]?.value ?? "（今は書かなかった）"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => { setQi(0); setStep("ask"); }} className={quiet}>
              違う、直す
            </button>
            <button type="button" onClick={() => setStep("scope")} className={primary}>
              合っている
            </button>
          </div>
        </div>
      )}

      {step === "scope" && card && (
        <div>
          <h2 className="text-2xl font-semibold">窓口に伝える範囲を選んでください</h2>
          <p className="mt-2 text-base text-[#5b4a33]">
            あなたが選んだところだけが、窓口に渡ります。いつでも取り下げられます。
          </p>
          <div className="mt-5 space-y-3">
            <p className="rounded-xl border border-[#7a5a2f]/30 p-3 text-base">
              ✔ あなたの言葉（これは必ず付きます）
            </p>
            {FIELD_KEYS.filter((k) => card.fields[k]).map((k) => (
              <label key={k} className="flex items-center gap-3 rounded-xl border border-[#7a5a2f]/30 p-3 text-base">
                <input
                  type="checkbox"
                  checked={card.shareScope.includes(k)}
                  onChange={() => toggleScope(k)}
                  className="h-5 w-5"
                />
                {FIELD_LABEL[k]}：{card.fields[k]?.value}
              </label>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => setStep("confirm")} className={quiet}>
              戻る
            </button>
            <button
              type="button"
              disabled={card.shareScope.length === 0}
              onClick={() => {
                const confirmed = confirmCard(card);
                setCard(confirmed);
                setStep("done");
                void publish(confirmed);
              }}
              className={primary}
            >
              このカードを作る
            </button>
          </div>
          {card.shareScope.length === 0 && (
            <p className="mt-3 text-sm text-[#5b4a33]">
              1つ以上選ぶと、進めます。選ばないままだと、何も渡りません。
            </p>
          )}
        </div>
      )}

      {step === "done" && card && (
        <div>
          <div className="print:hidden">
            <h2 className="text-2xl font-semibold">手帳ができました</h2>
            <div className="mt-4">
              <HandbookCard
                statement={card.statement}
                fields={Object.fromEntries(
                  FIELD_KEYS.filter((k) => card.fields[k] && card.shareScope.includes(k)).map((k) => [k, { value: card.fields[k]!.value }]),
                )}
              />
            </div>
            <p className="mt-2 text-base text-[#5b4a33]">
              これは、あなたの困りごとを、あなたの言葉のまま持ち歩ける手帳です。窓口で、同じ話を最初から説明し直す手間を、減らすためのものです。
              窓口が受け取るかどうかは、窓口によります。
            </p>
            <h3 className="mt-6 text-lg font-medium">使い方（4つ）</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-6 text-base leading-7">
              <li>
                <span className="font-medium">あなたの携帯の画面を、そのまま見せる。</span>
                下の「窓口に画面を見せる」を開くと、大きな文字で表示されます。窓口の設備は、関係ありません。
              </li>
              <li>
                <span className="font-medium">紙にして持っていく。</span>
                下の「印刷する（紙・PDF）」で、窓口に出せる1枚になります。窓口が、特別な準備をしなくても使えます。
              </li>
              <li>
                <span className="font-medium">窓口が画面で見られる場合は、リンクを渡す。</span>
                窓口は、専用の画面にログインして、あなたが選んだ範囲だけを見ます。
              </li>
              <li>
                <span className="font-medium">あなたは、いつでも確認・取り下げができる。</span>
                誰がいつ開いたかも、見られます。
              </li>
            </ol>
            <h3 className="mt-6 text-lg font-medium">窓口の用紙に書き写すとき</h3>
            <p className="mt-1 text-sm text-[#5b4a33]">
              窓口の用紙は、窓口ごとに様式が違います。項目ごとにコピーできるので、貼り付けや書き写しに使ってください。
            </p>
            <ul className="mt-2 space-y-2">
              {[
                { k: "statement", label: "あなたの言葉", v: card.statement },
                ...FIELD_KEYS.filter((k) => card.fields[k] && card.shareScope.includes(k)).map((k) => ({
                  k,
                  label: FIELD_LABEL[k],
                  v: card.fields[k]?.value ?? "",
                })),
              ].map((row) => (
                <li key={row.k} className="flex items-start justify-between gap-3 rounded-xl border border-[#7a5a2f]/30 p-3">
                  <span className="text-base">
                    <span className="block text-sm text-[#5b4a33]">{row.label}</span>
                    {row.v}
                  </span>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(row.v)}
                    className="shrink-0 rounded-full border border-[#7a5a2f]/50 px-3 py-1 text-sm hover:bg-[#7a5a2f]/10"
                  >
                    コピー
                  </button>
                </li>
              ))}
            </ul>
            {showLink && (
              <a href={new URL(showLink).pathname} className={`${primary} mt-6 inline-block`}>
                窓口に画面を見せる
              </a>
            )}
            <button type="button" onClick={() => window.print()} className={`${quiet} mt-6 ml-3`}>
              印刷する（紙・PDF）
            </button>
            {shareError && <p role="alert" className="mt-3 text-base">{shareError}</p>}
            {link && (
              <div className="mt-6 rounded-2xl bg-[#f3ead9] p-4 text-base">
                <p className="font-medium">窓口に画面で見せるときのリンク</p>
                <a href={new URL(link).pathname} className="mt-1 block break-all underline">{link}</a>
                <button type="button" onClick={() => void navigator.clipboard.writeText(link)} className="mt-1 rounded-full border border-[#7a5a2f]/50 px-3 py-1 text-sm hover:bg-[#7a5a2f]/10">リンクをコピー</button>
                {mineLink && (
                  <>
                    <p className="mt-4 font-medium">あなたが、誰が見たかを確認したり、取り下げたりするページ</p>
                    <a href={new URL(mineLink).pathname} className="mt-1 block break-all underline">{mineLink}</a>
                    <button type="button" onClick={() => void navigator.clipboard.writeText(mineLink)} className="mt-1 rounded-full border border-[#7a5a2f]/50 px-3 py-1 text-sm hover:bg-[#7a5a2f]/10">リンクをコピー</button>
                  </>
                )}
                <p className="mt-4 text-sm text-[#5b4a33]">
                  このリンクを知っている人は、窓口のログインがあれば、カードを開けます。他の人には見せないでください。
                </p>
              </div>
            )}
            <button type="button" onClick={() => { setLink(null); setMineLink(null); setShowLink(null); setProof(null); setCard(null); setPicks({ when: [], where: [], what: [], help: [] }); setOwn({ when: "", where: "", what: "", help: "" }); setText(""); setNotice(null); setStep("write"); }} className={`${quiet} mt-8`}>
              新しく作る
            </button>
          </div>

          <div className="hidden print:block">
            <h2 className="text-2xl font-semibold">困りごとの手帳（Engawa）</h2>
            <p className="mt-1 text-sm">
              これは、本人が自分の言葉で書いたものです。診断や評価ではありません。
            </p>
            <p className="mt-4 text-sm">本人の言葉</p>
            <p className="text-lg leading-8">{card.statement}</p>
            {FIELD_KEYS.filter((k) => card.fields[k] && card.shareScope.includes(k)).map((k) => (
              <div key={k} className="mt-3">
                <p className="text-sm">{FIELD_LABEL[k]}</p>
                <p className="text-lg">{card.fields[k]?.value}</p>
              </div>
            ))}
            {proof && (
              <div className="mt-6 space-y-1 border-t pt-3 text-sm">
                <p>作成日時：{new Date(proof.createdAt).toLocaleString("ja-JP")}（秒まで）</p>
                <p>本人の確認：この内容で合っていると、本人が確認しました。</p>
                <p>照合コード：<span className="font-mono">{proof.code}</span></p>
                <div className="mt-3 flex flex-wrap gap-6">
                  {link && <Qr value={link} label="窓口が画面で見る" />}
                  <Qr value={proof.url} label="紙が原本と同じか確かめる" />
                </div>
                {link && <p className="break-all">窓口が画面で見る（窓口のログインが必要）：{link}</p>}
                <p className="break-all">この紙が原本と同じかを確かめる：{proof.url}</p>
                <p className="mt-2">窓口の用紙に書ききれないときは、この紙を別紙としてお使いください。</p>
                <p className="mt-4">署名（任意）：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</p>
                <p className="text-xs">
                  ※ 照合は、紙が記録と同じ内容であることを示すもので、法的な証拠力を保証するものではありません。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
    </>
  );
}
