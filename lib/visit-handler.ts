import { parseVisitors, resolveVisitConfig, visitsCountUrl } from "./visit-counter.ts";
import type { VisitEnv, VisitResponse } from "./visit-counter.ts";

export interface VisitHandlerDeps {
  env: VisitEnv;
  /** Injected so tests never touch the network. */
  fetch: typeof fetch;
  warn: (message: string) => void;
}

// The Vercel API is hit at most about once per 5 minutes per CDN region; visitors see a cached total.
const OK_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";
const ERROR_CACHE = "public, s-maxage=60";
const TIMEOUT_MS = 5_000;

function json(body: VisitResponse, cacheControl: string): Response {
  return Response.json(body, {
    status: 200,
    headers: { "Cache-Control": cacheControl, "X-Robots-Tag": "noindex, nofollow" },
  });
}

/**
 * Reads the lifetime visitor total from the Vercel Web Analytics API. Expected failures never surface
 * as 5xx: missing env -> disabled, API failure -> error. The token never leaves the server.
 */
export function createVisitHandler(deps: VisitHandlerDeps): () => Promise<Response> {
  let missingEnvWarned = false;
  let failureLogged = false;

  const logFailure = (reason: string) => {
    if (failureLogged) return;
    failureLogged = true;
    deps.warn(`[visits] analytics query failed: ${reason}`);
  };

  return async () => {
    const config = resolveVisitConfig(deps.env);
    if (!config) {
      if (!missingEnvWarned) {
        missingEnvWarned = true;
        deps.warn("[visits] analytics env is not set; visit count is disabled");
      }
      return json({ status: "disabled" }, "no-store");
    }

    try {
      const res = await deps.fetch(visitsCountUrl(config), {
        headers: { Authorization: `Bearer ${config.token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        logFailure(`HTTP ${res.status}`);
        return json({ status: "error" }, ERROR_CACHE);
      }
      const visitors = parseVisitors(await res.json());
      if (visitors === null) {
        logFailure("unexpected response shape");
        return json({ status: "error" }, ERROR_CACHE);
      }
      return json({ status: "ok", visitors }, OK_CACHE);
    } catch (error) {
      logFailure(error instanceof Error ? error.message : "unknown error");
      return json({ status: "error" }, ERROR_CACHE);
    }
  };
}
