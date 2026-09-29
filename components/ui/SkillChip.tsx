import { useId } from "react";
import { Icon } from "./Icon";
import { TooltipBubble, type TooltipAlign } from "./TooltipBubble";
import type { Skill } from "@/lib/content";
import { getTechDescription } from "@/lib/tech-descriptions";

interface SkillChipProps {
  skill: Skill;
  tooltipAlign?: TooltipAlign;
}

export function SkillChip({ skill, tooltipAlign }: SkillChipProps) {
  const description = getTechDescription(skill.icon);
  const tooltipId = useId();

  return (
    <div
      className="group relative flex items-center rounded-lg border-2 border-ink px-[14px] py-[10px] outline-none md:flex-col md:items-start md:gap-0.5"
      style={{ backgroundColor: skill.style.backgroundColor }}
      {...(description ? { tabIndex: 0, "aria-describedby": tooltipId } : {})}
    >
      <Icon name={skill.icon} size={16} alt={skill.title} className="md:hidden" />
      <p className="hidden font-mono text-[10px] font-normal text-ink/70 md:block">
        {skill.label}
      </p>
      <p className="hidden font-display text-base font-bold text-ink md:block">
        {skill.title}
      </p>
      {description && (
        <TooltipBubble id={tooltipId} text={description} align={tooltipAlign} />
      )}
    </div>
  );
}
