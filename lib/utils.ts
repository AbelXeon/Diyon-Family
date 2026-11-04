export const CURRENCY = "USD";

export function formatMoney(n: number | string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY }).format(Number(n));
}

/** The payout cycle opens on the 5th. Before the 5th we still show last month. */
export function currentCycleMonth(d = new Date()) {
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  if (d.getUTCDate() < 5) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function recentCycles(n = 12) {
  const [y, m] = currentCycleMonth().split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthLabel(ym: string) {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export type Unit = "day" | "week" | "month" | "year";

export const RANGES: Record<string, { unit: Unit; n: number; label: string }> = {
  day: { unit: "day", n: 30, label: "Days" },
  week: { unit: "week", n: 12, label: "Weeks" },
  month: { unit: "month", n: 12, label: "Months" },
  year: { unit: "year", n: 5, label: "Years" },
};

export function bucketStart(d: Date, unit: Unit) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (unit === "week") x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  if (unit === "month") x.setUTCDate(1);
  if (unit === "year") {
    x.setUTCMonth(0);
    x.setUTCDate(1);
  }
  return x;
}

export function shiftBucket(d: Date, unit: Unit, back: number) {
  const x = new Date(d);
  if (unit === "day") x.setUTCDate(x.getUTCDate() - back);
  if (unit === "week") x.setUTCDate(x.getUTCDate() - 7 * back);
  if (unit === "month") x.setUTCMonth(x.getUTCMonth() - back);
  if (unit === "year") x.setUTCFullYear(x.getUTCFullYear() - back);
  return x;
}

export function bucketLabel(d: Date, unit: Unit) {
  const o: Intl.DateTimeFormatOptions =
    unit === "year"
      ? { year: "numeric" }
      : unit === "month"
      ? { month: "short", year: "numeric" }  // Result: "Nov 2026"
      : { month: "short", day: "numeric" };  // Result for Days/Weeks: "Nov 4"
  return d.toLocaleDateString("en-US", { ...o, timeZone: "UTC" });
}

export function parseUA(ua?: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}

export function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 120) return "Active now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function isUniqueViolation(e: unknown) {
  const c = e as { code?: string; cause?: { code?: string } };
  return c?.code === "23505" || c?.cause?.code === "23505" || /duplicate key/i.test(String(e) + String(c?.cause));
}