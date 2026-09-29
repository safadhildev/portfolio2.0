"use client";

import { useEffect, useState } from "react";

/**
 * Current URL hash, defaulting to "#home". Follows hashchange, including the
 * synthetic one SectionHashSync dispatches while scrolling.
 */
export function useActiveHash(): string {
  const [hash, setHash] = useState("#home");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "#home");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return hash;
}
