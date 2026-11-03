export const STATUS_VALUES = ["in_progress", "claimed", "success", "paid", "unpaid"] as const;
export type PayoutStatus = (typeof STATUS_VALUES)[number];

export const STATUS_META: Record<PayoutStatus, { label: string; badge: string }> = {
  in_progress: { label: "In Progress", badge: "bg-amber-50 text-amber-800 ring-amber-300" },
  claimed: { label: "Claimed", badge: "bg-sky-50 text-sky-800 ring-sky-300" },
  success: { label: "Success", badge: "bg-violet-50 text-violet-800 ring-violet-300" },
  paid: { label: "Paid", badge: "bg-emerald-50 text-emerald-800 ring-emerald-300" },
  unpaid: { label: "Unpaid", badge: "bg-rose-50 text-rose-800 ring-rose-300" },
};