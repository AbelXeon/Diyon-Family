"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, destroySession, getClientIp, hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/auth";
import { clearFailures, getLockedUntil, recordFailure } from "@/lib/rate-limit";
import { nameSchema, passwordSchema, usernameSchema } from "@/lib/validation";
import type { FormState } from "@/lib/types";

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  if (c > 0) return { error: "Registration is closed." };

  const p = z
    .object({ name: nameSchema, username: usernameSchema, password: passwordSchema, confirm: z.string() })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.password !== p.data.confirm) return { error: "Passwords do not match" };

  const [u] = await db
    .insert(users)
    .values({ name: p.data.name, username: p.data.username, passwordHash: await hashPassword(p.data.password), role: "owner" })
    .returning({ id: users.id });
  await createSession(u.id);
  redirect("/overview");
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const p = z
    .object({ username: z.string().trim().toLowerCase().max(60), password: z.string().max(100) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Invalid username or password" };

  const ip = await getClientIp();
  const keys = [`user:${p.data.username}`, `ip:${ip}`];

  const locked = await getLockedUntil(keys);
  if (locked) {
    const mins = Math.ceil((locked.getTime() - Date.now()) / 60000);
    return { error: `Too many failed attempts. Try again in ${Math.floor(mins / 60)}h ${mins % 60}m.` };
  }

  const [user] = await db.select().from(users).where(eq(users.username, p.data.username)).limit(1);
  const ok = await verifyPassword(p.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await Promise.all(keys.map(recordFailure));
    return { error: "Invalid username or password" };
  }

  await clearFailures(keys[0]);
  await createSession(user.id);
  redirect("/overview");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}