"use client";

import { assertNever } from "@/lib/experience";
import { useVisitCount } from "@/components/useVisitCount";
import type { VisitCountState } from "@/components/useVisitCount";

const formatCount = new Intl.NumberFormat("en-US");

function VisitSegment({ state }: { state: VisitCountState }) {
  switch (state.kind) {
    case "hidden":
      return null;
    case "loading":
      return (
        <span className="inline-block min-w-[11ch] text-mint tabular-nums">
          <span aria-hidden="true">◉ ···</span>
          <span className="sr-only">Loading visitor count</span>
        </span>
      );
    case "ready":
      return (
        <span className="inline-block min-w-[11ch] text-mint tabular-nums">
          <span aria-hidden="true">◉ </span>
          {formatCount.format(state.visitors)} {state.visitors === 1 ? "visitor" : "visitors"}
        </span>
      );
    default:
      return assertNever(state);
  }
}

export function IdeStatusFooter() {
  const visits = useVisitCount();

  return (
    <footer className="flex w-full flex-wrap items-center justify-between gap-2 bg-ink px-4 py-3 font-mono text-[10px] lg:fixed lg:inset-x-0 lg:bottom-0 lg:h-[46px] lg:flex-nowrap lg:px- lg:py-0 lg:text-xs">
      <p className="flex flex-wrap items-center gap-x-3 text-cream">
        <span>⑂ main ✓ synced 0 errors 0 warnings</span>
        <VisitSegment state={visits} />
      </p>
      <p className="text-yellow-alt">SAF/dev © 2026 UTF-8 LF JavaScript</p>
    </footer>
  );
}
