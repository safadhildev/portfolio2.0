"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export function AosInit() {
  useEffect(() => {
    AOS.init({
      duration: 300,
      easing: "ease-out-cubic",
      once: false,
      // Whether elements should animate out while scrolling past them
      mirror: true,
      offset: 50,
      // Reduced motion: AOS removes the data-aos attributes so content shows immediately.
      disable: () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  return null;
}
