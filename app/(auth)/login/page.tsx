import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSession()) redirect("/overview");
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Sign in</h2>
      <ActionForm action={loginAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" name="username" required autoComplete="username" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <SubmitButton className="btn btn-primary w-full">Sign in</SubmitButton>
      </ActionForm>
      {c === 0 && (
        <p className="mt-4 text-center text-sm">
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">Create the admin account</Link>
        </p>
      )}
    </>
  );
}