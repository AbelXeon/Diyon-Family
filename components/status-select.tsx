"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { STATUS_META, VISIBLE_STATUSES, type PayoutStatus } from "@/lib/status";
import { setPayoutStatusAction } from "@/app/actions/members";

export function StatusSelect({ memberId, month, status }: { memberId: string; month: string; status: PayoutStatus }) {
  const [pending, start] = useTransition();
  // any old "success" row counts as Claimed
  const [value, setValue] = useOptimistic<PayoutStatus>(status === "success" ? "claimed" : status);

  function choose(next: PayoutStatus) {
    if (next === value || pending) return;
    start(async () => {
      setValue(next);
      await setPayoutStatusAction(memberId, month, next);
    });
  }

  return (
    <div role="radiogroup" aria-label="Payment status" className={`flex flex-wrap gap-2 ${pending ? "opacity-70" : ""}`}>
      {VISIBLE_STATUSES.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(s)}
            className={`font-display inline-flex items-center gap-1 rounded-full px-3 py-1 text-base tracking-wider ring-1 transition ${
              active ? STATUS_META[s].badge : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {STATUS_META[s].label}
          </button>
        );
      })}
    </div>
  );
}