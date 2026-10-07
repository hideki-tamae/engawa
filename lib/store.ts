import type { Handoff } from "./handoff";

/**
 * 保管庫。デモ用はメモリ（再起動で消える）。
 * 提出版は Firestore に差し替える（同じ get/put の形を保つ）。
 */
export interface HandoffStore {
  get(token: string): Promise<Handoff | undefined>;
  put(h: Handoff): Promise<void>;
}

const g = globalThis as unknown as { __engawaStore?: Map<string, Handoff> };
const map = (g.__engawaStore ??= new Map<string, Handoff>());

export const store: HandoffStore = {
  async get(token) {
    return map.get(token);
  },
  async put(h) {
    map.set(h.token, h);
  },
};
