/**
 * 試用の記録と採点の保管。提出版は Firestore（90日で自動削除）、手元はメモリ。
 * 記録は「追加」だけ。本人の言葉は、ここには入らない。
 */
const g = globalThis as unknown as { __engawaCollect?: Record<string, unknown[]>; __engawaFs2?: unknown };
const mem = (g.__engawaCollect ??= {});
const RETENTION_DAYS: Record<string, number> = { trial: 90, ratings: 90, pilots: 180, invites: 180 };
type Collection = "trial" | "ratings" | "pilots" | "invites";

async function fs() {
  if (!g.__engawaFs2) {
    const { Firestore } = await import("@google-cloud/firestore");
    g.__engawaFs2 = new Firestore({ projectId: process.env.FIRESTORE_PROJECT });
  }
  return g.__engawaFs2 as import("@google-cloud/firestore").Firestore;
}

export async function addDoc(collection: Collection, doc: Record<string, unknown>): Promise<void> {
  if (process.env.FIRESTORE_PROJECT) {
    const expireAt = new Date(Date.now() + RETENTION_DAYS[collection] * 86_400_000);
    await (await fs()).collection(collection).add({ ...doc, expireAt });
    return;
  }
  (mem[collection] ??= []).push(doc);
}

export async function listDocs<T>(collection: Collection, limit = 5000): Promise<T[]> {
  if (process.env.FIRESTORE_PROJECT) {
    const snap = await (await fs()).collection(collection).limit(limit).get();
    return snap.docs.map((d) => d.data() as T);
  }
  return (mem[collection] ?? []) as T[];
}

/** IDを決めて、1件だけ保存・取得する（招待コード用）。 */
export async function putDocById(collection: Collection, id: string, doc: Record<string, unknown>): Promise<void> {
  if (process.env.FIRESTORE_PROJECT) {
    const expireAt = new Date(Date.now() + RETENTION_DAYS[collection] * 86_400_000);
    await (await fs()).collection(collection).doc(id).set({ ...doc, expireAt });
    return;
  }
  const g2 = g as unknown as { __engawaById?: Record<string, Record<string, unknown>> };
  const m = (g2.__engawaById ??= {});
  m[`${collection}/${id}`] = doc;
}

export async function getDocById<T>(collection: Collection, id: string): Promise<T | null> {
  if (process.env.FIRESTORE_PROJECT) {
    const snap = await (await fs()).collection(collection).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  }
  const g2 = g as unknown as { __engawaById?: Record<string, Record<string, unknown>> };
  return ((g2.__engawaById ?? {})[`${collection}/${id}`] ?? null) as T | null;
}
