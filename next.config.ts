import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run 用。最小の実行ファイル一式を作る
  output: "standalone",
};

export default nextConfig;
