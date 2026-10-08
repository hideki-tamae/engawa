/** 貼られたリンク（または、トークンだけ）から、手帳のトークンを取り出す。 */
export function extractToken(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/(?:window|show|card)\/([A-Za-z0-9_-]{8,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{8,}$/.test(s) ? s : null;
}
