import {
  classifyResumeRequest,
  isCountedKind,
  recordResumeOpen,
  utcDay,
  visitorHash,
} from "./resume-counter.ts";
import type { CounterStore } from "./resume-counter.ts";
import { RESUME_FILE } from "./resume.ts";

/** Read: VERCEL_ENV, KV_REST_API_URL/_TOKEN (or UPSTASH_REDIS_REST_URL/_TOKEN), RESUME_COUNTER_SALT. */
export type ResumeEnv = Readonly<Record<string, string | undefined>>;

export interface ResumeHandlerDeps {
  env: ResumeEnv;
  /** Builds a store from resolved credentials. Injected so tests never touch the network. */
  createStore: (creds: { url: string; token: string }) => CounterStore;
  /** Runs work after the response is sent (next/server `after`). */
  schedule: (task: () => Promise<void>) => void;
  isBot: (req: Request) => boolean;
  now: () => Date;
  warn: (message: string) => void;
}

export interface ResumeCounterConfig {
  url: string;
  token: string;
  salt: string;
}

/** Marketplace injects KV_REST_API_*; plain Upstash uses UPSTASH_REDIS_REST_*. Returns null if anything is missing. */
export function resolveCounterConfig(env: ResumeEnv): ResumeCounterConfig | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  const salt = env.RESUME_COUNTER_SALT;
  if (!url || !token || !salt) return null;
  return { url, token, salt };
}

const MAX_HEADER_LENGTH = 512;

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded ? forwarded.split(",")[0].trim() : "";
  return (first || req.headers.get("x-real-ip") || "").slice(0, MAX_HEADER_LENGTH);
}

function redirect(): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/${RESUME_FILE}`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * Always answers 307 -> the static PDF. Counting is best effort, runs after the response, and can never
 * change the outcome: any failure is caught and logged (first one only) and the redirect is unaffected.
 */
export function createResumeHandler(deps: ResumeHandlerDeps): (req: Request) => Response {
  let missingEnvWarned = false;
  let failureLogged = false;

  const logFailure = (error: unknown) => {
    if (failureLogged) return;
    failureLogged = true;
    const reason = error instanceof Error ? error.message : "unknown error";
    deps.warn(`[resume] counter write failed: ${reason}`);
  };

  return (req) => {
    try {
      const userAgent = (req.headers.get("user-agent") ?? "").slice(0, MAX_HEADER_LENGTH);
      const kind = classifyResumeRequest({
        method: req.method,
        userAgent,
        isBot: deps.isBot(req),
        secPurpose: req.headers.get("sec-purpose"),
        purpose: req.headers.get("purpose"),
      });

      if (isCountedKind(kind) && deps.env.VERCEL_ENV === "production") {
        const config = resolveCounterConfig(deps.env);
        if (!config) {
          if (!missingEnvWarned) {
            missingEnvWarned = true;
            deps.warn("[resume] counter env is not set; skipping the count");
          }
        } else {
          const now = deps.now();
          const day = utcDay(now);
          const hash = visitorHash(config.salt, clientIp(req), userAgent, day);
          deps.schedule(async () => {
            try {
              await recordResumeOpen(deps.createStore(config), { hash, day });
            } catch (error) {
              logFailure(error);
            }
          });
        }
      }
    } catch (error) {
      logFailure(error);
    }
    return redirect();
  };
}
