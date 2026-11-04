import Link from "next/link";
import { and, eq, gte, sql } from "drizzle-orm";
import { Users, Wallet, CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { members, payouts } from "@/lib/db/schema";
import { ownerIdOf, requireUser } from "@/lib/auth";
import { ensureCyclePayouts } from "@/lib/payouts";
import { STATUS_META, STATUS_VALUES } from "@/lib/status";
import { RANGES, bucketLabel, bucketStart, currentCycleMonth, formatMoney, monthLabel, shiftBucket } from "@/lib/utils";
import { OverviewChart } from "@/components/overview-chart";
import { RecentActivity } from "@/components/recent-activity";

export const metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser();
  const ownerId = ownerIdOf(user);
  const sp = await searchParams;
  const rangeKey = sp.range && sp.range in RANGES ? sp.range : "month";
  const { unit, n } = RANGES[rangeKey];
  const cycle = currentCycleMonth();

  await ensureCyclePayouts(ownerId, cycle);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(members).where(eq(members.ownerId, ownerId));

  const statusRows = await db
    .select({ status: payouts.status, count: sql<number>`count(*)::int`, total: sql<string>`coalesce(sum(${payouts.amount}), 0)` })
    .from(payouts)
    .innerJoin(members, eq(members.id, payouts.memberId))
    .where(and(eq(members.ownerId, ownerId), eq(payouts.month, cycle)))
    .groupBy(payouts.status);

  const by = Object.fromEntries(statusRows.map((r) => [r.status, r]));
  const totalAmount = statusRows.reduce((a, r) => a + Number(r.total), 0);
  const paidAmount = Number(by.paid?.total ?? 0);

  const start = bucketStart(new Date(), unit);
  const first = shiftBucket(start, unit, n - 1);
  const bucketExpr = sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${payouts.paidAt}), 'YYYY-MM-DD')`;
  const rows = await db
    .select({ bucket: bucketExpr, total: sql<string>`sum(${payouts.amount})` })
    .from(payouts)
    .innerJoin(members, eq(members.id, payouts.memberId))
    .where(and(eq(members.ownerId, ownerId), eq(payouts.status, "paid"), gte(payouts.paidAt, first)))
    .groupBy(bucketExpr)
    .orderBy(bucketExpr);
  const map = new Map(rows.map((r) => [r.bucket, Number(r.total)]));
  const data = Array.from({ length: n }, (_, i) => {
    const d = shiftBucket(start, unit, n - 1 - i);
    return { label: bucketLabel(d, unit), total: map.get(d.toISOString().slice(0, 10)) ?? 0 };
  });

  const stats = [
    { label: "Family members", value: String(count), icon: Users },
    { label: "This month total", value: formatMoney(totalAmount), icon: Wallet },
    { label: "Paid so far", value: formatMoney(paidAmount), icon: CheckCircle2 },
    { label: "Remaining", value: formatMoney(totalAmount - paidAmount), icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-brand-900">Overview</h1>
        <p className="text-sm text-slate-500">Payout cycle: {monthLabel(cycle)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-200 to-teal-400 text-brand-900">
              <s.icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="font-display truncate text-3xl tracking-wide text-brand-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide text-brand-900">Paid amount</h2>
            <div className="flex rounded-full bg-brand-50 p-1">
              {Object.entries(RANGES).map(([k, v]) => (
                <Link
                  key={k}
                  href={`/overview?range=${k}`}
                  className={`font-display rounded-full px-4 py-1 text-lg tracking-wider ${
                    k === rangeKey ? "bg-brand-900 text-white" : "text-slate-600"
                  }`}
                >
                  {v.label}
                </Link>
              ))}
            </div>
          </div>
          <OverviewChart data={data} />
        </div>

        <div className="card">
          <h2 className="font-display mb-4 text-2xl tracking-wide text-brand-900">This month by status</h2>
          <ul className="space-y-3">
            {STATUS_VALUES.map((s) => (
              <li key={s} className="flex items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${STATUS_META[s].badge}`}>{STATUS_META[s].label}</span>
                <span className="text-right text-sm">
                  <span className="font-semibold">{by[s]?.count ?? 0}</span>
                  <span className="ml-2 text-slate-500">{formatMoney(by[s]?.total ?? 0)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <RecentActivity ownerId={ownerId} />
    </div>
  );
}