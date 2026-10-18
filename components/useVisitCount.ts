"use client";

import { useEffect, useState } from "react";
import type { VisitResponse } from "@/lib/visit-counter";

export type VisitCountState =
  | { kind: "loading" }
  | { kind: "ready"; visitors: number }
  | { kind: "hidden" };

/**
 * Lifetime visitor total from Vercel Web Analytics, via the CDN-cached /api/visits.
 * Any failure hides the figure instead of showing an error.
 */
export function useVisitCount(): VisitCountState {
  const [state, setState] = useState<VisitCountState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/visits", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<VisitResponse>) : null))
      .then((body) => {
        setState(
          body?.status === "ok" ? { kind: "ready", visitors: body.visitors } : { kind: "hidden" },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "hidden" });
      });

    return () => controller.abort();
  }, []);

  return state;
}
