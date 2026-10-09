import type { MetadataRoute } from "next";

/** ホーム画面に追加したときの、アプリとしての設定。ストアには、まだ出していない。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Engawa（縁側）",
    short_name: "Engawa",
    description: "困りごとを、あなたの言葉のまま持ち歩ける手帳。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf6ec",
    theme_color: "#fbf6ec",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
