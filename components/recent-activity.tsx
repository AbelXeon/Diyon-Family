import { desc, eq } from "drizzle-orm";
import { Pencil, UserMinus, UserPlus, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { STATUS_META, type PayoutStatus } from "@/lib/status";

type Row = typeof activityLog.$inferSelect;

const TYPES = {
  member_added: { icon: UserPlus, tone: "bg-emerald-100 text-emerald-700" },
  member_updated: { icon: Pencil, tone: "bg-sky-100 text-sky-700" },
  member_deleted: { icon: UserMinus, tone: "bg-rose-100 text-rose-700" },
  status_changed: { icon: Wallet, tone: "bg-cyan-100 text-teal-800" },
} as const;

function ago(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function Message({ a }: { a: Row }) {
  const who = <b className="font-semibold text-slate-900">{a.actorName}</b>;
  const subject = <b className="font-semibold text-slate-900">{a.subject}</b>;
  switch (a.type) {
    case "member_added":
      return <>{who} added {subject} to the family</>;
    case "member_deleted":
      return <>{who} removed {subject} from the family</>;
    case "status_changed": {
      const meta = STATUS_META[a.detail as PayoutStatus];
      return (
        <>
          {who} marked {subject} as{" "}
          {meta ? <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ${meta.badge}`}>{meta.label}</span> : a.detail}
        </>
      );
    }
    default:
      return <>{who} updated {subject}</>;
  }
}

export async function RecentActivity({ ownerId }: { ownerId: string }) {
  const rows: Row[] = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.ownerId, ownerId))
    .orderBy(desc(activityLog.createdAt))
    .limit(6)
    .catch(() => []);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wide text-brand-900">Recent activity</h2>
        <span className="text-sm text-slate-400">Latest 6</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Nothing yet. Add a member or update a payment and it will show up here.
        </p>
      ) : (
        <ol>
          {rows.map((a, i) => {
            const t = TYPES[a.type as keyof typeof TYPES] ?? TYPES.member_updated;
            return (
              <li
                key={a.id}
                style={{ opacity: 1 - i * 0.08 }}
                className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0 sm:items-center sm:gap-4"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.tone}`}>
                  <t.icon className="h-5 w-5" />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
                  <Message a={a} />
                </p>
                <time className="shrink-0 text-sm text-slate-400">{ago(a.createdAt)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}