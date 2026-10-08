/**
 * 試用の記録と採点の保管。提出版は Firestore（90日で自動削除）、手元はメモリ。
 * 記録は「追加」だけ。本人の言葉は、ここには入らない。
 */
const g = globalThis as unknown as { __engawaCollect?: Record<string, unknown[]>; __engawaFs2?: unknown };
const mem = (g.__engawaCollect ??= {});
const RETENTION_DAYS: Record<string, number> = { trial: 90, ratings: 90, pilots: 180 };
type Collection = "trial" | "ratings" | "pilots";

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
