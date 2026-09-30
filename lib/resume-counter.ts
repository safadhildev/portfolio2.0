import { createHash } from "node:crypto";
import { assertNever } from "./experience.ts";

export type ResumeRequestKind = "count" | "head" | "prefetch" | "bot";

export interface ResumeRequestInfo {
  method: string;
  userAgent: string;
  isBot: boolean;
  secPurpose: string | null;
  purpose: string | null;
}

/** Only a real, non-prefetch, non-bot GET counts as an open. */
export function classifyResumeRequest(i: ResumeRequestInfo): ResumeRequestKind {
  if (i.method.toUpperCase() !== "GET") return "head";
  const purpose = `${i.secPurpose ?? ""} ${i.purpose ?? ""}`.toLowerCase();
  if (purpose.includes("prefetch")) return "prefetch";
  if (i.isBot || i.userAgent.trim() === "") return "bot";
  return "count";
}

export function isCountedKind(kind: ResumeRequestKind): boolean {
  switch (kind) {
    case "count":
      return true;
    case "head":
    case "prefetch":
    case "bot":
      return false;
    default:
      return assertNever(kind);
  }
}

/** "2026-09-30" in UTC. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Salted, per-day visitor id. The raw IP and UA are hashed here and never stored or logged. */
export function visitorHash(
  salt: string,
  ip: string,
  ua: string,
  day: string,
): string {
  return createHash("sha256").update(`${salt}|${ip}|${ua}|${day}`).digest("hex");
}

/** Subset of the @upstash/redis client that the counter needs. */
export interface CounterStore {
  set(key: string, value: string, options: { nx: true; ex: number }): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
}

export const RESUME_KEYS = {
  total: "resume:opens:total",
  unique: "resume:opens:unique",
  daily: "resume:opens:daily",
  seen: (hash: string) => `resume:seen:${hash}`,
} as const;

// A bit over 24h, so one visitor-day key always outlives its UTC day.
export const SEEN_TTL_SECONDS = 90_000;

/** Always counts the open; counts a unique (and the day bucket) only the first time this hash is seen. */
export async function recordResumeOpen(
  store: CounterStore,
  input: { hash: string; day: string },
): Promise<void> {
  await store.incr(RESUME_KEYS.total);
  const first = await store.set(RESUME_KEYS.seen(input.hash), "1", {
    nx: true,
    ex: SEEN_TTL_SECONDS,
  });
  if (first === "OK") {
    await store.incr(RESUME_KEYS.unique);
    await store.hincrby(RESUME_KEYS.daily, input.day, 1);
  }
}
