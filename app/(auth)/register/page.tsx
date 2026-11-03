import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  if (c > 0) redirect("/login");

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Create admin account</h2>
      <ActionForm action={registerAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" name="username" required autoComplete="username" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <SubmitButton className="btn btn-primary w-full">Create account</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-slate-500 hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}