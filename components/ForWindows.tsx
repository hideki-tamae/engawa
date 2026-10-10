"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBack, IconCheck, IconPaper, IconPhone, IconShield } from "@/components/icons";
import WindowsHero from "@/components/WindowsHero";
import { Button, Notice, buttonClass } from "@/components/ui";
import { ORG_KINDS } from "@/lib/pilot";
import { INVITE_OFFER } from "@/lib/promo";

const KIND_LABEL: Record<(typeof ORG_KINDS)[number], string> = {
  gov: "行政（市区町村・都道府県）",
  shakyo: "社会福祉協議会・福祉事務所",
  medical: "医療機関・訪問看護など",
  school: "学校・教育委員会",
  npo: "NPO・支援団体・民間",
  other: "その他",
};

const RECEIVE_STEPS = [
  { t: "画面か、紙を見る" },
  { t: "「合っていますか」と、本人に確かめる" },
  { t: "コピーして、記録や用紙に写す" },
  { t: "次の窓口へ、引き継ぐ" },
];

const POINTS = [
  { icon: <IconPhone className="h-6 w-6" />, t: "準備は、要りません", d: "アカウントも、連携も、いりません。" },
  { icon: <IconCheck className="h-6 w-6" />, t: "本人が確かめた言葉だけ", d: "本人が「合っている」と確認し、見せる範囲を選んだ内容だけが、届きます。" },
  { icon: <IconShield className="h-6 w-6" />, t: "診断や評価は、しません", d: "整理するのは、本人の言葉だけ。点数づけも、推測もしません。" },
  { icon: <IconPaper className="h-6 w-6" />, t: "書き写す手間を、減らす", d: "項目ごとのコピーと、紙（日時・照合コード付き）で、窓口の様式に写せます。" },
];

export default function ForWindows({ initialCode = "" }: { initialCode?: string }) {
  const [org, setOrg] = useState("");
  const [kind, setKind] = useState<string>("gov");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<{ invited: boolean; unknown: boolean } | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "pii" | "code">("idle");


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const r = await fetch("/api/pilot", {
      method: "POST",
      body: JSON.stringify({ org, kind, contactName, email, note, consent, code }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) {
      setResult({ invited: !!j.invited, unknown: !!j.codeGivenButUnknown });
      return setState("done");
    }
    setState(j.error === "note_pii" ? "pii" : j.error === "code_format" ? "code" : "error");
  }

  const [pilotOpen, setPilotOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  useEffect(() => {
    // 「無料パイロットに申し込む」から来たときは、開いておく
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#pilot") setPilotOpen(true);
    if (window.location.hash === "#receive") setReceiveOpen(true);
  }, []);

  const input = "mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-24 pt-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
        <IconBack className="h-4 w-4" />
        手帳にもどる
      </Link>
      <div className="mt-2">
        <WindowsHero />
      </div>
      <h1 className="mt-5 text-3xl font-bold leading-snug">窓口の方へ</h1>
      <p className="mt-3 text-lg leading-9 text-ink">
        相談に来た人が、<strong>自分の言葉のまま</strong>、困りごとを持ってきます。<br />
        同じ話を、最初から聞き直す手間を、減らせるかもしれません。
      </p>

      <section aria-labelledby="login-h" className="mt-6 rounded-3xl border-2 border-wood bg-paper p-5 shadow-soft">
        <h2 id="login-h" className="text-lg font-bold">試用の窓口の方（ログイン）</h2>
        <p className="mt-1 text-base leading-8 text-ink">
          ログインは、<strong>手帳を開いたときに</strong>出ます。まず、作り話のサンプルで、読む・確かめる・引き継ぐを試せます。
        </p>
        <Link href="/window/sample" className={buttonClass("primary", "mt-3 w-full")}>
          ログインして試す（サンプル）
        </Link>
      </section>

      <nav aria-label="このページの内容" className="mt-4">
        <Link href="/window" className={buttonClass("quiet", "w-full whitespace-nowrap")}>手帳を受け取る（リンク・QR）</Link>
        <p className="mt-2 flex flex-wrap justify-center gap-x-5 text-sm">
          <a href="#receive" onClick={() => setReceiveOpen(true)} className="inline-flex min-h-11 items-center font-semibold text-wood-dark underline underline-offset-4">
            受け取り方
          </a>
          <a href="#pilot" onClick={() => setPilotOpen(true)} className="inline-flex min-h-11 items-center font-semibold text-wood-dark underline underline-offset-4">
            無料パイロットの申し込み
          </a>
        </p>
      </nav>

      <details
        id="receive"
        open={receiveOpen}
        onToggle={(e) => setReceiveOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="mt-6 rounded-3xl border-2 border-wood bg-paper p-5 shadow-soft scroll-mt-6"
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-xl font-bold">
          手帳を受け取ったら（4つの手順）
          <span aria-hidden className="shrink-0 whitespace-nowrap text-sm font-normal text-muted">{receiveOpen ? "閉じる" : "開く"}</span>
        </summary>
        <p className="mt-4 text-base leading-8 text-ink">本人が、画面か紙で見せます。次の順で、受け取れます。</p>
        <ol className="mt-4 space-y-3">
          {RECEIVE_STEPS.map((st, i) => (
            <li key={st.t} className="flex items-center gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wood text-base font-bold text-paper" aria-hidden>{i + 1}</span>
              <span>
                <span className="block text-lg font-bold leading-8">{st.t}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-base leading-8">
          リンクは、<strong>本人が、手帳を作ったあと</strong>に出ます。メールが使えなくても、<strong>本人の画面の QR を読み取る</strong>だけで、受け取れます。
        </p>
        <div className="mt-6 rounded-2xl bg-paper-2 p-4">
          <p className="text-base font-bold">本人から「リンク」を受け取ったとき</p>
          <p className="mt-1 text-base leading-8">
            <Link href="/window" className="font-semibold underline underline-offset-4">受け取りのページ</Link>でリンクを貼って開くと、必要なときだけ<strong>ログイン</strong>が出ます。ログインすると、内容の確認・項目ごとのコピー・記録用のコピー・次の窓口への引き継ぎが、できます。
          </p>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted">
          ログインの情報は、試用の窓口にだけお渡ししています。
          <Link href="/how" className="ml-1 underline underline-offset-4">仕組みを見る</Link>
        </p>
      </details>

      <ul className="mt-6 space-y-3">
        {POINTS.map((p) => (
          <li key={p.t} className="flex items-start gap-4 rounded-2xl bg-paper-2 p-4">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-wood">{p.icon}</span>
            <span>
              <span className="block text-base font-semibold">{p.t}</span>
              <span className="block text-sm leading-7 text-muted">{p.d}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <Notice tone="info">
          <p className="font-semibold">正直に、お伝えします</p>
          <p className="mt-1 text-sm leading-7">
            Engawa は、試用の段階です。現時点では、実在の機関との提携や連携は、ありません。聞き直しが減るかは、これから、現場で測ります。
          </p>
        </Notice>
      </section>

      <details
        id="pilot"
        open={pilotOpen}
        onToggle={(e) => setPilotOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="mt-8 rounded-3xl border-2 border-line bg-paper p-5 scroll-mt-6"
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-lg font-bold">
          無料パイロットに、関心のある方へ
          <span aria-hidden className="shrink-0 whitespace-nowrap text-sm font-normal text-muted">{pilotOpen ? "閉じる" : "開く"}</span>
        </summary>
      <section className="mt-5 rounded-3xl border-2 border-wood bg-paper p-6 shadow-soft" aria-labelledby="offer-h">
        <h2 id="offer-h" className="text-xl font-bold">{INVITE_OFFER.title}</h2>
        <p className="mt-2 text-base leading-8">招待コードがあれば、次の内容で参加できます。</p>
        <ul className="mt-3 space-y-2">
          {INVITE_OFFER.items.map((t) => (
            <li key={t} className="flex items-start gap-3 text-base leading-8">
              <IconCheck className="mt-1.5 h-5 w-5 shrink-0 text-ok" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-7 text-muted">{INVITE_OFFER.note}</p>
      </section>

      <section className="mt-6" aria-labelledby="pilot-h">
        <h2 id="pilot-h" className="text-xl font-bold">無料のパイロットに、関心のある方へ</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          1拠点・数週間の、小さな試行からです。費用はかかりません。ご連絡先を、お残しください。
        </p>

        {state === "done" ? (
          <div className="anim-pop mt-5 rounded-3xl border border-ok/40 bg-ok-bg p-6 text-center" role="status">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok text-paper">
              <IconCheck className="h-7 w-7" />
            </span>
            <p className="mt-3 text-lg font-bold">受け付けました</p>
            <p className="mt-1 text-sm leading-7">担当から、ご連絡します。ご連絡先は、パイロットのご連絡のためだけに使い、180日で削除します。</p>
            {result?.invited && <p className="mt-2 text-sm font-semibold leading-7">招待コードを確認しました。上の特典の内容で、ご案内します。</p>}
            {result?.unknown && <p className="mt-2 text-sm leading-7 text-muted">招待コードは、確認できませんでした。申し込みは、受け付けています。</p>}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <label htmlFor="org" className="block text-base font-semibold">組織名</label>
            <input id="org" value={org} onChange={(e) => setOrg(e.target.value)} required maxLength={60} className={input} />

            <label htmlFor="kind" className="mt-4 block text-base font-semibold">種類</label>
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
              {ORG_KINDS.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>

            <label htmlFor="cname" className="mt-4 block text-base font-semibold">ご担当者名（任意）</label>
            <input id="cname" value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={40} autoComplete="name" className={input} />

            <label htmlFor="email" className="mt-4 block text-base font-semibold">メールアドレス</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} autoComplete="email" className={input} />

            <label htmlFor="note" className="mt-4 block text-base font-semibold">ひとこと（任意）</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} className={input} />
            <p className="mt-1 text-xs leading-6 text-muted">相談に来た方の情報は、書かないでください。</p>

            <label htmlFor="code" className="mt-4 block text-base font-semibold">招待コード（お持ちの方）</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} autoComplete="off" placeholder="EN-XXXX-XXXX" className={input} />

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-wood">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
              <span className="text-sm leading-7">
                入力した内容を、パイロットのご連絡のためだけに使うことに、同意します。ご連絡先は、180日で削除されます。
              </span>
            </label>

            {state === "code" && (
              <div className="mt-4">
                <Notice tone="warn" role="alert">招待コードの形が違うようです（例: EN-AB23-CD45）。確かめるか、空にして、もう一度送ってください。</Notice>
              </div>
            )}
            {state === "pii" && (
              <div className="mt-4">
                <Notice tone="warn" role="alert">ひとことに、電話番号などの個人情報があるようです。消してから、もう一度送ってください。</Notice>
              </div>
            )}
            {state === "error" && (
              <div className="mt-4">
                <Notice tone="warn" role="alert">送れませんでした。入力を確かめて、もう一度お試しください。</Notice>
              </div>
            )}
            <Button type="submit" className="mt-6 w-full" disabled={!consent || !org.trim() || !email.trim() || state === "sending"}>
              {state === "sending" ? "送っています…" : "申し込む"}
            </Button>
          </form>
        )}
      </section>
      </details>
      <nav className="mt-12 border-t border-line pt-6 text-center" aria-label="もどる">
        <Link href="/" className={buttonClass("quiet", "w-full")}>
          <IconBack className="h-5 w-5" />
          手帳にもどる
        </Link>
      </nav>
    </div>
  );
}
