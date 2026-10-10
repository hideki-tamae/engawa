"use client";

import { useEffect } from "react";

const JP = /[぀-ヿ㐀-鿿]/;
const KEY = "engawa_lang";
const CACHE_KEY = "engawa_en_cache_v3";
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
/** 訳さず、そのままにするもの（ロゴの印の「縁」） */
const FIXED: Record<string, string> = { 縁: "縁" };
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE"]);

/**
 * 英語版。URL に ?lang=en を付けると、画面の文字が、英語になる（デザインは同じ）。
 * 本人が書いた言葉（data-no-translate）は、翻訳しない。翻訳は機械翻訳（Gemini）。
 * 図（SVG）の中の文字は、はみ出さないよう、短い英語にする。
 */
export default function Translator() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("lang");
    try {
      if (q === "en" || q === "ja") localStorage.setItem(KEY, q);
    } catch {
      /* 何もしない */
    }
    let lang = q;
    if (!lang) {
      try {
        lang = localStorage.getItem(KEY);
      } catch {
        /* 何もしない */
      }
    }
    if (lang !== "en") return;

    document.documentElement.lang = "en";
    // 画面を、いったん隠す（読み込みの直後は、日本語が見えないように）。React の読み込みが終わってから、翻訳を始める
    const style0 = document.createElement("style");
    style0.textContent = "html[data-en-pending] body{opacity:0}";
    document.head.appendChild(style0);
    document.documentElement.setAttribute("data-en-pending", "");
    const hardReveal = window.setTimeout(() => document.documentElement.removeAttribute("data-en-pending"), 7000);
    let cleanup: (() => void) | undefined;
    const startTimer = window.setTimeout(() => {
      cleanup = begin();
    }, 1100);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(hardReveal);
      cleanup?.();
      document.documentElement.removeAttribute("data-en-pending");
      style0.remove();
    };
  }, []);

  return null;
}

function begin(): () => void {
  {
    const cache = new Map<string, string>(); // 鍵：日本語。図の中は、先頭に「s:」
    try {
      const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, string>;
      for (const [k, v] of Object.entries(saved)) cache.set(k, v);
    } catch {
      /* 何もしない */
    }
    const applied = new WeakMap<Node, string>();
    const attrApplied = new WeakMap<Element, Record<string, string>>();
    const pendingText = new Set<Text>();
    const pendingAttr = new Set<Element>();
    let timer: number | null = null;
    let first = true;
    let retries = 0;

    const reveal = () => document.documentElement.removeAttribute("data-en-pending");

    const skipped = (el: Element | null) => !!el && (SKIP_TAGS.has(el.tagName) || !!el.closest("[data-no-translate]"));
    const inSvg = (el: Element | null) => !!el && !!el.closest("svg");
    const keyOf = (text: string, svg: boolean) => (svg ? `s:${text}` : text);

    function collect(root: Node) {
      if (root.nodeType === Node.TEXT_NODE) {
        const t = root as Text;
        const v = t.nodeValue ?? "";
        if (JP.test(v) && v.trim().length >= 1 && !skipped(t.parentElement) && applied.get(t) !== v) pendingText.add(t);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const el = root as Element;
      if (el.closest("[data-no-translate]")) return;
      if (ATTRS.some((a) => JP.test(el.getAttribute(a) ?? ""))) pendingAttr.add(el);
      if (SKIP_TAGS.has(el.tagName)) return; // 入力欄の中身は、触らない（placeholder などの属性だけ、翻訳する）
      el.childNodes.forEach(collect);
    }

    async function translate(items: { text: string; svg: boolean }[]) {
      for (const svg of [false, true]) {
        const need = [...new Set(items.filter((x) => x.svg === svg).map((x) => x.text))].filter((t) => !cache.has(keyOf(t, svg)));
        const chunks: string[][] = [];
        for (let i = 0; i < need.length; i += 20) chunks.push(need.slice(i, i + 20));
        // 文字の多いページでも、待たないように、いっせいに頼む
        await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const r = await fetch("/api/translate", { method: "POST", body: JSON.stringify({ texts: chunk, short: svg }) });
              if (!r.ok) return;
              const j = (await r.json()) as { translations: string[] };
              chunk.forEach((t, k) => {
                const v = j.translations[k];
                // 訳せなかった文（日本語のまま返ったもの）は、覚えない。あとで、もう一度試す
                if (v && v !== t && !JP.test(v)) cache.set(keyOf(t, svg), v);
              });
            } catch {
              /* 失敗したら、日本語のまま */
            }
          }),
        );
      }
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries([...cache].slice(-600))));
      } catch {
        /* 何もしない */
      }
    }

    async function flush() {
      timer = null;
      const texts = [...pendingText];
      const attrEls = [...pendingAttr];
      pendingText.clear();
      pendingAttr.clear();
      const items: { text: string; svg: boolean }[] = [];
      for (const t of texts) {
        if (t.parentElement?.getAttribute("data-en") || FIXED[(t.nodeValue ?? "").trim()]) continue; // 図の中の決まった文字は、翻訳に頼らない
        items.push({ text: (t.nodeValue ?? "").trim(), svg: inSvg(t.parentElement) });
      }
      for (const el of attrEls)
        for (const a of ATTRS) {
          const v = el.getAttribute(a);
          if (v && JP.test(v)) items.push({ text: v.trim(), svg: false });
        }
      const title = JP.test(document.title) ? document.title : "";
      if (title) items.push({ text: title.trim(), svg: false });
      if (items.length > 0) await translate(items);

      let left = 0;
      for (const t of texts) {
        const raw = t.nodeValue ?? "";
        const fixed = t.parentElement?.getAttribute("data-en") ?? FIXED[raw.trim()];
        const en = fixed ?? cache.get(keyOf(raw.trim(), inSvg(t.parentElement)));
        if (en && t.isConnected) {
          const next = fixed ? en : raw.replace(raw.trim(), en);
          const el = t.parentElement;
          const w0 = el instanceof SVGTextElement ? el.getComputedTextLength() : 0;
          applied.set(t, next);
          t.nodeValue = next;
          // 図の中の文字が、枠からはみ出さないように、長くなった分だけ、文字を小さくする（下限は 0.7 倍）
          if (el instanceof SVGTextElement && w0 > 0) {
            const w1 = el.getComputedTextLength();
            if (w1 > w0 * 1.05) {
              const fs = parseFloat(getComputedStyle(el).fontSize) || 12;
              el.style.fontSize = `${Math.max(fs * 0.7, (fs * w0) / w1)}px`;
            }
          }
        } else if (t.isConnected) left++;
      }
      // 訳せなかった文が残ったら、少し待って、もう一度（最大3回）
      if (left > 0 && retries < 3) {
        retries++;
        window.setTimeout(() => {
          collect(document.body);
          schedule();
        }, 1500 * retries);
      }
      for (const el of attrEls) {
        const done = attrApplied.get(el) ?? {};
        for (const a of ATTRS) {
          const v = el.getAttribute(a);
          const en = v ? cache.get(v.trim()) : undefined;
          if (v && en && done[a] !== v) {
            done[a] = en;
            el.setAttribute(a, en);
          }
        }
        attrApplied.set(el, done);
      }
      if (title) {
        const en = cache.get(title.trim());
        if (en) document.title = en;
      }
      if (first) {
        first = false;
        reveal();
      }
    }

    const schedule = () => {
      if (timer === null) timer = window.setTimeout(flush, 120);
    };

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") collect(m.target);
        else if (m.type === "attributes") {
          const el = m.target as Element;
          const name = m.attributeName ?? "";
          if (!el.closest("[data-no-translate]") && JP.test(el.getAttribute(name) ?? "") && (attrApplied.get(el) ?? {})[name] !== el.getAttribute(name)) pendingAttr.add(el);
        } else m.addedNodes.forEach(collect);
      }
      if (pendingText.size > 0 || pendingAttr.size > 0) schedule();
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

    collect(document.body);
    if (pendingText.size === 0 && pendingAttr.size === 0 && !JP.test(document.title)) reveal();
    else schedule();
    // 念のため、あとから、もう一度（読み込みで、書き戻された文字を拾う）
    const again = [window.setTimeout(() => { collect(document.body); schedule(); }, 2500), window.setTimeout(() => { collect(document.body); schedule(); }, 5000)];

    return () => {
      mo.disconnect();
      again.forEach((x) => window.clearTimeout(x));
      if (timer !== null) window.clearTimeout(timer);
      reveal();
    };
  }
}
