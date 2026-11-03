"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteButton({ action, confirmText, label }: { action: () => Promise<void>; confirmText: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={pending}
      className="btn btn-ghost px-2.5 text-rose-600 hover:bg-rose-50"
      onClick={() => {
        if (confirm(confirmText)) start(async () => { await action(); });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}