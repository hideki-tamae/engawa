import { listDocs } from "@/lib/collect";
import { type TrialDoc, summarize } from "@/lib/trial";

/** 試用の集計（個人を特定できない数字だけ）。n が少ないうちは、数字を出さない。 */
export async function GET() {
  const docs = await listDocs<TrialDoc>("trial");
  const s = summarize(docs);
  return Response.json({ ...s, enough: s.started >= 3 }, { headers: { "cache-control": "no-store" } });
}
