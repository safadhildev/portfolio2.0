import { after, userAgent } from "next/server";
import { createResumeHandler } from "@/lib/resume-handler";
import { createUpstashStore } from "@/lib/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createResumeHandler({
  env: process.env,
  createStore: createUpstashStore,
  schedule: (task) => after(task),
  isBot: (req) => userAgent(req).isBot,
  now: () => new Date(),
  warn: (message) => console.warn(message),
});

export function GET(req: Request) {
  return handler(req);
}

export function HEAD(req: Request) {
  return handler(req);
}
