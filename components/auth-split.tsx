import { ShieldCheck, Users, Wallet } from "lucide-react";

const display = "font-[family-name:var(--font-bebas)]";

export function AuthSplit({
  headline,
  text,
  formTitle,
  formHint,
  children,
}: {
  headline: React.ReactNode;
  text: string;
  formTitle: string;
  formHint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left panel: hidden on mobile and tablet */}
      <aside className="relative hidden overflow-hidden bg-linear-to-b from-cyan-200 via-cyan-300 to-teal-400 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-teal-300/60 blur-3xl" />
        <div className="absolute right-10 top-1/3 h-64 w-64 rounded-full border-2 border-white/50" />
        <div className="absolute right-24 top-[38%] h-36 w-36 rounded-full border-2 border-white/40" />
        <div className="absolute bottom-24 right-1/3 h-5 w-5 rounded-full bg-white/70" />

        <p className={`${display} relative text-3xl tracking-wider text-slate-900`}>Diyon Family</p>

        <div className="relative max-w-xl">
          <p className={`${display} text-lg tracking-[0.25em] text-slate-800/70`}>Host Payment Management System</p>
          <h1 className={`${display} mt-3 text-6xl leading-[0.95] text-slate-900 xl:text-7xl 2xl:text-8xl`}>{headline}</h1>
          <p className="mt-6 max-w-md text-lg text-slate-800/80">{text}</p>
        </div>

        <ul className="relative flex flex-wrap gap-3">
          {[
            { icon: Wallet, label: "Monthly payouts" },
            { icon: Users, label: "Family members" },
            { icon: ShieldCheck, label: "Secure access" },
          ].map((c) => (
            <li key={c.label} className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-slate-900 backdrop-blur">
              <c.icon className="h-4 w-4" />
              {c.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Right side: the form */}
      <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className={`${display} text-5xl tracking-wide text-slate-900`}>{formTitle}</h2>
          <p className="mb-8 mt-2 text-sm text-slate-500">{formHint}</p>
          {children}
        </div>
      </main>
    </div>
  );
}