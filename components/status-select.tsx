"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { STATUS_META, type PayoutStatus } from "@/lib/status";
import { setPayoutStatusAction } from "@/app/actions/members";

function Chip({
  label,
  tone,
  active,
  disabled,
  title,
  onClick,
}: {
  label: string;
  tone: string;
  active: boolean;
  disabled: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled && !active}
      title={title}
      onClick={onClick}
      className={`font-display inline-flex items-center gap-1 rounded-full px-3 py-1 text-base tracking-wider ring-1 transition ${
        active
          ? tone
          : disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-100"
            : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export function StatusSelect({ memberId, month, status }: { memberId: string; month: string; status: PayoutStatus }) {
  const [pending, start] = useTransition();
  // old rows: "success" counts as Success stage, "unpaid" counts as In Progress
  const initial: PayoutStatus = status === "success" ? "claimed" : status === "unpaid" ? "in_progress" : status;
  const [value, setValue] = useOptimistic<PayoutStatus>(initial);

  function send(request: PayoutStatus, shown: PayoutStatus) {
    if (pending) return;
    start(async () => {
      setValue(shown);
      await setPayoutStatusAction(memberId, month, request);
    });
  }

  const inProgress = value === "in_progress";
  const paid = value === "paid";

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${pending ? "opacity-70" : ""}`}>
      <div className="flex gap-2" role="group" aria-label="Claim stage">
        <Chip
          label={STATUS_META.in_progress.label}
          tone={STATUS_META.in_progress.badge}
          active={inProgress}
          disabled={!inProgress}
          title={inProgress ? undefined : "Cannot go back to In Progress"}
        />
        <Chip
          label={STATUS_META.claimed.label}
          tone={STATUS_META.claimed.badge}
          active={!inProgress}
          disabled={false}
          onClick={() => {
            if (inProgress) send("claimed", "claimed");
          }}
        />
      </div>

      <div className="flex gap-2" role="group" aria-label="Payment">
        <Chip
          label={STATUS_META.paid.label}
          tone={STATUS_META.paid.badge}
          active={paid}
          disabled={inProgress}
          title={inProgress ? "Mark Success first" : undefined}
          onClick={() => {
            if (value === "claimed") send("paid", "paid");
          }}
        />
        <Chip
          label={STATUS_META.unpaid.label}
          tone={STATUS_META.unpaid.badge}
          active={!paid}
          disabled={false}
          onClick={() => {
            if (paid) send("unpaid", "claimed");
          }}
        />
      </div>
    </div>
  );
}