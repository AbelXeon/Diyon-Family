"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { members, payouts } from "@/lib/db/schema";
import { ownerIdOf, requireUser } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar";
import { amountSchema, monthSchema, nameSchema, statusSchema } from "@/lib/validation";
import { currentCycleMonth, isUniqueViolation } from "@/lib/utils";
import type { FormState } from "@/lib/types";

const memberSchema = z.object({
  fullName: nameSchema,
  appId: z.string().trim().min(1, "App ID is required").max(60),
  amount: amountSchema,
});

const refresh = () => {
  revalidatePath("/members");
  revalidatePath("/overview");
};

export async function createMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  const p = memberSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };

  const up = await uploadAvatar(fd.get("avatar"));
  if (up.error) return { error: up.error };

  try {
    await db.insert(members).values({ ownerId, ...p.data, avatarUrl: up.url });
  } catch (e) {
    await deleteAvatar(up.url);
    return { error: isUniqueViolation(e) ? "This app ID already exists" : "Could not save member" };
  }
  refresh();
  return { success: "Member added" };
}

export async function updateMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  const p = memberSchema.extend({ id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };

  const [old] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, p.data.id), eq(members.ownerId, ownerId)))
    .limit(1);
  if (!old) return { error: "Member not found" };

  const up = await uploadAvatar(fd.get("avatar"));
  if (up.error) return { error: up.error };
  const avatarUrl = up.url ?? (fd.get("removeAvatar") === "on" ? null : old.avatarUrl);

  try {
    await db
      .update(members)
      .set({ fullName: p.data.fullName, appId: p.data.appId, amount: p.data.amount, avatarUrl })
      .where(eq(members.id, old.id));
  } catch (e) {
    await deleteAvatar(up.url);
    return { error: isUniqueViolation(e) ? "This app ID already exists" : "Could not save member" };
  }

  if (avatarUrl !== old.avatarUrl) await deleteAvatar(old.avatarUrl);
  if (Number(p.data.amount) !== Number(old.amount)) {
    await db
      .update(payouts)
      .set({ amount: p.data.amount, updatedAt: new Date() })
      .where(and(eq(payouts.memberId, old.id), eq(payouts.month, currentCycleMonth()), ne(payouts.status, "paid")));
  }
  refresh();
  return { success: "Member updated" };
}

export async function deleteMemberAction(id: string) {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  if (!z.string().uuid().safeParse(id).success) return;
  const [m] = await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.ownerId, ownerId)))
    .returning({ avatarUrl: members.avatarUrl });
  if (m) await deleteAvatar(m.avatarUrl);
  refresh();
}

export async function setPayoutStatusAction(memberId: string, month: string, status: string) {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  const p = z.object({ memberId: z.string().uuid(), month: monthSchema, status: statusSchema }).safeParse({ memberId, month, status });
  if (!p.success) return;

  const [m] = await db
    .select({ amount: members.amount })
    .from(members)
    .where(and(eq(members.id, p.data.memberId), eq(members.ownerId, ownerId)))
    .limit(1);
  if (!m) return;

  const isPaid = p.data.status === "paid";
  await db
    .insert(payouts)
    .values({ memberId: p.data.memberId, month: p.data.month, amount: m.amount, status: p.data.status, paidAt: isPaid ? new Date() : null })
    .onConflictDoUpdate({
      target: [payouts.memberId, payouts.month],
      set: {
        status: p.data.status,
        paidAt: isPaid ? sql`coalesce(${payouts.paidAt}, now())` : null,
        updatedAt: new Date(),
      },
    });
  refresh();
}