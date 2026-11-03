import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { loginAttempts } from "./db/schema";

const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 60 * 1000; // 5 hours

export async function getLockedUntil(keys: string[]) {
  const rows = await db.select().from(loginAttempts).where(inArray(loginAttempts.key, keys));
  const now = Date.now();
  const active = rows.filter((r) => r.lockedUntil && r.lockedUntil.getTime() > now).map((r) => r.lockedUntil!.getTime());
  return active.length ? new Date(Math.max(...active)) : null;
}

export async function recordFailure(key: string) {
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).limit(1);
  const now = new Date();
  let failures = 1;
  if (row) {
    const lockExpired = row.lockedUntil && row.lockedUntil <= now;
    const stale = now.getTime() - row.updatedAt.getTime() > LOCK_MS;
    if (!lockExpired && !stale) failures = row.failures + 1;
  }
  const lockedUntil = failures >= MAX_FAILS ? new Date(now.getTime() + LOCK_MS) : null;
  await db
    .insert(loginAttempts)
    .values({ key, failures, lockedUntil, updatedAt: now })
    .onConflictDoUpdate({ target: loginAttempts.key, set: { failures, lockedUntil, updatedAt: now } });
}

export async function clearFailures(key: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}