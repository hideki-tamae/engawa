"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit-chain";
import type { SharedView } from "@/lib/handoff";

const LABEL: Record<string, string> = {
  what: "どんなこと",
  when: "いつ頃",
  where: "どこで",
  help: "してほしいこと",
};
const EVENT: Record<string, string> = {
  card_created: "カードができた",
  shared: "本人が共有した",
  read_back: "窓口が開いた",
  confirmed: "本人が「合っている」と確認した",
  corrected: "本人が「違う」と言った（訂正）",
  handoff: "次の窓口へ引き継いだ",
  withdrawn: "本人が取り下げた",
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

export default function WindowView({ token }: { token: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState(NEXT[0]);
  const [needLogin, setNeedLogin] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        setError(e.message === "withdrawn" ? "本人が取り下げたため、表示できません。" : "カードが見つかりません。"),
      );
  }

  useEffect(load, [token]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError(null);
    const r = await fetch("/api/window-login", {
      method: "POST",
      body: JSON.stringify({ user, password }),
    });
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
    const r = await fetch(`/api/cards/${token}`, {
      method: "POST",
      body: JSON.stringify({ action, to }),
    });
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
    const lines = ["【本人から預かったカード（Engawa）】", "※ 本人の言葉です。診断や評価ではありません。", "", `本人の言葉：${data.view.statement}`];
    for (const [k, f] of Object.entries(data.view.fields)) lines.push(`${LABEL[k]}：${f?.value}`);
    lines.push("", `取得日時：${new Date().toLocaleString("ja-JP")}`);
    return lines.join("\n");
  }

  const btn = "rounded-full border border-[#7a5a2f]/50 px-5 py-2 text-base hover:bg-[#7a5a2f]/10";

  if (needLogin) {
    return (
      <form onSubmit={login} className="mx-auto w-full max-w-sm px-5 py-10 text-[#2d2418]">
        <h1 className="text-2xl font-semibold">窓口のログイン</h1>
        <div className="mt-3 rounded-2xl bg-[#f3ead9] p-4 text-sm leading-6 text-[#4a3a22]">
          <p className="font-medium">この画面は、相談を受ける側（窓口・支援者）のものです。</p>
          <p className="mt-1">
            困っている本人がカードを作ると、窓口に見せるためのリンクができます。そのリンクを窓口が開くと、ここに来ます。
            本人の画面ではありません。
          </p>
          <p className="mt-2">
            デモ版です。窓口名は「窓口A」か「窓口B」。パスワードは提出資料に書いてあります。現時点では、実在の機関との提携や連携はありません。
          </p>
        </div>
        <label className="mt-5 block text-base">
          窓口名
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-[#7a5a2f]/40 bg-white p-3"
          />
        </label>
        <label className="mt-4 block text-base">
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-[#7a5a2f]/40 bg-white p-3"
          />
        </label>
        {loginError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-base">
            {loginError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !user || !password}
          className="mt-6 rounded-full bg-[#7a5a2f] px-6 py-3 text-lg font-medium text-white disabled:opacity-40"
        >
          {busy ? "確認しています…" : "ログイン"}
        </button>
      </form>
    );
  }

  if (error && !data) return <p className="mx-auto max-w-xl p-6 text-lg">{error}</p>;
  if (!data) return <p className="mx-auto max-w-xl p-6">読み込み中…</p>;

  return (
    <section className="mx-auto w-full max-w-xl px-5 py-10 text-[#2d2418]">
      <h1 className="text-2xl font-semibold">窓口：本人から預かったカード</h1>
      <p className="mt-2 text-sm text-[#5b4a33]">
        本人が選んだ範囲だけを表示しています。診断や評価の欄はありません。
      </p>
      <dl className="mt-5 space-y-4 rounded-2xl bg-[#f3ead9] p-5">
        <div>
          <dt className="text-sm text-[#5b4a33]">本人の言葉</dt>
          <dd className="mt-1 text-lg leading-8">{data.view.statement}</dd>
        </div>
        {Object.entries(data.view.fields).map(([k, f]) => (
          <div key={k}>
            <dt className="text-sm text-[#5b4a33]">{LABEL[k]}</dt>
            <dd className="mt-1 text-lg">{f?.value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        className="mt-3 rounded-full border border-[#7a5a2f]/50 px-5 py-2 text-base hover:bg-[#7a5a2f]/10"
        onClick={() => void navigator.clipboard.writeText(recordText())}
      >
        記録用にコピー（文字）
      </button>
      <p className="mt-1 text-xs text-[#5b4a33]">窓口の記録システムや用紙に、貼り付けて使えます。</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-base">
          {error}
        </p>
      )}

      <h2 className="mt-8 text-lg font-medium">本人に、読み返してください</h2>
      <p className="text-sm text-[#5b4a33]">
        上の内容を声に出して読み、本人の返事を記録します。
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className={btn} onClick={() => act("confirmed")}>
          本人：合っている
        </button>
        <button type="button" className={btn} onClick={() => act("corrected")}>
          本人：違う（訂正する）
        </button>
      </div>

      <h2 className="mt-8 text-lg font-medium">次の相談先へ引き継ぐ</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="引き継ぎ先"
          className="rounded-xl border border-[#7a5a2f]/40 bg-white p-2 text-base"
        >
          {NEXT.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <button type="button" className={btn} onClick={() => act("handoff")}>
          引き継ぐ
        </button>
      </div>
      <p className="mt-2 text-sm text-[#5b4a33]">
        ※ 窓口名は例です。現時点では、実在の窓口との提携や連携はありません。
      </p>

      <h2 className="mt-8 text-lg font-medium">経過の記録</h2>
      <p className="text-sm text-[#5b4a33]">
        記録の改ざん検知：{data.chain.ok ? "異常なし" : "異常あり"}（本文は記録に含みません）
      </p>
      <ol className="mt-2 space-y-1 text-base">
        {data.log.map((e) => (
          <li key={e.seq}>
            {e.seq + 1}. {EVENT[e.type] ?? e.type}
          </li>
        ))}
      </ol>
    </section>
  );
}
