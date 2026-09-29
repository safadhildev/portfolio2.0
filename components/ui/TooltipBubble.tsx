export type TooltipAlign = "start" | "end";

interface TooltipBubbleProps {
  id: string;
  text: string;
  align?: TooltipAlign;
}

/**
 * CSS-only tooltip. Render inside an element that has `group relative` and
 * `aria-describedby={id}`; it shows on hover and keyboard focus of that element.
 */
export function TooltipBubble({ id, text, align = "start" }: TooltipBubbleProps) {
  return (
    <span
      id={id}
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-30 mb-2 w-max max-w-[min(200px,60vw)] rounded-md border-2 border-ink bg-ink px-2.5 py-1.5 text-left font-mono text-[11px] font-normal leading-snug text-cream opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {text}
    </span>
  );
}
