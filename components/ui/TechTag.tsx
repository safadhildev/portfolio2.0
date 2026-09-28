interface TechTagProps {
  label: string;
  className?: string;
  accentColor: string;
}

export function TechTag({ label, className = "", accentColor }: TechTagProps) {
  return (
    <span
      className={`font-tag-mono inline-flex items-center rounded-md border-2 border-ink px-2.5 py-1 text-[11px] font-bold text-ink md:text-xs ${className}`}
      style={{ backgroundColor: accentColor }}
    >
      {label}
    </span>
  );
}
