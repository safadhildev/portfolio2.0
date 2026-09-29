"use client";

import { useEffect } from "react";

/**
 * Scroll spy: keeps the URL hash in sync with the section in view.
 * Uses replaceState so scrolling doesn't pile up history entries or trigger a jump.
 */
export function SectionHashSync() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("main section[id]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const id = entry.target.id;
          const hash = id === "home" ? "" : `#${id}`;
          if (window.location.hash === hash) continue;

          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search + hash,
          );
          // replaceState doesn't fire hashchange; notify listeners (e.g. sidebar highlight).
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
      },
      // Active zone is a thin band around the middle of the viewport.
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
