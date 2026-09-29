import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { BoxView } from "./BoxVIew";

interface WindowChromeProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className"
> {
  filename: string;
  accentColor: string;
  /** "compact" is the 38px titlebar used by the experience cards. */
  size?: "default" | "compact";
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function WindowChrome({
  filename,
  accentColor,
  size = "default",
  className = "",
  bodyClassName = "",
  children,
  ...rest
}: WindowChromeProps) {
  return (
    <BoxView className={className} {...rest}>
      <div
        className={`flex h-[38px] shrink-0 items-center justify-between border-b-[3px] border-ink px-[14px] font-mono text-[11px] font-bold text-ink ${
          size === "compact" ? "md:px-4" : "md:h-11 md:px-4 md:text-[13px]"
        }`}
        style={{ backgroundColor: accentColor }}
      >
        <span className="truncate">
          <span aria-hidden="true">● </span>
          {filename}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 opacity-50 tracking-[0.20em]"
        >
          — □ ×
        </span>
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </BoxView>
  );
}
