import { useId } from "react";
import type { ResolvedTech } from "@/lib/experience";
import { getTechDescription } from "@/lib/tech-descriptions";
import { Icon } from "./Icon";
import { TechTag } from "./TechTag";
import { TooltipBubble, type TooltipAlign } from "./TooltipBubble";

interface TechIconChipProps {
  tech: ResolvedTech;
  tooltipAlign?: TooltipAlign;
}

export function TechIconChip({ tech, tooltipAlign }: TechIconChipProps) {
  const description = getTechDescription(tech.slug);
  const tooltipId = useId();
  const tooltipProps = description
    ? { tabIndex: 0, "aria-describedby": tooltipId }
    : {};
  const tooltip = description ? (
    <TooltipBubble
      id={tooltipId}
      text={`${tech.label}: ${description}`}
      align={tooltipAlign}
    />
  ) : null;

  // Slugs without an icon fall back to a text chip of the same height.
  if (tech.icon === null) {
    return (
      <li className="group relative outline-none" {...tooltipProps}>
        <TechTag
          label={tech.label}
          accentColor={tech.color ?? "#FFFFFF"}
          className="h-9 rounded-lg"
        />
        {tooltip}
      </li>
    );
  }

  return (
    <li
      className="group relative flex items-center justify-center w-[36px] h-[36px] rounded-lg border-2 border-ink px-1 py-1 outline-none md:w-[40px] md:h-[40px] lg:w-[48px] lg:h-[48px]"
      style={tech.color ? { backgroundColor: tech.color } : undefined}
      {...tooltipProps}
    >
      <Icon name={tech.icon} alt={tech.label} />
      {tooltip}
    </li>
  );
}
