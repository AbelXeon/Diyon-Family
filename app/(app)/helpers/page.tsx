import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireOwner } from "@/lib/auth";
import { createHelperAction, deleteHelperAction, resetHelperPasswordAction } from "@/app/actions/helpers";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";

export const metadata = { title: "Helpers" };

export default async function HelpersPage() {
  const owner = await requireOwner();
  const list = await db
    .select({ id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(and(eq(users.ownerId, owner.id), eq(users.role, "helper")))
    .orderBy(asc(users.name));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Helpers</h1>
        <p className="text-sm text-slate-500">Helpers can manage members and payments. They cannot add other helpers.</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Add a helper</h2>
        <ActionForm action={createHelperAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="h-name">Full name</label>
            <input id="h-name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="h-username">Username</label>
            <input id="h-username" name="username" required autoComplete="off" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="h-password">Password</label>
            <input id="h-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="h-avatar">Photo (optional)</label>
            <input id="h-avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" />
          </div>
          <div className="space-y-3 sm:col-span-2">
            <SubmitButton>Create helper</SubmitButton>
          </div>
        </ActionForm>
      </div>

      <div className="card p-0 sm:p-0">
        {list.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No helpers yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((h) => (
              <li key={h.id} className="space-y-3 p-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={h.name} url={h.avatarUrl} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{h.name}</p>
                      <p className="truncate text-sm text-slate-500">@{h.username}</p>
                    </div>
                  </div>
                  <DeleteButton action={deleteHelperAction.bind(null, h.id)} confirmText={`Remove helper ${h.name}?`} label="Remove helper" />
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-indigo-600">Set a new password</summary>
                  <ActionForm action={resetHelperPasswordAction.bind(null, h.id)} resetOnSuccess className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input name="password" type="password" required minLength={8} placeholder="New password" autoComplete="new-password" className="input sm:max-w-xs" />
                    <SubmitButton className="btn btn-ghost">Save</SubmitButton>
                  </ActionForm>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}