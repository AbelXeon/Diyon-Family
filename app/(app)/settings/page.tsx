import { and, desc, eq, gt } from "drizzle-orm";
import { Monitor, Smartphone } from "lucide-react";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { changePasswordAction, revokeOtherSessionsAction, revokeSessionAction, updateProfileAction } from "@/app/actions/settings";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { parseUA, timeAgo } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const list = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.lastActiveAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Profile</h2>
          <ActionForm action={updateProfileAction} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} url={user.avatarUrl} size={64} />
              <div className="min-w-0 flex-1">
                <label className="label" htmlFor="avatar">Profile photo</label>
                <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" />
              </div>
            </div>
            {user.avatarUrl && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="removeAvatar" /> Remove current photo
              </label>
            )}
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required defaultValue={user.name} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" name="username" required defaultValue={user.username} className="input" />
            </div>
            <SubmitButton>Save profile</SubmitButton>
          </ActionForm>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Change password</h2>
          <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
            <div>
              <label className="label" htmlFor="current">Current password</label>
              <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm new password</label>
              <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
            </div>
            <SubmitButton>Change password</SubmitButton>
          </ActionForm>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Logged-in devices</h2>
            <p className="text-sm text-slate-500">Devices that are signed in to your account.</p>
          </div>
          {list.length > 1 && (
            <form action={revokeOtherSessionsAction}>
              <button className="btn btn-ghost">Log out all other devices</button>
            </form>
          )}
        </div>
        <ul className="divide-y divide-slate-100">
          {list.map((s) => {
            const current = s.id === user.sessionId;
            const mobile = /Android|iPhone|iPad|Mobile/i.test(s.userAgent ?? "");
            const Icon = mobile ? Smartphone : Monitor;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {parseUA(s.userAgent)}
                      {current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">This device</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      IP {s.ip ?? "unknown"} · {timeAgo(s.lastActiveAt)} · signed in{" "}
                      {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                    </p>
                  </div>
                </div>
                {!current && (
                  <form action={revokeSessionAction.bind(null, s.id)}>
                    <button className="btn btn-ghost">Revoke</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}