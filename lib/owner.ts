import type { Handoff } from "./handoff";
import { store } from "./store";
import { windowIdFor } from "./tokens";

/**
 * 本人用の合鍵から、手帳を探す。
 * 窓口用の合鍵（新しい手帳の保存ID）を、本人用として出されたときは、見つからない扱いにする。
 */
export async function ownerHandoff(token: string): Promise<Handoff | undefined> {
  if (!/^[a-f0-9]{32}$/.test(token)) return undefined;
  const h = await store.get(windowIdFor(token));
  if (h) return h;
  const legacy = await store.get(token);
  return legacy && legacy.v !== 2 ? legacy : undefined; // 以前の手帳（合鍵が1つだけ）は、これまでどおり
}
