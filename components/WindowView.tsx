"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit-chain";
import type { SharedView } from "@/lib/handoff";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FindWindows, { type Found } from "@/components/FindWindows";
import WindowMark from "@/components/WindowMark";
import HandbookCard from "@/components/HandbookCard";
import Timeline from "@/components/Timeline";
import { IconBuilding, IconCheck, IconCopy, IconEye, IconLock, IconSend, IconShield } from "@/components/icons";
import { Button, Notice, buttonClass } from "@/components/ui";
import { FINDER_HELPS, FINDER_WHATS, termsFrom } from "@/lib/finder";
import { PROFILE_FIELDS, type Profile, profileFromFragment } from "@/lib/profile";

const LABEL: Record<string, string> = {
  what: "どんなこと",
  when: "いつ頃",
  where: "どこで",
  help: "してほしいこと",
};

// 引き継ぎ先の例。行政だけでなく、医療・学校・支援団体にも使える（いずれも例であり、現時点では提携はない）
const NEXT = [
  "子ども家庭支援センター（行政の例）",
  "福祉事務所（行政の例）",
  "社会福祉協議会（福祉の例）",
  "精神保健福祉センター（行政の例）",
  "医療機関の相談室（医療の例）",
  "学校のスクールソーシャルワーカー（学校の例）",
  "支援団体・自助グループ（民間の例）",
];

interface Loaded {
  view: SharedView;
  log: AuditEntry[];
  chain: { ok: boolean };
}

function StepHead({ n, title, done, locked }: { n: number; title: string; done?: boolean; locked?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base font-bold ${
          done ? "bg-ok text-paper" : locked ? "bg-paper-3 text-muted" : "bg-wood text-paper"
        }`}
      >
        {done ? <IconCheck className="h-5 w-5" /> : locked ? <IconLock className="h-4 w-4" /> : n}
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}

export default function WindowView({ token }: { token: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [toUrl, setToUrl] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<"none" | "find" | "list">("none");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/window-login", { method: "DELETE" }).catch(() => null);
    router.push("/window");
  }
  const [custom, setCustom] = useState("");
  const [needLogin, setNeedLogin] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invite, setInvite] = useState<{ code: string; items: readonly string[] } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  function load() {
    fetch(`/api/cards/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (r.status === 401) {
          setNeedLogin(true);
          return;
        }
        if (!r.ok) throw new Error(j.error);
        setNeedLogin(false);
        setData(j);
      })
      .catch((e: Error) =>
        setError(e.message === "withdrawn" ? "本人が取り下げたため、表示できません。" : "手帳が見つかりません。"),
      );
  }

  useEffect(load, [token]);

  // QR で届いた、本人の基本情報（URL の # 以降）。この端末の中だけで読み、サーバーには送らない。読んだら、URL から消す。
  useEffect(() => {
    const p = profileFromFragment(window.location.hash);
    if (p) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(p);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError(null);
    const r = await fetch("/api/window-login", { method: "POST", body: JSON.stringify({ user, password }) });
    setBusy(false);
    if (!r.ok) {
      setLoginError(
        r.status === 429
          ? "試行回数が多すぎます。しばらくしてから、もう一度お試しください。"
          : "窓口名かパスワードが違います。デモ版では、窓口名は「窓口A」か「窓口B」です。",
      );
      return;
    }
    setLoginError(null);
    setPassword("");
    load();
  }

  async function act(action: string) {
    const r = await fetch(`/api/cards/${token}`, { method: "POST", body: JSON.stringify({ action, to }) });
    const j = await r.json();
    if (!r.ok) {
      setError(
        j.error === "person_not_confirmed_on_read_back"
          ? "本人に読み返して、「合っている」を確認してから、引き継げます。"
          : "操作できませんでした。",
      );
      return;
    }
    setError(null);
    setData((d) => (d ? { ...d, log: j.log, chain: j.chain } : d));
  }

  function recordText(): string {
    if (!data) return "";
    const lines = [
      "【本人から預かった手帳（Engawa）】",
      "※ 本人の言葉です。診断や評価ではありません。",
      "",
      `本人の言葉：${data.view.statement}`,
    ];
    for (const [k, f] of Object.entries(data.view.fields)) lines.push(`${LABEL[k]}：${f?.value}`);
    if (profile) {
      lines.push("", "【本人が見せた基本情報】");
      for (const f of PROFILE_FIELDS) if (profile[f.key]) lines.push(`${f.label}：${profile[f.key]}`);
    }
    lines.push("", `取得日時：${new Date().toLocaleString("ja-JP")}`);
    return lines.join("\n");
  }

  if (needLogin) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-10">
        <form onSubmit={login} className="anim-fade-up">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-wood text-paper shadow-soft">
            <IconBuilding className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-3xl font-bold">窓口のログイン</h1>
          <div className="mt-4">
            <Notice tone="info">
              <p className="font-semibold">この画面は、相談を受ける側（窓口・支援者）のものです。</p>
              <p className="mt-1 text-sm leading-7 text-muted">
                困っている本人が手帳を作ると、窓口に見せるためのリンクができます。そのリンクを窓口が開くと、ここに来ます。本人の画面ではありません。
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                デモ版です。窓口名は「窓口A」か「窓口B」。パスワードは提出資料に書いてあります。現時点では、実在の機関との提携や連携はありません。
              </p>
            </Notice>
          </div>
          <nav aria-label="ほかのページ" className="mt-4 flex flex-wrap gap-x-5 text-sm">
            <Link href="/for-windows" className="inline-flex min-h-11 items-center font-semibold text-wood-dark underline underline-offset-4">窓口の方へ</Link>
            <Link href="/window" className="inline-flex min-h-11 items-center font-semibold text-wood-dark underline underline-offset-4">手帳を受け取る</Link>
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-wood-dark underline underline-offset-4">最初の画面へ</Link>
          </nav>
          <label className="mt-6 block text-base font-semibold" htmlFor="u">
            窓口名
          </label>
          <input
            id="u"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-4 text-lg focus:border-wood focus:outline-none"
          />
          <label className="mt-5 block text-base font-semibold" htmlFor="p">
            パスワード
          </label>
          <input
            id="p"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-4 text-lg focus:border-wood focus:outline-none"
          />
          {loginError && (
            <div className="mt-4">
              <Notice tone="warn" role="alert">
                {loginError}
              </Notice>
            </div>
          )}
          <Button type="submit" className="mt-7 w-full" disabled={busy || !user || !password}>
            {busy ? "確認しています…" : "ログイン"}
          </Button>
        </form>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <Notice tone="info" role="alert">
          {error}
        </Notice>
      </div>
    );
  }
  if (!data) return <p className="mx-auto max-w-md px-5 py-16 text-muted">読み込んでいます…</p>;

  const confirmed = data.log.some((e) => e.type === "confirmed");
  const handedOff = data.log.some((e) => e.type === "handoff");

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2.5 text-sm font-semibold text-wood">
            <WindowMark />
            窓口
          </p>
          <h1 className="mt-1 text-3xl font-bold">本人から預かった手帳</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              data.chain.ok ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"
            }`}
          >
            <IconShield className="h-4 w-4" />
            記録の改ざん検知：{data.chain.ok ? "異常なし" : "異常あり"}
          </span>
          <Button variant="quiet" className="min-h-11 px-4 text-sm" onClick={logout}>
            ログアウト
          </Button>
        </div>
      </header>
      <p className="mt-2 text-base leading-7 text-muted">
        本人が選んだ範囲だけを表示しています。診断や評価の欄はありません。
      </p>
      {data.view.cardId.startsWith("sample-") && (
        <div className="mt-4">
          <Notice tone="info" role="status">
            これは、作り話の<strong>サンプル</strong>です。読む、確かめる、引き継ぐ、を、そのまま試せます。
          </Notice>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <HandbookCard statement={data.view.statement} fields={data.view.fields} stamp={confirmed} />
          {profile && (
            <section className="mt-4 rounded-3xl border-2 border-wood bg-paper p-5" aria-labelledby="prof-h">
              <h2 id="prof-h" className="flex items-center gap-2 text-lg font-bold">
                <IconLock className="h-5 w-5 text-wood" />
                本人が見せた基本情報
              </h2>
              <dl className="mt-3 space-y-2">
                {PROFILE_FIELDS.filter((f) => profile[f.key]).map((f) => (
                  <div key={f.key} className="rounded-2xl bg-paper-2 px-4 py-2.5">
                    <dt className="text-xs text-muted">{f.label}</dt>
                    <dd data-no-translate className="break-words text-base font-semibold">{profile[f.key]}</dd>
                  </div>
                ))}
              </dl>
              <Button
                variant="quiet"
                className="mt-3 w-full"
                onClick={() => {
                  const text = PROFILE_FIELDS.filter((f) => profile[f.key]).map((f) => `${f.label}：${profile[f.key]}`).join("\n");
                  void navigator.clipboard.writeText(text);
                  setProfileCopied(true);
                  setTimeout(() => setProfileCopied(false), 1600);
                }}
              >
                <IconCopy className="h-5 w-5" />
                {profileCopied ? "コピーしました" : "まとめてコピー"}
              </Button>
              <p className="mt-2 text-xs leading-6 text-muted">この端末の画面にだけ、表示しています。サーバーには、送っていません。ページを閉じると、消えます。</p>
            </section>
          )}
          <Button
            variant="quiet"
            className="mt-4 w-full"
            onClick={() => {
              void navigator.clipboard.writeText(recordText());
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          >
            <IconCopy className="h-5 w-5" />
            {copied ? "コピーしました" : "記録用にコピー（文字）"}
          </Button>
          <p className="mt-2 text-xs leading-5 text-muted">窓口の記録システムや用紙に、貼り付けて使えます。</p>
        </div>

        <div className="space-y-5">
          {error && (
            <Notice tone="warn" role="alert">
              {error}
            </Notice>
          )}

          <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <StepHead n={1} title="読む" done />
            <p className="mt-2 pl-12 text-sm leading-7 text-muted">手帳を、声に出して読んでください。</p>
          </section>

          <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft">
            <StepHead n={2} title="本人に確かめる" done={confirmed} />
            <p className="mt-2 pl-12 text-sm leading-7 text-muted">読み返して、本人の返事を記録します。</p>
            <div className="mt-4 flex flex-wrap gap-3 pl-12">
              <Button onClick={() => act("confirmed")} disabled={confirmed}>
                <IconCheck className="h-5 w-5" />
                {confirmed ? "確認済み" : "本人：合っている"}
              </Button>
              <Button variant="quiet" onClick={() => act("corrected")}>
                本人：違う（訂正する）
              </Button>
            </div>
          </section>

          <section className={`rounded-3xl border p-5 ${confirmed ? "border-line bg-paper shadow-soft" : "border-line bg-paper-2/60"}`}>
            <StepHead n={3} title="次の相談先へ引き継ぐ" done={handedOff} locked={!confirmed} />
            {confirmed ? (
              <div className="mt-4 space-y-3 pl-12">
                <div className="rounded-2xl border-2 border-line bg-paper-2/60 p-4" aria-live="polite">
                  <p className="text-xs text-muted">引き継ぎ先</p>
                  {to ? (
                    <>
                      <p className="mt-0.5 text-lg font-bold leading-7">{to}</p>
                      {toUrl && (
                        <a href={toUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-wood-dark underline underline-offset-4">
                          公式ページを開く
                          <span className="sr-only">（新しいタブで開きます）</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-base leading-7 text-muted">まだ決めていません。下から、選んでください。</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant={mode === "find" ? "primary" : "quiet"} className="min-h-12 px-3 text-base" onClick={() => setMode(mode === "find" ? "none" : "find")} aria-expanded={mode === "find"}>
                    相談先をさがす
                  </Button>
                  <Button variant={mode === "list" ? "primary" : "quiet"} className="min-h-12 px-3 text-base" onClick={() => setMode(mode === "list" ? "none" : "list")} aria-expanded={mode === "list"}>
                    一覧から選ぶ
                  </Button>
                </div>

                {mode === "find" && (
                  <FindWindows
                    embedded
                    audience="window"
                    whats={termsFrom(data.view.fields.what?.value, FINDER_WHATS)}
                    helps={termsFrom(data.view.fields.help?.value, FINDER_HELPS)}
                    pickedName={to}
                    onPick={(c: Found) => {
                      setTo(c.name);
                      setToUrl(c.verified ? c.url : undefined);
                    }}
                  />
                )}
                {mode === "list" && (
                  <div className="space-y-2">
                    <label className="sr-only" htmlFor="to">
                      引き継ぎ先
                    </label>
                    <select
                      id="to"
                      value={NEXT.includes(to) ? to : ""}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setToUrl(undefined);
                      }}
                      className="w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none"
                    >
                      <option value="" disabled>
                        例から選ぶ
                      </option>
                      {NEXT.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                    <label htmlFor="to-custom" className="block text-sm font-semibold">
                      ほかの窓口の名前
                    </label>
                    <input
                      id="to-custom"
                      value={custom}
                      maxLength={40}
                      onChange={(e) => {
                        setCustom(e.target.value);
                        setTo(e.target.value);
                        setToUrl(undefined);
                      }}
                      className="w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none"
                    />
                  </div>
                )}

                <Button onClick={() => act("handoff")} className="w-full" disabled={!to.trim()}>
                  <IconSend className="h-5 w-5" />
                  この相談先に、引き継ぐ
                </Button>
                <p className="text-xs leading-6 text-muted">次の窓口には、本人が選んだ範囲だけが、渡ります。</p>
              </div>
            ) : (
              <p className="mt-2 pl-12 text-sm leading-7 text-muted">本人が「合っている」と答えた後に、使えるようになります。</p>
            )}
            {handedOff && (
              <div className="mt-4 pl-12">
                <Notice tone="ok" role="status">
                  <p className="font-semibold">引き継ぎを記録しました。{to ? `（${to}）` : ""}</p>
                  <p className="mt-1 text-sm leading-7">
                    次の相談先には、本人から、画面か紙で渡してもらうのが基本です。窓口用の画面で見てもらう場合は、このページのリンクを、お渡しください。
                  </p>
                  <Button
                    variant="quiet"
                    className="mt-3 w-full"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 1600);
                    }}
                  >
                    <IconCopy className="h-5 w-5" />
                    {copiedLink ? "コピーしました" : "このページのリンクをコピー"}
                  </Button>
                  <div className="mt-4 rounded-2xl bg-paper p-4">
                    <p className="text-base font-bold">次の窓口に、招待コードを渡す</p>
                    <p className="mt-1 text-sm leading-7">受け取った窓口は、導入の初期設定の代行と、試行レポートが、無料になります。</p>
                    {!invite ? (
                      <Button
                        variant="quiet"
                        className="mt-3 w-full"
                        onClick={async () => {
                          const r = await fetch("/api/invite", { method: "POST" }).catch(() => null);
                          if (r?.ok) {
                            const j = await r.json();
                            setInvite({ code: j.code, items: j.offer.items });
                          }
                        }}
                      >
                        招待コードをつくる
                      </Button>
                    ) : (
                      <>
                        <p className="mt-3 select-all rounded-xl bg-paper-2 p-3 text-center font-mono text-2xl font-bold tracking-wider" aria-label="招待コード">
                          {invite.code}
                        </p>
                        <Button
                          variant="quiet"
                          className="mt-3 w-full"
                          onClick={() => {
                            void navigator.clipboard.writeText(
                              `Engawa の無料パイロットへの招待です。\n${window.location.origin}/for-windows?code=${invite.code}\n（招待コード: ${invite.code}）`,
                            );
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 1600);
                          }}
                        >
                          <IconCopy className="h-5 w-5" />
                          {inviteCopied ? "コピーしました" : "案内文をコピー"}
                        </Button>
                      </>
                    )}
                  </div>
                </Notice>
              </div>
            )}
            <p className="mt-3 pl-12 text-xs leading-5 text-muted">※ 引き継ぎ先は例です。現時点では、実在の機関との提携や連携はありません。</p>
          </section>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <IconEye className="h-5 w-5 text-wood" />
          経過の記録
        </h2>
        <p className="mt-1 text-sm text-muted">本文は、記録に含まれません。</p>
        <div className="mt-5">
          <Timeline log={data.log} mode="window" />
        </div>
      </section>

      <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="終わるとき">
        <Link href="/window" className={buttonClass("quiet", "w-full")}>
          別の手帳を開く
        </Link>
        <Button variant="ghost" className="w-full" onClick={logout}>
          ログアウトして、終わる
        </Button>
      </nav>
    </div>
  );
}
