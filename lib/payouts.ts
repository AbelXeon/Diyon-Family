import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";

/** Makes sure every member has a payout row (In Progress) for the month. */
export async function ensureCyclePayouts(ownerId: string, month: string) {
  await db.execute(
    sql`insert into payouts (member_id, month, amount)
        select id, ${month}, amount from members where owner_id = ${ownerId}
        on conflict (member_id, month) do nothing`
  );
}