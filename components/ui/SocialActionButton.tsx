import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

interface SocialActionButtonProps {
  href: string;
  label: string;
  backgroundColor: string;
  shadowColor?: string;
  textColor?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
}

export function SocialActionButton({
  href,
  label,
  backgroundColor,
  shadowColor,
  textColor = "#FFFDFC",
  icon,
  iconOnly = false,
}: SocialActionButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`flex h-[42px] items-center rounded-md border-2 font-mono text-[13px] font-bold shadow-[var(--btn-shadow)] transition-transform duration-100 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${iconOnly ? "w-[42px] justify-center" : "gap-[5px] px-4"}`}
      style={
        {
          backgroundColor,
          borderColor: backgroundColor,
          color: textColor,
          "--btn-shadow": `4px 4px 0 0 ${shadowColor ?? "#151515"}`,
        } as CSSProperties
      }
    >
      {icon}
      {!iconOnly && label}
    </Link>
  );
}
