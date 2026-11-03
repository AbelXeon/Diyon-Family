"use client";

import { useOptimistic, useTransition } from "react";
import { STATUS_META, STATUS_VALUES, type PayoutStatus } from "@/lib/status";
import { setPayoutStatusAction } from "@/app/actions/members";

export function StatusSelect({ memberId, month, status }: { memberId: string; month: string; status: PayoutStatus }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(status);

  return (
    <select
      value={value}
      disabled={pending}
      aria-label="Payment status"
      onChange={(e) => {
        const next = e.target.value as PayoutStatus;
        start(async () => {
          setValue(next);
          await setPayoutStatusAction(memberId, month, next);
        });
      }}
      className={`w-full cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium ring-1 outline-none md:w-auto ${STATUS_META[value].badge}`}
    >
      {STATUS_VALUES.map((s) => (
        <option key={s} value={s}>
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}