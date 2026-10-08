import ForWindows from "@/components/ForWindows";

export const metadata = {
  title: "窓口の方へ｜Engawa",
  description: "本人が持ってくる「困りごとの手帳」を、準備なしで受け取れます。無料のパイロットのご案内。",
};

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <ForWindows />
    </main>
  );
}
