"use client";

import Link from "next/link";
import { useState } from "react";
import { IconBack, IconBuilding, IconCheck } from "@/components/icons";
import { Button, Notice } from "@/components/ui";
import { extractToken } from "@/lib/token-link";

export default function WindowEntry() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError(null);
    const r = await fetch("/api/window-login", { method: "POST", body: JSON.stringify({ user, password }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setPassword("");
      setLoggedIn(true);
      return;
    }
    setLoginError(
      r?.status === 429
        ? "試行回数が多すぎます。しばらくしてから、もう一度お試しください。"
        : "窓口名かパスワードが違います。",
    );
  }

  function open(e: React.FormEvent) {
    e.preventDefault();
    const t = extractToken(link);
    if (!t) return setLinkError(true);
    window.location.href = `/window/${t}`;
  }

  const input = "mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-3.5 text-base focus:border-wood focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-8">
      <Link href="/for-windows" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wood-dark underline-offset-4 hover:underline">
        <IconBack className="h-4 w-4" />
        窓口の方へ
      </Link>
      <span className="mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-wood text-paper shadow-soft">
        <IconBuilding className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-3xl font-bold">窓口の入口</h1>
      <p className="mt-2 text-base leading-8">ログインして、本人から受け取ったリンクを開きます。</p>

      <section className="mt-6 rounded-3xl border border-line bg-paper p-5 shadow-soft" aria-labelledby="s1">
        <h2 id="s1" className="flex items-center gap-3 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-wood text-base text-paper" aria-hidden>1</span>
          ログイン
        </h2>
        {loggedIn ? (
          <p className="mt-3 flex items-center gap-2 text-base font-semibold text-ok" role="status">
            <IconCheck className="h-6 w-6" />ログインしました（8時間）
          </p>
        ) : (
          <form onSubmit={login} className="mt-3">
            <label htmlFor="u" className="block text-base font-semibold">窓口名</label>
            <input id="u" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" required className={input} />
            <label htmlFor="p" className="mt-4 block text-base font-semibold">パスワード</label>
            <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={input} />
            {loginError && (
              <div className="mt-4">
                <Notice tone="warn" role="alert">{loginError}</Notice>
              </div>
            )}
            <Button type="submit" className="mt-5 w-full" disabled={busy || !user || !password}>
              {busy ? "確認しています…" : "ログイン"}
            </Button>
            <p className="mt-3 text-xs leading-6 text-muted">ログインの情報は、試用の窓口にだけお渡ししています。</p>
          </form>
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-line bg-paper p-5 shadow-soft" aria-labelledby="s2">
        <h2 id="s2" className="flex items-center gap-3 text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-wood text-base text-paper" aria-hidden>2</span>
          本人から受け取ったリンクを開く
        </h2>
        <form onSubmit={open} className="mt-3">
          <label htmlFor="l" className="block text-base font-semibold">リンクを貼り付ける</label>
          <input id="l" value={link} onChange={(e) => { setLink(e.target.value); setLinkError(false); }} placeholder="https://…/window/…" className={input} />
          {linkError && (
            <div className="mt-4">
              <Notice tone="warn" role="alert">リンクの形が違うようです。本人の画面の「リンクをコピー」で取れるリンクを、貼ってください。</Notice>
            </div>
          )}
          <Button type="submit" className="mt-5 w-full" disabled={!link.trim()}>手帳を開く</Button>
        </form>
        <p className="mt-3 text-xs leading-6 text-muted">本人が画面か紙で見せた場合は、ログインなしで、そのまま読めます。</p>
      </section>
    </div>
  );
}
