import WindowEntry from "@/components/WindowEntry";

export const metadata = {
  title: "窓口の入口｜Engawa",
  description: "窓口の方は、ここからログインして、本人から受け取ったリンクを開きます。",
};

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <WindowEntry />
    </main>
  );
}
