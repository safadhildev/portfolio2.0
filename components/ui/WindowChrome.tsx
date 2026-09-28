import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface WindowChromeProps extends Omit<ComponentPropsWithoutRef<"div">, "className"> {
  filename: string;
  accentColor: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function WindowChrome({
  filename,
  accentColor,
  className = "",
  bodyClassName = "",
  children,
  ...rest
}: WindowChromeProps) {
  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-lg border-[3px] border-ink bg-cream shadow-[6px_6px_0_0_#151515] md:shadow-[8px_8px_0_0_#151515] ${className}`}
      {...rest}
    >
      <div
        className="flex h-[38px] shrink-0 items-center justify-between border-b-[3px] border-ink px-[14px] font-mono text-[11px] font-bold text-ink md:h-11 md:px-4 md:text-[13px]"
        style={{ backgroundColor: accentColor }}
      >
        <span className="truncate">● {filename}</span>
        <span className="shrink-0 opacity-50 tracking-[0.20em]">— □ ×</span>
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
