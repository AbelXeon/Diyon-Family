import { and, asc, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { members, payouts } from "@/lib/db/schema";
import { ownerIdOf, requireUser } from "@/lib/auth";
import { ensureCyclePayouts } from "@/lib/payouts";
import { currentCycleMonth, formatMoney, monthLabel, recentCycles } from "@/lib/utils";
import type { PayoutStatus } from "@/lib/status";
import { Avatar } from "@/components/avatar";
import { MemberDialog } from "@/components/member-dialog";
import { StatusSelect } from "@/components/status-select";
import { DeleteButton } from "@/components/delete-button";
import { deleteMemberAction } from "@/app/actions/members";

export const metadata = { title: "Family Members" };

const SORTS = [
  { v: "name_asc", l: "Name A to Z" },
  { v: "name_desc", l: "Name Z to A" },
  { v: "newest", l: "Newest first" },
  { v: "oldest", l: "Oldest first" },
];

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ month?: string; sort?: string; q?: string }> }) {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  const sp = await searchParams;

  const cycle = currentCycleMonth();
  const months = recentCycles(12);
  const month = sp.month && months.includes(sp.month) ? sp.month : cycle;
  const sort = SORTS.some((s) => s.v === sp.sort) ? (sp.sort as string) : "name_asc";
  const q = (sp.q ?? "").trim().slice(0, 60);

  if (month === cycle) await ensureCyclePayouts(ownerId, cycle);

  const order = sort === "name_desc" ? desc(members.fullName) : sort === "newest" ? desc(members.createdAt) : sort === "oldest" ? asc(members.createdAt) : asc(members.fullName);
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;

  const rows = await db
    .select({
      id: members.id,
      fullName: members.fullName,
      appId: members.appId,
      amount: members.amount,
      avatarUrl: members.avatarUrl,
      payoutAmount: payouts.amount,
      status: payouts.status,
    })
    .from(members)
    .leftJoin(payouts, and(eq(payouts.memberId, members.id), eq(payouts.month, month)))
    .where(
      and(
        eq(members.ownerId, ownerId),
        q ? or(ilike(members.fullName, pattern), ilike(members.appId, pattern)) : undefined,
        month !== cycle ? isNotNull(payouts.id) : undefined
      )
    )
    .orderBy(order);

  const cols = "md:grid md:grid-cols-[2fr_1.2fr_1fr_1.4fr_auto] md:items-center md:gap-4";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Family Members</h1>
          <p className="text-sm text-slate-500">
            {monthLabel(month)} · {rows.length} member{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <MemberDialog />
      </div>

      <form method="get" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search name or app ID" className="input pl-9" />
        </div>
        <select name="month" defaultValue={month} className="input" aria-label="Month">
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="input" aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </select>
        <button className="btn btn-primary sm:col-span-2 lg:col-span-1">Apply</button>
      </form>

      <div className="card overflow-hidden p-0 sm:p-0">
        <div className={`hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${cols}`}>
          <span>Full name</span><span>App ID</span><span>Amount</span><span>Status</span><span className="w-24 text-right">Actions</span>
        </div>

        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No members found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((m) => (
              <li key={m.id} className={`flex flex-col gap-3 px-4 py-4 md:px-5 ${cols}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.fullName} url={m.avatarUrl} size={40} />
                  <span className="truncate font-medium">{m.fullName}</span>
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-xs text-slate-500 md:hidden">App ID</span>
                  <span className="break-all">{m.appId}</span>
                </div>
                <div className="text-sm font-medium">
                  <span className="mr-2 text-xs font-normal text-slate-500 md:hidden">Amount</span>
                  {formatMoney(m.payoutAmount ?? m.amount)}
                </div>
                <div>
                  <StatusSelect memberId={m.id} month={month} status={(m.status ?? "in_progress") as PayoutStatus} />
                </div>
                <div className="flex gap-2 md:w-24 md:justify-end">
                  <MemberDialog member={{ id: m.id, fullName: m.fullName, appId: m.appId, amount: m.amount, avatarUrl: m.avatarUrl }} />
                  <DeleteButton
                    action={deleteMemberAction.bind(null, m.id)}
                    confirmText={`Delete ${m.fullName} and all payment history?`}
                    label="Delete member"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}