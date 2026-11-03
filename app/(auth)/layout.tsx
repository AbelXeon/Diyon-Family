import { Gem } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Gem className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Diyon Family</h1>
          <p className="text-sm text-slate-500">Host Payment Management System</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </main>
  );
}