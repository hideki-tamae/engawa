import { SESSION_COOKIE, checkLogin, issue } from "@/lib/session";
import { allow, clientKey } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (!allow(`login:${clientKey(request)}`, 10, 60_000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { user?: string; password?: string };
  if (!body.user || !body.password || !checkLogin(body.user, body.password)) {
    return Response.json({ error: "invalid" }, { status: 401 });
  }
  const res = Response.json({ user: body.user });
  res.headers.append(
    "set-cookie",
    `${SESSION_COOKIE}=${issue(body.user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return res;
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.append("set-cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
