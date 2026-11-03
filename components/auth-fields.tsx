"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";

const display = "font-[family-name:var(--font-bebas)]";

export function FloatingInput({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  minLength,
  value,
  onChange,
  state,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  value?: string;
  onChange?: (v: string) => void;
  state?: "error" | "ok";
}) {
  const [inner, setInner] = useState("");
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const ring =
    state === "error"
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : state === "ok"
        ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100"
        : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100";

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={isPw && show ? "text" : type}
        value={value ?? inner}
        onChange={(e) => {
          setInner(e.target.value);
          onChange?.(e.target.value);
        }}
        placeholder=" "
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={`peer w-full rounded-xl border bg-white px-4 pb-2 pt-6 text-base text-slate-900 outline-none transition focus:ring-4 ${isPw ? "pr-12" : ""} ${ring}`}
      />
      <label
        htmlFor={id}
        className={`${display} pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl tracking-wide text-slate-400 transition-all duration-200 peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-cyan-700 peer-autofill:top-3 peer-autofill:translate-y-0 peer-autofill:text-sm peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-sm`}
      >
        {label}
      </label>
      {isPw && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}

function strengthScore(p: string) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length < 8) s = Math.min(s, 1);
  return Math.max(1, s);
}

const LEVELS = [
  { label: "", bar: "bg-slate-200", text: "text-slate-400" },
  { label: "Weak", bar: "bg-rose-500", text: "text-rose-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

function StrengthMeter({ password }: { password: string }) {
  const s = strengthScore(password);
  const lvl = LEVELS[s];
  return (
    <div className="mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${lvl.bar}`} style={{ width: `${s * 25}%` }} />
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <span className="text-xs text-slate-500">Use 8+ characters with upper and lower case, numbers and symbols.</span>
        <span className={`${display} shrink-0 text-lg leading-none tracking-wide ${lvl.text}`}>{lvl.label}</span>
      </div>
    </div>
  );
}

export function PasswordFields() {
  const [pw, setPw] = useState("");
  const [cf, setCf] = useState("");
  const state = cf ? (cf === pw ? "ok" : "error") : undefined;

  return (
    <>
      <div>
        <FloatingInput id="password" name="password" label="Password" type="password" autoComplete="new-password" minLength={8} value={pw} onChange={setPw} />
        <StrengthMeter password={pw} />
      </div>
      <div>
        <FloatingInput id="confirm" name="confirm" label="Confirm password" type="password" autoComplete="new-password" minLength={8} value={cf} onChange={setCf} state={state} />
        {cf &&
          (cf === pw ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="h-4 w-4" /> Passwords match
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-rose-600">
              <X className="h-4 w-4" /> Passwords do not match
            </p>
          ))}
      </div>
    </>
  );
}

export function AuthSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${display} flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-xl tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60`}
    >
      {pending && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}