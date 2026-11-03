import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { sessions, users } from "./db/schema";

const COOKIE = "df_session";
const SESSION_DAYS = 30;
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha(token),
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    ip: await getClientIp(),
    expiresAt,
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      session: sessions,
      user: { id: users.id, name: users.name, username: users.username, role: users.role, ownerId: users.ownerId, avatarUrl: users.avatarUrl },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - row.session.lastActiveAt.getTime() > 120_000) {
    await db.update(sessions).set({ lastActiveAt: new Date() }).where(eq(sessions.id, row.session.id));
  }
  return row;
});

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  return { ...s.user, sessionId: s.session.id };
}

export async function requireOwner() {
  const u = await requireUser();
  if (u.role !== "owner") redirect("/overview");
  return u;
}

export function ownerIdOf(u: { id: string; role: "owner" | "helper"; ownerId: string | null }) {
  return u.role === "owner" ? u.id : (u.ownerId as string);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha(token)));
  jar.delete(COOKIE);
}