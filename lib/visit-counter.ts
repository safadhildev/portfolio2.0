/** Body of every /api/visits response. The route always answers 200; clients branch on `status`. */
export type VisitResponse =
  | { status: "ok"; visitors: number }
  | { status: "disabled" }
  | { status: "error" };

/** Read: VERCEL_ANALYTICS_TOKEN, VERCEL_ANALYTICS_PROJECT_ID, VERCEL_ANALYTICS_TEAM_ID (team projects only). */
export type VisitEnv = Readonly<Record<string, string | undefined>>;

export interface VisitCounterConfig {
  token: string;
  projectId: string;
  teamId: string | null;
}

/** Returns null if the token or project id is missing. The team id is optional (personal accounts). */
export function resolveVisitConfig(env: VisitEnv): VisitCounterConfig | null {
  const token = env.VERCEL_ANALYTICS_TOKEN;
  const projectId = env.VERCEL_ANALYTICS_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId: env.VERCEL_ANALYTICS_TEAM_ID || null };
}

export const VISITS_COUNT_URL = "https://api.vercel.com/v1/query/web-analytics/visits/count";

/** Lifetime production visits for the whole project, no filter. */
export function visitsCountUrl(config: VisitCounterConfig): string {
  const url = new URL(VISITS_COUNT_URL);
  url.searchParams.set("projectId", config.projectId);
  if (config.teamId) url.searchParams.set("teamId", config.teamId);
  return url.toString();
}

/** Pulls `data.visitors` out of a visits/count body; null if the shape is not what the API documents. */
export function parseVisitors(body: unknown): number | null {
  const data = (body as { data?: { visitors?: unknown } } | null)?.data;
  const visitors = data?.visitors;
  return typeof visitors === "number" && Number.isSafeInteger(visitors) && visitors >= 0
    ? visitors
    : null;
}
