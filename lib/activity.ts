import "server-only";
import { db } from "./db";
import { activityLog } from "./db/schema";

export type ActivityType = "member_added" | "member_updated" | "member_deleted" | "status_changed";

export async function logActivity(e: {
  ownerId: string;
  actorName: string;
  type: ActivityType;
  subject: string;
  detail?: string | null;
}) {
  try {
    await db.insert(activityLog).values({
      ownerId: e.ownerId,
      actorName: e.actorName,
      type: e.type,
      subject: e.subject,
      detail: e.detail ?? null,
    });
  } catch {
    // logging must never break the real action
  }
}