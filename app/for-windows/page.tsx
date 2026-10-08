import ForWindows from "@/components/ForWindows";

export const metadata = {
  title: "窓口の方へ｜Engawa",
  description: "本人が持ってくる「困りごとの手帳」を、準備なしで受け取れます。無料のパイロットのご案内。",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.code;
  const initialCode = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 20) ?? "";
  return (
    <main id="main" className="flex-1">
      <ForWindows initialCode={initialCode} />
    </main>
  );
}
