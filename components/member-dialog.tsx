"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { ActionForm, SubmitButton } from "./action-form";
import { Avatar } from "./avatar";
import { createMemberAction, updateMemberAction } from "@/app/actions/members";

export type MemberRow = { id: string; fullName: string; appId: string; amount: string; avatarUrl: string | null };

export function MemberDialog({ member }: { member?: MemberRow }) {
  const [open, setOpen] = useState(false);
  const editing = !!member;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={editing ? "Edit member" : "Add member"}
        title={editing ? "Edit member" : "Add member"}
        className={editing ? "btn btn-ghost px-2.5" : "btn btn-primary"}
      >
        {editing ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add member
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit member" : "Add member"}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ActionForm action={editing ? updateMemberAction : createMemberAction} onSuccess={() => setOpen(false)} className="space-y-4">
              {editing && <input type="hidden" name="id" value={member.id} />}

              <div className="flex items-center gap-4">
                <Avatar name={member?.fullName || "New Member"} url={member?.avatarUrl} size={56} />
                <div className="min-w-0 flex-1">
                  <label className="label" htmlFor="avatar">Profile photo (optional)</label>
                  <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" />
                </div>
              </div>
              {editing && member.avatarUrl && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="removeAvatar" /> Remove current photo
                </label>
              )}

              <div>
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" required defaultValue={member?.fullName} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="appId">App ID</label>
                <input id="appId" name="appId" required defaultValue={member?.appId} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="amount">Amount</label>
                <input id="amount" name="amount" required inputMode="decimal" defaultValue={member?.amount} placeholder="0.00" className="input" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <SubmitButton>{editing ? "Save changes" : "Add member"}</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}