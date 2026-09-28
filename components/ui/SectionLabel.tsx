interface SectionLabelProps {
  number: number;
  label: string;
}

export function SectionLabel({ number, label }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center bg-ink md:size-[38px]">
        <span className="font-mono text-xs font-bold text-cream">
          {String(number).padStart(2, "0")}
        </span>
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-wide text-ink">
        {label}
      </span>
    </div>
  );
}
