"use client";

import { useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/components/constants";
import { useActiveHash } from "@/components/useActiveHash";

interface IdeNavigationProps {
  visibleHrefs: ReadonlySet<string>;
}

export function IdeNavigation({ visibleHrefs }: IdeNavigationProps) {
  const hash = useActiveHash();
  const links = NAV_LINKS.filter((link) => visibleHrefs.has(link.href));

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY <= 0) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 4) {
        setVisible(false);
      }

      lastScrollY.current = currentY;

      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
      scrollStopTimer.current = setTimeout(() => setVisible(true), 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 h-14 w-full bg-ink transition-transform duration-300 lg:fixed lg:inset-x-0 lg:top-0 lg:h-[72px] ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      {/* Mobile / narrow-desktop nav: logo + handle + nav links */}
      <div className="flex h-full items-center justify-between px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded border-2 border-cream bg-yellow-alt">
            <span className="font-mono text-xs font-bold text-ink">SAF</span>
          </div>
          <span className="font-mono text-xs font-bold text-cream max-[389px]:hidden">
            fadhil.dev
          </span>
        </div>
        <nav className="flex items-center gap-2 font-mono text-xs font-bold min-[390px]:gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={hash === link.href ? "location" : undefined}
              className={hash === link.href ? "text-yellow-alt" : "text-cream"}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Full desktop nav: native-window titlebar look */}
      <div className="relative hidden h-full items-center justify-center lg:flex">
        <div className="absolute left-[30px] flex items-center gap-[6px]">
          <span className="size-[11px] rounded-[3px] border border-black bg-[#ff4d6d] shadow-[1px_1px_0_0_black]" />
          <span className="size-[11px] rounded-[3px] border border-black bg-yellow shadow-[1px_1px_0_0_black]" />
          <span className="size-[11px] rounded-[3px] border border-black bg-[#4aff91] shadow-[1px_1px_0_0_black]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border-2 border-cream bg-yellow-alt">
            <span className="font-mono text-sm font-bold text-black">SAF</span>
          </div>
          <p className="font-mono text-[11px] tracking-[0.55px]">
            <span className="text-[#666]">fadhil.dev — </span>
            <span className="text-[#f0ede0]">Portfolio</span>
          </p>
        </div>
      </div>
    </header>
  );
}
