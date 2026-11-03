import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { AuthSplit } from "@/components/auth-split";
import { AuthSubmit, FloatingInput } from "@/components/auth-fields";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSession()) redirect("/overview");
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);

  return (
    <AuthSplit
      headline="Sign in and keep every payout on track"
      text="Welcome back. Check your family members, update this month's payments and see how everything is going."
      formTitle="Sign in"
      formHint="Enter your username and password to continue."
    >
      <ActionForm action={loginAction} className="space-y-5">
        <FloatingInput id="username" name="username" label="Username" autoComplete="username" />
        <FloatingInput id="password" name="password" label="Password" type="password" autoComplete="current-password" />
        <AuthSubmit>Sign in</AuthSubmit>
      </ActionForm>
      {c === 0 && (
        <p className="mt-6 text-center text-sm">
          <Link href="/register" className="font-medium text-cyan-700 hover:underline">
            Create the admin account
          </Link>
        </p>
      )}
    </AuthSplit>
  );
}