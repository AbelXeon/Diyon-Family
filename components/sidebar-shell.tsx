"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

type U = { name: string; username: string; role: string; avatarUrl: string | null };

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, ownerOnly: false },
  { href: "/members", label: "Family Members", icon: Users, ownerOnly: false },
  { href: "/helpers", label: "Helpers", icon: ShieldCheck, ownerOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, ownerOnly: false },
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function ProfilePic({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-24 w-24 rounded-full object-cover" />;
  }
  return (
    <span className="font-display flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-200 to-teal-400 text-4xl tracking-wider text-slate-900">
      {initials(name)}
    </span>
  );
}

const LINK_BASE =
  "relative flex items-center gap-3 rounded-l-full py-3.5 pl-6 pr-4 font-display text-xl tracking-widest transition-colors";
const LINK_ON =
  "bg-brand-50 text-brand-900 before:absolute before:right-0 before:-top-4 before:h-4 before:w-4 before:rounded-br-2xl before:shadow-[4px_4px_0_4px_#e8f4f5] after:absolute after:right-0 after:-bottom-4 after:h-4 after:w-4 after:rounded-tr-2xl after:shadow-[4px_-4px_0_4px_#e8f4f5]";
const LINK_OFF = "text-cyan-50/70 hover:bg-white/10 hover:text-white";

export function SidebarShell({ user, children }: { user: U; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-brand-50 lg:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-brand-900 px-4 text-white lg:hidden">
        <p className="font-display text-2xl tracking-[0.15em]">Diyon Family</p>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-white/10">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col rounded-r-[2rem] bg-brand-900 py-6 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-4 top-4 rounded-lg p-2 text-cyan-100/80 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="px-6 text-center">
          <p className="font-display text-3xl tracking-[0.15em] text-white">Diyon Family</p>
          <p className="font-display text-sm tracking-[0.2em] text-cyan-200/70">Host Payment Management System</p>
        </div>

        {/* Profile */}
        <div className="mt-8 flex flex-col items-center px-6 text-center">
          <div className="rounded-full p-1.5 ring-2 ring-cyan-300">
            <ProfilePic name={user.name} url={user.avatarUrl} />
          </div>
          <p className="font-display mt-4 max-w-full truncate text-2xl tracking-widest">{user.name}</p>
          <p className="max-w-full truncate text-xs text-cyan-100/60">@{user.username}</p>
        </div>

        {/* Menu */}
        <nav className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto py-5 pl-5">
          {NAV.filter((n) => !n.ownerOnly || user.role === "owner").map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`${LINK_BASE} ${active ? LINK_ON : LINK_OFF}`}>
                <n.icon className={`h-5 w-5 ${active ? "text-teal-600" : "text-cyan-300"}`} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <form action={logoutAction} className="px-5">
          <button className="font-display flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/30 py-3 text-xl tracking-widest text-cyan-100 transition-colors hover:bg-white/10">
            <LogOut className="h-5 w-5" /> Log out
          </button>
        </form>
      </aside>

      {/* [&>div]:max-w removes the big empty space beside the content */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 [&>div]:max-w-[1800px]">{children}</main>
    </div>
  );
}