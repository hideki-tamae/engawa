"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FIELD_KEYS,
  type FieldKey,
  type InputMode,
  type ProblemCard,
  clearField,
  confirmCard,
  createCard,
  joinItems,
  setField,
  setShareScope,
} from "@/lib/card";
import { REFUSAL_MESSAGES, type ScreenResult, screenInput } from "@/lib/guardrails";
import { followUpQuestions } from "@/lib/suggestions";
import type { AgentProposal } from "@/lib/agent";
import CoverPicker from "@/components/CoverPicker";
import ProfileEditor from "@/components/ProfileEditor";
import Celebrate from "@/components/Celebrate";
import EmergencyList from "@/components/EmergencyList";
import { EyeSwitch, FieldIcon, ScopeDots } from "@/components/ScopeParts";
import HoldToSeal from "@/components/HoldToSeal";
import LangSwitch from "@/components/LangSwitch";
import SafetyPanel from "@/components/SafetyPanel";
import StepArt from "@/components/StepArt";
import { SAFETY_OPTION, WHAT_MORE } from "@/lib/suggestions";
import FindWindows from "@/components/FindWindows";
import HandbookCard from "@/components/HandbookCard";
import { Guide, Mark } from "@/components/Mark";
import StoryHero from "@/components/StoryHero";
import Qr from "@/components/Qr";
import {
  IconArrow,
  IconBack,
  IconCheck,
  IconCopy,
  IconEye,
  IconLink,
  IconLock,
  IconMic,
  IconPaper,
  IconPhone,
  IconPrint,
  IconShield,
  IconSpark,
  IconUndo,
} from "@/components/icons";
import { Button, Chip, Notice, StepDots, buttonClass } from "@/components/ui";
import { STT_MAX_SECONDS, blobTo16kPcmBase64 } from "@/lib/audio";
import { useCover } from "@/lib/cover-client";
import { initTrial, track, useTrialMode } from "@/lib/trial-client";

const FIELD_LABEL: Record<FieldKey, string> = {
  when: "いつ頃",
  where: "どこで",
  what: "どんなこと",
  help: "してほしいこと",
};
const DEFAULT_ORDER: FieldKey[] = ["what", "help", "when", "where"];
const FLOW_STEPS = ["書く", "質問", "確認", "見せ方"];

function TrialBanner() {
  return (
    <div className="sticky top-0 z-30 border-b border-sun/60 bg-[#fff3d1] px-4 py-2 text-center text-sm leading-6 text-ink print:hidden" role="status">
      <strong>試用中です。</strong>操作にかかった時間と、最後まで進めたかだけを、匿名で記録しています。<strong>あなたの言葉や、選んだ内容は、記録しません。</strong>
    </div>
  );
}

const DRAFT_KEY = "engawa_draft";
type Step = "welcome" | "write" | "ask" | "confirm" | "scope" | "done";
const STEP_INDEX: Partial<Record<Step, number>> = { write: 0, ask: 1, confirm: 2, scope: 3 };

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

function selectedFields(card: ProblemCard, onlyScope: boolean) {
  return Object.fromEntries(
    FIELD_KEYS.filter((k) => card.fields[k] && (!onlyScope || card.shareScope.includes(k))).map((k) => [
      k,
      { value: card.fields[k]!.value },
    ]),
  ) as Partial<Record<FieldKey, { value: string }>>;
}

export default function PersonFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [text, setText] = useState("");
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // LINE・Facebook・Instagram・X・WeChat などの「アプリ内ブラウザ」では、マイクが許可されないことが多い
  const [inApp, setInApp] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInApp(/Line\/|FBAN|FBAV|FB_IAB|Instagram|Twitter|MicroMessenger|KAKAOTALK|NAVER\(inapp|; wv\)/i.test(ua));
  }, []);
  const [notice, setNotice] = useState<ScreenResult | null>(null);
  const [card, setCard] = useState<ProblemCard | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const [thinking, setThinking] = useState(false);
  const [qi, setQi] = useState(0);
  const qiRef = useRef(0);
  useEffect(() => {
    qiRef.current = qi;
  }, [qi]);
  // 質問の順序。最初の質問が決まったら固定する（途中で組み替えて、同じ質問を繰り返さないため）
  const [order, setOrder] = useState<FieldKey[]>(DEFAULT_ORDER);
  const [picks, setPicks] = useState<Record<FieldKey, string[]>>({ when: [], where: [], what: [], help: [] });
  const [own, setOwn] = useState<Record<FieldKey, string>>({ when: "", where: "", what: "", help: "" });
  const [sealing, setSealing] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [mineLink, setMineLink] = useState<string | null>(null);
  const [showLink, setShowLink] = useState<string | null>(null);
  const [proof, setProof] = useState<{ createdAt: string; code: string; url: string } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const trial = useTrialMode();
  const cover = useCover();
  const [coverOpen, setCoverOpen] = useState(false);
  const [moreWhat, setMoreWhat] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  useEffect(() => {
    initTrial();
  }, []);

  // 書きかけは、この画面（タブ）の中にだけ、一時的に残す。閉じると消える。完成したら、すぐ消す。
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { text?: string; picks?: Record<FieldKey, string[]>; own?: Record<FieldKey, string> };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (d.text) setText(d.text);
        if (d.picks) setPicks(d.picks);
        if (d.own) setOwn(d.own);
        if (d.text) setRestored(true);
      }
    } catch {
      /* 読めなければ、何もしない */
    }
  }, []);
  useEffect(() => {
    try {
      if (step === "done" || (!text && !FIELD_KEYS.some((k) => picks[k].length || own[k]))) {
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ text, picks, own }));
      }
    } catch {
      /* 保存できない環境では、何もしない */
    }
  }, [text, picks, own, step]);
  useEffect(() => {
    if (step === "write" || step === "ask" || step === "confirm" || step === "scope") track(`step_${step}`);
  }, [step]);

  function copy(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    track(key === "window" || key === "mine" ? "share_link_copy" : "share_field_copy");
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
  }

  async function publish(c: ProblemCard) {
    setShareError(null);
    const r = await fetch("/api/cards", { method: "POST", body: JSON.stringify(c) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setShareError("手帳を渡す準備ができませんでした。もう一度お試しください。");
      return;
    }
    const o = window.location.origin;
    track("card_created", {
      voice: voiceUsed,
      skipped: FIELD_KEYS.filter((k) => !c.fields[k]).length,
      shared: c.shareScope.length,
    });
    setLink(`${o}/window/${j.windowToken ?? j.token}`);
    setMineLink(`${o}/card/${j.token}`);
    setShowLink(`${o}/show/${j.token}`);
    setProof({
      createdAt: j.proof.createdAt,
      code: j.proof.code,
      url: `${o}/verify/${j.windowToken ?? j.token}?code=${j.proof.code}`,
    });
  }

  const statementForAgent = card?.statement;
  useEffect(() => {
    if (step !== "ask" || !card) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThinking(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    fetch("/api/agent", { method: "POST", body: JSON.stringify(card), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const p: AgentProposal | null = j.proposal ?? null;
        setProposal(p);
        if (p && qiRef.current === 0) {
          setOrder([p.field, ...DEFAULT_ORDER.filter((k) => k !== p.field)]);
        }
      })
      .catch(() => alive && setProposal(null))
      .finally(() => {
        clearTimeout(timer);
        if (alive) setThinking(false);
      });
    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl.abort();
    };
    // 発言が変わったときだけ、聞き直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, statementForAgent]);

  // 話して入力：録音して、Google Cloud の Speech-to-Text で文字に直す。音声は保存しない。
  // 録音が使えない環境では、ブラウザ標準の音声認識に切り替える。
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  // 声が入らなかった理由の種類だけを、サーバーに知らせる（内容・声は送らない）。原因をつかんで、直すため
  function reportVoice(reason: string) {
    void fetch("/api/voice-report", { method: "POST", body: JSON.stringify({ reason }) }).catch(() => {});
  }

  function stopRecording() {
    const mr = recorder.current;
    if (mr && mr.state !== "inactive") mr.stop();
    rec.current?.stop();
  }

  function startWebSpeech() {
    const r = getRecognition();
    if (!r) {
      setVoiceError("このブラウザでは、話して入力が使えません。文字で書いてください。");
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

  async function toggleVoice() {
    setVoiceError(null);
    if (listening) {
      stopRecording();
      return;
    }
    if (transcribing) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      startWebSpeech();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // ブラウザごとに録れる形式が違う（Chrome は webm、Safari・iPhone は mp4）。使える形式を、先に選ぶ
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((m) =>
        typeof MediaRecorder.isTypeSupported === "function" ? MediaRecorder.isTypeSupported(m) : false,
      );
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      // 音が入っているかを、画面で見せる（マイクの許可はあるのに、音が入らない端末を、すぐ見分けるため）
      let peak = 0;
      let meterTimer: ReturnType<typeof setInterval> | null = null;
      let meterCtx: AudioContext | null = null;
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          meterCtx = new AC();
          void meterCtx.resume();
          const an = meterCtx.createAnalyser();
          an.fftSize = 512;
          meterCtx.createMediaStreamSource(stream).connect(an);
          const buf = new Uint8Array(an.fftSize);
          meterTimer = setInterval(() => {
            an.getByteTimeDomainData(buf);
            let m = 0;
            for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128) / 128);
            peak = Math.max(peak, m);
            setMicLevel(m);
          }, 100);
        }
      } catch {
        /* 音量表示が出せなくても、録音は続ける */
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (stopTimer.current) clearTimeout(stopTimer.current);
        if (meterTimer) clearInterval(meterTimer);
        if (meterCtx) void meterCtx.close();
        setMicLevel(0);
        setListening(false);
        const blob = new Blob(chunks.current, { type: mr.mimeType });
        chunks.current = [];
        if (blob.size === 0) {
          reportVoice("no_data");
          setVoiceError("録音が空でした。マイクの許可と、ほかのアプリでマイクが使われていないかを確かめて、もう一度お試しください。文字で書くこともできます。");
          return;
        }
        if (meterCtx && peak < 0.02) {
          reportVoice("silent");
          setVoiceError("ほとんど音が入っていませんでした。マイクのミュートや、Bluetooth のイヤホンの接続を確かめて、もう一度お試しください。文字で書くこともできます。");
          return;
        }
        setTranscribing(true);
        try {
          const { base64 } = await blobTo16kPcmBase64(blob).catch((e) => {
            reportVoice("decode_fail");
            throw e;
          });
          const r = await fetch("/api/stt", { method: "POST", body: JSON.stringify({ audio: base64 }) });
          const j = (await r.json().catch(() => ({}))) as { text?: string; error?: string };
          if (!r.ok) {
            reportVoice("stt_fail");
            throw new Error(j.error ?? "stt");
          }
          if (j.text) setText((prev) => prev + j.text);
          else setVoiceError("うまく聞き取れませんでした。もう一度、ゆっくり話してみてください。");
        } catch {
          setVoiceError("文字に直せませんでした。もう一度お試しいただくか、文字で書いてください。");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.current = mr;
      setVoiceUsed(true);
      setListening(true);
      mr.start(250);
      stopTimer.current = setTimeout(() => {
        if (mr.state !== "inactive") mr.stop();
      }, STT_MAX_SECONDS * 1000);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      reportVoice(name === "NotAllowedError" || name === "SecurityError" ? "permission" : name === "NotFoundError" ? "no_mic" : "mic_error");
      if (inApp) {
        setVoiceError("このアプリの中では、マイクが使えないようです。下の「このページの URL をコピー」を押して、Safari や Chrome で開き直してください。文字で書くこともできます。");
      } else if (name === "NotAllowedError" || name === "SecurityError") {
        setVoiceError("マイクが許可されていません。ブラウザのアドレス欄の鍵（またはスマホの「設定」→ ブラウザ → マイク）で、許可に変えてください。文字で書くこともできます。");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setVoiceError("マイクが見つかりませんでした。文字で書いてください。");
      } else if (name === "NotReadableError") {
        setVoiceError("マイクを、ほかのアプリが使っているようです。そのアプリを閉じてから、もう一度お試しください。文字で書くこともできます。");
      } else {
        setVoiceError("マイクが使えませんでした。文字で書くこともできます。");
      }
    }
  }

  async function copyPageUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 3000);
    } catch {
      setVoiceError("コピーできませんでした。画面の右上のメニューから、「ブラウザで開く」を選んでください。");
    }
  }

  function submitStatement() {
    stopRecording();
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
  function sync(field: FieldKey, nextPicks: string[], nextOwn: string) {
    if (!card) return;
    setPicks((p) => ({ ...p, [field]: nextPicks }));
    setOwn((o) => ({ ...o, [field]: nextOwn }));
    const joined = joinItems([...nextPicks, nextOwn]);
    if (!joined) {
      setCard(clearField(card, field));
      return;
    }
    setCard(setField(card, field, joined, nextOwn.trim() ? "own_words" : "chosen_from_suggestion"));
  }

  function togglePick(field: FieldKey, value: string) {
    const cur = picks[field];
    sync(field, cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value], own[field]);
  }

  function toggleScope(k: FieldKey) {
    if (!card) return;
    const next = card.shareScope.includes(k) ? card.shareScope.filter((x) => x !== k) : [...card.shareScope, k];
    setCard(setShareScope(card, next));
  }

  function confirmNow() {
    setSealing(true);
    setTimeout(() => {
      setSealing(false);
      setStep("scope");
    }, 1100);
  }

  function restart() {
    track("restart");
    setLink(null);
    setMineLink(null);
    setShowLink(null);
    setProof(null);
    setCard(null);
    setPicks({ when: [], where: [], what: [], help: [] });
    setOwn({ when: "", where: "", what: "", help: "" });
    setText("");
    setNotice(null);
    setCopyOpen(false);
    setStep("welcome");
  }

  const today = new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  const stepIdx = STEP_INDEX[step];

  /* ---------------- ようこそ ---------------- */
  if (step === "welcome") {
    return (
      <>
      {trial && <TrialBanner />}
      <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-6">
        <div className="anim-fade-up">
          <img src="/story/veranda.jpg" alt="夕日の縁側。朱印のついた手帳と、湯気の立つお茶" width={1200} height={675} className="h-auto w-full rounded-3xl shadow-soft" />
          <h1 className="mt-8 text-[2.6rem] font-bold leading-tight tracking-tight text-ink">
            Engawa
            <span className="ml-2 text-2xl font-semibold text-wood">縁側</span>
          </h1>
          <p className="mt-3 text-[1.2rem] font-semibold leading-9 text-ink [word-break:auto-phrase] min-[360px]:text-[1.35rem]">
            困りごとを、あなたの言葉のまま
            <br />
            持ち歩ける手帳。
          </p>
          <p className="mt-2 text-base leading-8 text-muted text-balance [word-break:auto-phrase]">窓口が変わっても、同じ話を一から説明し直さなくて済むように。</p>
        </div>

        <div className="anim-fade-up mt-8 [animation-delay:120ms]">
          <StoryHero />
        </div>

        <div className="anim-fade-up mt-8 [animation-delay:200ms]">
          <button
            type="button"
            onClick={() => {
              track("start");
              setStep("write");
            }}
            className={buttonClass("primary", "w-full min-h-16 text-xl")}
          >
            {restored ? "書きかけの続きから" : "はじめる"}
            <IconArrow className="h-6 w-6" />
          </button>
          {restored && (
            <p className="mt-3 text-center text-sm text-muted">
              書きかけが、残っています。
              <button
                type="button"
                className="ml-1 inline-flex min-h-11 items-center underline underline-offset-4"
                onClick={() => {
                  setText("");
                  setPicks({ when: [], where: [], what: [], help: [] });
                  setOwn({ when: "", where: "", what: "", help: "" });
                  setRestored(false);
                }}
              >
                消して、はじめから
              </button>
            </p>
          )}
          <ul className="mt-6 space-y-3">
            {[
              { icon: <IconShield className="h-6 w-6" />, t: "診断や評価はしません", d: "あなたの言葉を、そのまま整えるだけです。" },
              { icon: <IconEye className="h-6 w-6" />, t: "見せる範囲は、あなたが決めます", d: "選んだ項目だけが、窓口に見えます。" },
              { icon: <IconUndo className="h-6 w-6" />, t: "いつでも取り下げられます", d: "誰が見たかも、あなたに分かります。" },
            ].map((x) => (
              <li key={x.t} className="flex items-start gap-4 rounded-2xl bg-paper-2 p-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-wood">{x.icon}</span>
                <span>
                  <span className="block text-base font-semibold">{x.t}</span>
                  <span className="block text-sm leading-6 text-muted">{x.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <details className="mt-4 rounded-2xl border border-line bg-paper p-4 text-sm leading-7">
            <summary className="cursor-pointer select-none text-base font-semibold">あなたの情報は、どうなりますか？</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
              <li>手帳の本文は、30日で自動的に消えます。「取り下げ」を押すと、すぐ消えます。</li>
              <li>名前や住所などの基本情報は、あなたの端末の中にだけ残ります。</li>
              <li>窓口に見せる範囲は、あなたが選びます。リンクを知っている人は見られるので、渡す相手に、気をつけてください。</li>
              <li>運営者は、技術的には、保存された手帳にアクセスできる立場にあります。ログには、本文を入れていません。</li>
              <li>現時点で、実在の機関への提供や、提携はありません。</li>
            </ul>
            <p className="mt-3">
              <Link href="/privacy" className="underline underline-offset-4">くわしくは、「個人情報の扱い」へ</Link>
            </p>
          </details>
          <div className="mt-6 rounded-2xl border-2 border-wood bg-paper p-4 text-center">
            <p className="text-base font-semibold">窓口・支援者の方は、こちら</p>
            <Link href="/for-windows" className={buttonClass("quiet", "mt-3 w-full")}>
              窓口の方へ（ログイン）
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/how" className="inline-flex min-h-11 items-center underline underline-offset-4">
              仕組みの中身を見る
            </Link>
            <span aria-hidden className="mx-3">／</span>
            <Link href="/for-windows" className="inline-flex min-h-11 items-center underline underline-offset-4">
              窓口の方へ
            </Link>
            <span aria-hidden className="mx-3">／</span>
            <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4">
              個人情報の扱い
            </Link>
            <span aria-hidden className="mx-3">／</span>
            <Link href="/about" className="inline-flex min-h-11 items-center underline underline-offset-4">
              運営者・著作権
            </Link>
            <span aria-hidden className="mx-3">／</span>
            <LangSwitch />
          </p>
        </div>
      </div>
      </>
    );
  }

  /* ---------------- 完成 ---------------- */
  if (step === "done" && card) {
    const fields = selectedFields(card, true);
    return (
      <>
      {trial && <TrialBanner />}
      <div className="mx-auto w-full max-w-xl px-5 pb-44 pt-8">
        <div className="print:hidden">
          <div className="anim-fade-up text-center">
            <Celebrate />
            <h1 className="mt-4 text-3xl font-bold">手帳ができました</h1>
            <p className="mt-2 text-base leading-8 text-muted">
              ここまで書いてくださって、ありがとうございます。これで完成です。
              <br />
              あなたの言葉のまま、窓口に見せられます。
              <br />
              受け取るかどうかは、窓口によります。
            </p>
          </div>

          <div className="mt-8">
            <HandbookCard
              statement={card.statement}
              fields={fields}
              animateIn
              animateStamp
              stampDate={today}
              cover={cover}
            />
            <div className="mt-3 text-center">
              <Button variant="ghost" className="min-h-11 text-base" onClick={() => setCoverOpen((v) => !v)} aria-expanded={coverOpen}>
                {coverOpen ? "カバーを閉じる" : "カバーを変える"}
              </Button>
            </div>
            {coverOpen && (
              <div className="mt-2">
                <CoverPicker />
              </div>
            )}
          </div>

          {shareError && (
            <div className="mt-4">
              <Notice tone="warn" role="alert">
                <p>{shareError}</p>
                <Button
                  variant="quiet"
                  className="mt-3 w-full"
                  disabled={retrying}
                  onClick={async () => {
                    setRetrying(true);
                    await publish(card);
                    setRetrying(false);
                  }}
                >
                  {retrying ? "送っています…" : "もう一度、試す"}
                </Button>
              </Notice>
            </div>
          )}

          <h2 className="mt-10 text-lg font-bold text-ink">ほかの渡し方</h2>
          <ul className="mt-3 space-y-3">
            <li className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper-2 text-wood">
                  <IconPaper className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">紙にして持っていく</p>
                  <p className="text-sm leading-6 text-muted">日時・照合コード・QRつき。窓口の準備は要りません。</p>
                </div>
              </div>
              <Button variant="quiet" className="mt-3 w-full" onClick={() => {
                  track("share_print");
                  window.print();
                }}>
                <IconPrint className="h-5 w-5" />
                印刷する（紙・PDF）
              </Button>
            </li>

            <li className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper-2 text-wood">
                  <IconCopy className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">窓口の用紙に書き写す</p>
                  <p className="text-sm leading-6 text-muted">項目ごとにコピーして、貼り付けや書き写しに使えます。</p>
                </div>
              </div>
              <Button variant="quiet" className="mt-3 w-full" onClick={() => setCopyOpen((v) => !v)} aria-expanded={copyOpen}>
                {copyOpen ? "閉じる" : "項目ごとのコピーを開く"}
              </Button>
              {copyOpen && (
                <ul className="mt-3 space-y-2">
                  {[
                    { k: "statement", label: "あなたの言葉", v: card.statement },
                    ...FIELD_KEYS.filter((k) => card.fields[k] && card.shareScope.includes(k)).map((k) => ({
                      k,
                      label: FIELD_LABEL[k],
                      v: card.fields[k]?.value ?? "",
                    })),
                  ].map((row) => (
                    <li key={row.k} className="flex items-start justify-between gap-3 rounded-xl bg-paper-2 p-3">
                      <span className="text-base leading-7">
                        <span className="block text-xs text-muted">{row.label}</span>
                        {row.v}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(row.k, row.v)}
                        className="shrink-0 rounded-full border-2 border-wood/40 px-3 py-1 text-sm font-semibold text-wood-dark hover:bg-paper"
                      >
                        {copied === row.k ? "コピーしました" : "コピー"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {link && (
              <li className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper-2 text-wood">
                    <IconLink className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">窓口に画面で見てもらう（リンク）</p>
                    <p className="text-sm leading-6 text-muted">窓口は、ログインして、あなたが選んだ範囲だけを見ます。</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="quiet" className="flex-1" onClick={() => copy("window", link)}>
                    {copied === "window" ? "コピーしました" : "リンクをコピー"}
                  </Button>
                  <a href={new URL(link).pathname} className={buttonClass("quiet", "flex-1")}>
                    開く
                  </a>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">このリンクは、他の人には見せないでください。</p>
              </li>
            )}

            {mineLink && (
              <li className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper-2 text-wood">
                    <IconEye className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">誰が見たかを確かめる・取り下げる</p>
                    <p className="text-sm leading-6 text-muted">あなただけのページです。ブックマークしておくと安心です。</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={new URL(mineLink).pathname} className={buttonClass("quiet", "flex-1")}>
                    記録のページを開く
                  </a>
                  <Button variant="quiet" className="flex-1" onClick={() => copy("mine", mineLink)}>
                    {copied === "mine" ? "コピーしました" : "リンクをコピー"}
                  </Button>
                </div>
              </li>
            )}
          </ul>

          <FindWindows whats={picks.what} helps={picks.help} />

          <h2 className="mt-10 text-lg font-bold text-ink">あとからでも、だいじょうぶ（任意）</h2>
          <div className="mt-4 rounded-3xl border border-line bg-paper-2 p-5">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between text-left text-lg font-bold"
              aria-expanded={prepOpen}
              onClick={() => setPrepOpen((v) => !v)}
            >
              窓口に行く前に
              <span aria-hidden className="text-wood">{prepOpen ? "閉じる" : "見る"}</span>
            </button>
            {prepOpen && (
              <div className="mt-3 text-base leading-8">
                <p className="text-sm leading-7 text-muted">窓口によって、ちがいます。行く前に、電話か公式ページで、聞いてください。</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-6">
                  <li>この手帳（スマホの画面か、紙）</li>
                  <li>本人だと分かるもの（免許証、保険証、パスポートなど）</li>
                  <li>住所が分かるもの（公共料金の通知など）</li>
                  <li>相談に関係する書類</li>
                  <li>印鑑（いる窓口もあります）</li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8">
            <ProfileEditor />
          </div>

          {trial && (
            <div className="mt-10 rounded-3xl border border-sun/70 bg-[#fff3d1] p-5 text-center">
              <p className="font-semibold">試用に、ご協力ありがとうございます。</p>
              <p className="mt-1 text-sm leading-7 text-muted">感想を、1枚の採点（2分）で教えてください。</p>
              <a href="/rate" className={buttonClass("primary", "mt-4 w-full")}>
                採点する（1枚）
              </a>
            </div>
          )}
          {link && (
            <section aria-labelledby="try-window" className="mt-10 rounded-3xl border-2 border-wood bg-paper p-5 print:hidden">
              <h2 id="try-window" className="text-lg font-bold">窓口の側も、試してみる（デモ）</h2>
              <p className="mt-1 text-base leading-8">
                いま作った手帳を、<strong>窓口になって</strong>開きます。窓口では、このリンクを開いて、ログインします。
              </p>
              <a href={new URL(link).pathname} className={buttonClass("quiet", "mt-3 w-full")}>
                窓口として、この手帳を開く
              </a>
            </section>
          )}
          <div className="mt-12 border-t border-line pt-6 text-center">
            <p className="text-sm leading-7 text-muted">この手帳は、これで完成です。ちがう困りごとを書くときだけ、押してください。</p>
            <Button variant="ghost" className="mt-1" onClick={restart}>
              ちがう手帳を、新しく作る
            </Button>
          </div>
        </div>

        {showLink && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur print:hidden">
            <div className="mx-auto max-w-xl">
              <a href={new URL(showLink).pathname} onClick={() => track("share_show")} className={buttonClass("primary", "w-full min-h-16 text-xl")}>
                <IconPhone className="h-6 w-6" />
                窓口に画面を見せる
              </a>
            </div>
          </div>
        )}

        {/* 印刷用（画面には出ない） */}
        <div className="hidden print:block">
          <h1 className="text-2xl font-semibold">困りごとの手帳（Engawa）</h1>
          <p className="mt-1 text-sm">これは、本人が自分の言葉で書いたものです。診断や評価ではありません。</p>
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
              <p>
                照合コード：<span className="font-mono">{proof.code}</span>
              </p>
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
      </>
    );
  }

  /* ---------------- 書く・質問・確認・見せ方 ---------------- */
  const askField = order[Math.min(qi, order.length - 1)];
  const fixed = followUpQuestions(createCard("tmp", "x", "text")).find((q) => q.field === askField)!;
  const useAi = proposal?.field === askField;
  const question = useAi && proposal ? proposal.question : fixed.question;
  const lastQuestion = qi >= order.length - 1;

  return (
    <>
    {trial && <TrialBanner />}
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={restart}
          className="inline-flex min-h-11 items-center text-lg font-bold tracking-tight text-wood-dark"
          aria-label="最初の画面にもどる"
        >
          <Mark className="mr-2 h-9 w-9" />
          Engawa <span className="ml-1.5 text-sm font-semibold text-wood">縁側</span>
        </button>
      </div>
      {stepIdx !== undefined && <StepDots steps={FLOW_STEPS} current={stepIdx} />}
      {(step === "write" || step === "ask" || step === "confirm" || step === "scope") && <StepArt step={step} field={step === "ask" ? askField : undefined} />}
      {step === "write" && <Guide>急がなくて、大丈夫ですよ。</Guide>}
      {step === "ask" && <Guide>答えたいものだけで、大丈夫です。</Guide>}
      {step === "confirm" && <Guide>違うところがあれば、直せます。</Guide>}
      {step === "scope" && <Guide>見せる範囲は、あなたが決めます。</Guide>}

      {notice && notice.verdict === "escalate" && (
        <div className="mb-6">
          <Notice tone="warn" role="alert">
            <p className="text-xl font-bold leading-8">あぶないときは、すぐ電話を</p>
            <EmergencyList items={notice.resources} />
          </Notice>
        </div>
      )}
      {notice && notice.verdict === "refuse" && (
        <div className="mb-6">
          <Notice tone="warn" role="alert">
            {notice.reasons
              .filter((r) => r !== "emergency")
              .map((r) => (
                <p key={r}>{REFUSAL_MESSAGES[r as keyof typeof REFUSAL_MESSAGES]}</p>
              ))}
          </Notice>
        </div>
      )}

      {step === "write" && (
        <div className="anim-fade-up">
          <h1 className="text-3xl font-bold leading-snug">いま、困っていること</h1>
          <p className="mt-2 text-base leading-8 text-muted">
            うまく書けなくても大丈夫です。一言でも、話すだけでも構いません。
          </p>
          <label htmlFor="statement" className="sr-only">
            困っていること
          </label>
          <textarea
            id="statement"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="たとえば「家族の具合が悪くて、言葉が出ない」"
            className="mt-5 w-full resize-none rounded-3xl border-2 border-line bg-white p-5 text-xl leading-9 text-ink shadow-soft placeholder:text-muted/50 focus:border-wood focus:outline-none"
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={toggleVoice}
              aria-pressed={listening}
              disabled={transcribing}
              className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                listening ? "anim-ring border-warn bg-warn text-paper" : "border-wood/45 bg-paper text-wood hover:bg-paper-2"
              } focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-wood`}
              aria-label={listening ? "話すのをやめる" : "話して入力する"}
            >
              <IconMic className="h-7 w-7" />
            </button>
            <div className="min-h-12 flex-1">
              {listening ? (
                <div className="flex items-center gap-3" aria-live="polite">
                  <span className="anim-wave inline-flex h-7 items-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="block h-7 w-1.5 origin-center rounded-full bg-warn" />
                    ))}
                  </span>
                  <span className="text-base font-semibold text-warn">聞いています。もう一度押すと止まります。</span>
                  <span className="ml-1 block h-2 w-16 overflow-hidden rounded-full bg-warn/20" role="img" aria-label={micLevel > 0.02 ? "マイクに音が入っています" : "マイクに音が入っていません"}>
                    <span className="block h-full rounded-full bg-warn transition-[width] duration-100" style={{ width: `${Math.min(100, Math.round(micLevel * 400))}%` }} />
                  </span>
                </div>
              ) : transcribing ? (
                <p className="text-base font-semibold leading-7 text-wood-dark" role="status" aria-live="polite">
                  文字に直しています…
                </p>
              ) : (
                <p className="text-base leading-7 text-muted">話して入力することもできます。（1回、55秒まで）</p>
              )}
            </div>
          </div>
          {inApp && !voiceError && (
            <p className="mt-3 text-sm leading-6 text-muted">
              ※ アプリの中で開いていると、「話して入力」が使えないことがあります。その場合は、Safari や Chrome で開くか、文字で書いてください。
            </p>
          )}
          {voiceError && (
            <div className="mt-3">
              <Notice tone="info" role="alert">
                {voiceError}
              </Notice>
              {inApp && (
                <button
                  type="button"
                  onClick={copyPageUrl}
                  className="mt-2 inline-flex min-h-11 items-center rounded-full border-2 border-wood/45 bg-paper px-4 text-sm font-semibold text-wood-dark"
                >
                  {urlCopied ? "コピーしました" : "このページの URL をコピー"}
                </button>
              )}
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted">
            <IconLock className="mt-1 h-4 w-4 shrink-0" />
            声は保存しません。文字に直した内容だけを使い、あとで直せます。書きかけは、この画面を閉じると消えます。お名前や連絡先は、書かなくて大丈夫です。
          </p>

          <div className="mt-8 flex gap-3">
            <Button variant="quiet" onClick={() => setStep("welcome")} aria-label="もどる">
              <IconBack className="h-5 w-5" />
            </Button>
            <Button className="flex-1" disabled={text.trim().length === 0} onClick={submitStatement}>
              次へ
              <IconArrow className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === "ask" && card && (
        <div className="anim-fade-up" key={askField}>
          <p className="text-sm font-medium text-muted" aria-live="polite">
            質問 {qi + 1} / {order.length}
          </p>
          <blockquote data-no-translate className="mt-3 rounded-2xl border-l-4 border-wood/60 bg-paper-2 p-4 text-base leading-8 text-ink">
            {card.statement}
          </blockquote>
          {thinking && qi === 0 && !proposal ? (
            <div className="mt-7" role="status" aria-live="polite">
              <div className="h-8 w-11/12 animate-pulse rounded-xl bg-paper-3" />
              <div className="mt-3 h-8 w-7/12 animate-pulse rounded-xl bg-paper-3" />
              <p className="mt-3 text-sm text-muted">質問を、考えています…</p>
            </div>
          ) : (
            <h1 className="mt-7 text-2xl font-bold leading-10">{question}</h1>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>いくつでも選べます。飛ばしても大丈夫です。</span>
            {useAi && proposal?.source === "gemini" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-wood-dark">
                <IconSpark className="h-3.5 w-3.5" />
                AI（Gemini）が選んだ質問
              </span>
            )}
          </p>

          {useAi && proposal && proposal.suggestions.length > 0 && (
            <div className="mt-5 rounded-2xl border border-wood/30 bg-paper p-4">
              <p className="text-sm font-medium text-wood-dark">あなたの言葉から。合っていれば、選んでください。</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {proposal.suggestions.map((sg) => (
                  <Chip key={sg.text} data-no-translate pressed={picks[sg.field].includes(sg.text)} onClick={() => togglePick(sg.field, sg.text)}>
                    「{sg.text}」
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            {fixed.options.map((o) => (
              <Chip key={o} pressed={picks[askField].includes(o)} onClick={() => togglePick(askField, o)}>
                {o}
              </Chip>
            ))}
            {askField === "what" &&
              (moreWhat || WHAT_MORE.some((o) => picks.what.includes(o))) &&
              WHAT_MORE.map((o) => (
                <Chip key={o} pressed={picks.what.includes(o)} onClick={() => togglePick("what", o)}>
                  {o}
                </Chip>
              ))}
          </div>
          {askField === "what" && picks.what.includes(SAFETY_OPTION) && <SafetyPanel />}
          {askField === "what" && WHAT_MORE.length > 0 && !moreWhat && !WHAT_MORE.some((o) => picks.what.includes(o)) && (
            <Button variant="ghost" className="mt-2 min-h-11 text-base" onClick={() => setMoreWhat(true)}>
              ほかにもあてはまるものを見る
            </Button>
          )}
          <input
            type="text"
            aria-label={`${FIELD_LABEL[askField]}（自分の言葉で）`}
            placeholder="自分の言葉で書く"
            value={own[askField]}
            onChange={(e) => sync(askField, picks[askField], e.target.value)}
            className="mt-5 w-full rounded-2xl border-2 border-line bg-white p-4 text-lg placeholder:text-muted/50 focus:border-wood focus:outline-none"
          />

          <div className="mt-8 flex gap-3">
            <Button variant="quiet" onClick={() => (qi === 0 ? setStep("write") : setQi(qi - 1))} aria-label="もどる">
              <IconBack className="h-5 w-5" />
            </Button>
            <Button className="flex-1" onClick={() => (lastQuestion ? setStep("confirm") : setQi(qi + 1))}>
              {lastQuestion ? "確認へ" : picks[askField].length || own[askField] ? "次へ" : "飛ばす"}
              <IconArrow className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && card && (
        <div className="anim-fade-up">
          <h1 className="text-3xl font-bold leading-snug">これで、合っていますか？</h1>
          <p className="mt-2 text-base leading-8 text-muted">
            あなたの言葉のまま、まとめました。違うところは、戻って直せます。
          </p>
          <div className="mt-6">
            <HandbookCard
              statement={card.statement}
              fields={selectedFields(card, false)}
              draft={!sealing}
              animateStamp={sealing}
              stampDate={today}
            />
          </div>
          <div className="mt-8">
            <HoldToSeal disabled={sealing} onConfirm={confirmNow} />
            <p className="mt-2 text-center text-sm leading-7 text-muted">合っていたら、ここを、長押ししてください。</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="quiet" disabled={sealing} onClick={confirmNow}>
              <IconCheck className="h-5 w-5" />
              ボタンで「合っている」
            </Button>
            <Button
              variant="ghost"
              disabled={sealing}
              onClick={() => {
                setQi(0);
                setStep("ask");
              }}
            >
              違う、直す
            </Button>
          </div>
        </div>
      )}

      {step === "scope" && card && (
        <div className="anim-fade-up">
          <h1 className="text-3xl font-bold leading-snug">窓口に見せる範囲を選んでください</h1>
          <p className="mt-2 text-base leading-8 text-muted">
            選んだ項目だけが、窓口に見えます。あとから取り下げることもできます。
          </p>

          {card.fields.what?.value.includes(SAFETY_OPTION) && (
            <div className="mt-4">
              <Notice tone="warn" role="status">
                <p className="font-semibold">書いたことは、画面や紙で、まわりの人に見えることがあります。</p>
                <p className="mt-1 text-sm leading-7">いっしょに住む人に見られるとあぶないときは、見せる範囲に入れないでください。</p>
              </Notice>
            </div>
          )}
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-4 rounded-2xl border border-line bg-paper-2 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-wood">
                <IconLock className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-xs text-muted">あなたの言葉</span>
                <span className="text-base font-semibold">必ず付きます</span>
              </span>
            </li>
            {DEFAULT_ORDER.filter((k) => card.fields[k]).map((k) => {
              const on = card.shareScope.includes(k);
              return (
                <li key={k}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      on ? "border-wood bg-paper shadow-soft" : "border-line bg-paper-2/60"
                    } has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-wood`}
                  >
                    <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggleScope(k)} />
                    <span
                      aria-hidden
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-wood text-paper" : "bg-paper text-muted"}`}
                    >
                      <FieldIcon field={k} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted">{FIELD_LABEL[k]}</span>
                      <span className={`block text-base leading-7 ${on ? "" : "text-muted"}`}>{card.fields[k]?.value}</span>
                    </span>
                    <EyeSwitch on={on} />
                  </label>
                </li>
              );
            })}
          </ul>

          <ScopeDots shown={card.shareScope.length} total={FIELD_KEYS.filter((k) => card.fields[k]).length} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="quiet"
              className="min-h-12 px-3 text-base"
              onClick={() => setCard(setShareScope(card, FIELD_KEYS.filter((k) => card.fields[k])))}
            >
              すべて見せる
            </Button>
            <Button variant="quiet" className="min-h-12 px-3 text-base" onClick={() => setCard(setShareScope(card, []))}>
              すべて見せない
            </Button>
          </div>

          <p className="mt-8 flex items-center gap-2 text-base font-bold text-ink">
            <IconEye className="h-5 w-5 text-wood" />
            窓口には、こう見えます
          </p>
          <div className="mt-2">
            <HandbookCard
              statement={card.statement}
              fields={selectedFields(card, true)}
              stamp={false}
              draft
            />
            {FIELD_KEYS.some((k) => card.fields[k] && !card.shareScope.includes(k)) && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <IconLock className="h-4 w-4" />
                見えない項目：
                {FIELD_KEYS.filter((k) => card.fields[k] && !card.shareScope.includes(k)).map((k) => (
                  <span key={k} className="rounded-full bg-paper-3 px-3 py-1 font-semibold">
                    {FIELD_LABEL[k]}
                  </span>
                ))}
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="quiet" onClick={() => setStep("confirm")} aria-label="もどる">
              <IconBack className="h-5 w-5" />
            </Button>
            <Button
              className="flex-1"
              disabled={card.shareScope.length === 0}
              onClick={() => {
                const c = confirmCard(card);
                setCard(c);
                setStep("done");
                void publish(c);
              }}
            >
              手帳を作る
              <IconArrow className="h-5 w-5" />
            </Button>
          </div>
          {card.shareScope.length === 0 && (
            <p className="mt-3 text-sm leading-6 text-muted">1つ以上選ぶと、進めます。選ばないままだと、何も渡りません。</p>
          )}
        </div>
      )}
    </div>
    </>
  );
}
