import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { AuthSplit } from "@/components/auth-split";
import { AuthSubmit, FloatingInput, PasswordFields } from "@/components/auth-fields";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  if (c > 0) redirect("/login");

  return (
    <AuthSplit
      headline="Register to start using Diyon Family"
      text="Create the admin account, add your family members and track every monthly payment in one place."
      formTitle="Create account"
      formHint="Set up the admin account. This can only be done once."
    >
      <ActionForm action={registerAction} className="space-y-5">
        <FloatingInput id="name" name="name" label="Full name" autoComplete="name" />
        <FloatingInput id="username" name="username" label="Username" autoComplete="username" />
        <PasswordFields />
        <AuthSubmit>Create account</AuthSubmit>
      </ActionForm>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-slate-500 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplit>
  );
}