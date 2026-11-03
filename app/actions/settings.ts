"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar";
import { nameSchema, passwordSchema, usernameSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/utils";
import type { FormState } from "@/lib/types";

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = z.object({ name: nameSchema, username: usernameSchema }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };

  const up = await uploadAvatar(fd.get("avatar"));
  if (up.error) return { error: up.error };
  const avatarUrl = up.url ?? (fd.get("removeAvatar") === "on" ? null : user.avatarUrl);

  try {
    await db.update(users).set({ name: p.data.name, username: p.data.username, avatarUrl }).where(eq(users.id, user.id));
  } catch (e) {
    await deleteAvatar(up.url);
    return { error: isUniqueViolation(e) ? "This username is already taken" : "Could not save profile" };
  }
  if (avatarUrl !== user.avatarUrl) await deleteAvatar(user.avatarUrl);
  revalidatePath("/", "layout");
  return { success: "Profile saved" };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = z
    .object({ current: z.string().max(100), password: passwordSchema, confirm: z.string() })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.password !== p.data.confirm) return { error: "New passwords do not match" };

  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(p.data.current, row.hash))) return { error: "Current password is wrong" };

  await db.update(users).set({ passwordHash: await hashPassword(p.data.password) }).where(eq(users.id, user.id));
  await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId)));
  return { success: "Password changed. Other devices were logged out." };
}

export async function revokeSessionAction(id: string) {
  const user = await requireUser();
  if (!z.string().uuid().safeParse(id).success) return;
  if (id === user.sessionId) {
    await destroySession();
    redirect("/login");
  }
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, user.id)));
  revalidatePath("/settings");
}

export async function revokeOtherSessionsAction() {
  const user = await requireUser();
  await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId)));
  revalidatePath("/settings");
}