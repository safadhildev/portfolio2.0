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
      offset: 50,
    });
  }, []);

  return null;
}
