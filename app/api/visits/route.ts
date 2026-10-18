import { createVisitHandler } from "@/lib/visit-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createVisitHandler({
  env: process.env,
  fetch: (input, init) => fetch(input, init),
  warn: (message) => console.warn(message),
});

export function GET() {
  return handler();
}
