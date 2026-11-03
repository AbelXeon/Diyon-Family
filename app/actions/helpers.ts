"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { hashPassword, requireOwner } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar";
import { nameSchema, passwordSchema, usernameSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/utils";
import type { FormState } from "@/lib/types";

export async function createHelperAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const p = z
    .object({ name: nameSchema, username: usernameSchema, password: passwordSchema })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };

  const up = await uploadAvatar(fd.get("avatar"));
  if (up.error) return { error: up.error };

  try {
    await db.insert(users).values({
      name: p.data.name,
      username: p.data.username,
      passwordHash: await hashPassword(p.data.password),
      role: "helper",
      ownerId: owner.id,
      avatarUrl: up.url,
    });
  } catch (e) {
    await deleteAvatar(up.url);
    return { error: isUniqueViolation(e) ? "This username is already taken" : "Could not create helper" };
  }
  revalidatePath("/helpers");
  return { success: "Helper created" };
}

export async function deleteHelperAction(id: string) {
  const owner = await requireOwner();
  if (!z.string().uuid().safeParse(id).success) return;
  const [h] = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.ownerId, owner.id), eq(users.role, "helper")))
    .returning({ avatarUrl: users.avatarUrl });
  if (h) await deleteAvatar(h.avatarUrl);
  revalidatePath("/helpers");
}

export async function resetHelperPasswordAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const owner = await requireOwner();
  const p = passwordSchema.safeParse(fd.get("password"));
  if (!p.success) return { error: p.error.issues[0].message };
  const [h] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(p.data) })
    .where(and(eq(users.id, id), eq(users.ownerId, owner.id), eq(users.role, "helper")))
    .returning({ id: users.id });
  if (!h) return { error: "Helper not found" };
  await db.delete(sessions).where(eq(sessions.userId, h.id)); // log the helper out everywhere
  return { success: "Password changed" };
}