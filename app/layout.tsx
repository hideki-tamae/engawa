import type { Metadata, Viewport } from "next";
import "./globals.css";
import Translator from "@/components/Translator";

export const metadata: Metadata = {
  title: "Engawa（縁側）｜困りごとの手帳",
  description: "困りごとを、あなたの言葉のまま持ち歩ける手帳。窓口が変わっても、同じ話を一からしなくて済むように。",
  applicationName: "Engawa",
  appleWebApp: { capable: true, title: "Engawa", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-wood focus:px-4 focus:py-2 focus:text-paper"
        >
          本文へ移動
        </a>
        {children}
        <footer data-no-translate className="mt-auto flex flex-col items-center gap-2 px-4 pb-8 pt-10 print:hidden">
          <span aria-hidden className="h-px w-10 bg-wood/30" />
          <p className="text-[11px] tracking-[0.22em] text-muted/70">© 2026 Hideki Tamae. All rights reserved.</p>
          <p className="text-[10px] tracking-[0.12em] text-muted/55">イラストは、AI で生成したイメージです。登場人物は架空です。</p>
        </footer>
        <Translator />
      </body>
    </html>
  );
}
