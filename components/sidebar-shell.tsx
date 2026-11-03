"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Gem, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { Avatar } from "./avatar";
import { logoutAction } from "@/app/actions/auth";

type U = { name: string; username: string; role: string; avatarUrl: string | null };

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, ownerOnly: false },
  { href: "/members", label: "Family Members", icon: Users, ownerOnly: false },
  { href: "/helpers", label: "Helpers", icon: ShieldCheck, ownerOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, ownerOnly: false },
];

export function SidebarShell({ user, children }: { user: U; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const brand = (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <Gem className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="font-semibold">Diyon Family</p>
        <p className="text-[11px] text-slate-500">Host Payment Management</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-100">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          {brand}
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.filter((n) => !n.ownerOnly || user.role === "owner").map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={user.name} url={user.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-slate-500">
                @{user.username} · {user.role === "owner" ? "Admin" : "Helper"}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost w-full">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}