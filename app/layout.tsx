import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      </body>
    </html>
  );
}
