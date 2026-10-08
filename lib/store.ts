import type { Handoff } from "./handoff";

/**
 * 保管庫。
 *  - 提出版（Cloud Run）：Firestore（FIRESTORE_PROJECT を設定したとき）。30日で自動削除（TTL）。
 *  - 手元：メモリ（再起動で消える）。
 * 記録（log）は、ハッシュの連鎖を壊さないよう、JSON の文字列のまま保存する。
 */
export interface HandoffStore {
  get(token: string): Promise<Handoff | undefined>;
  put(h: Handoff): Promise<void>;
}

export const RETENTION_DAYS = 30;

export interface StoredDoc {
  card: string;
  log: string;
  withdrawn: boolean;
  expireAt: Date;
}

export function serialize(h: Handoff, now = new Date()): StoredDoc {
  return {
    card: JSON.stringify(h.card),
    log: JSON.stringify(h.log),
    withdrawn: h.withdrawn,
    expireAt: new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000),
  };
}

export function deserialize(token: string, d: { card: string; log: string; withdrawn: boolean }): Handoff {
  return { token, card: JSON.parse(d.card), log: JSON.parse(d.log), withdrawn: d.withdrawn };
}

const g = globalThis as unknown as {
  __engawaStore?: Map<string, Handoff>;
  __engawaFs?: unknown;
};

const memoryStore: HandoffStore = {
  async get(token) {
    return (g.__engawaStore ??= new Map<string, Handoff>()).get(token);
  },
  async put(h) {
    (g.__engawaStore ??= new Map<string, Handoff>()).set(h.token, h);
  },
};

function firestoreStore(project: string): HandoffStore {
  const load = async () => {
    if (!g.__engawaFs) {
      const { Firestore } = await import("@google-cloud/firestore");
      g.__engawaFs = new Firestore({ projectId: project });
    }
    return (g.__engawaFs as import("@google-cloud/firestore").Firestore).collection("handoffs");
  };
  return {
    async get(token) {
      const snap = await (await load()).doc(token).get();
      if (!snap.exists) return undefined;
      return deserialize(token, snap.data() as { card: string; log: string; withdrawn: boolean });
    },
    async put(h) {
      await (await load()).doc(h.token).set(serialize(h));
    },
  };
}

export const store: HandoffStore = process.env.FIRESTORE_PROJECT
  ? firestoreStore(process.env.FIRESTORE_PROJECT)
  : memoryStore;
