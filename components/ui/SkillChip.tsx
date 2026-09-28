import { Icon } from "./Icon";
import type { Skill } from "@/lib/content";

interface SkillChipProps {
  skill: Skill;
}

export function SkillChip({ skill }: SkillChipProps) {
  return (
    <div
      className="flex items-center rounded-lg border-2 border-ink px-[14px] py-[10px] md:flex-col md:items-start md:gap-0.5"
      style={{ backgroundColor: skill.style.backgroundColor }}
    >
      <Icon name={skill.icon} size={16} alt={skill.title} className="md:hidden" />
      <p className="hidden font-mono text-[10px] font-normal text-ink/70 md:block">
        {skill.label}
      </p>
      <p className="hidden font-display text-base font-bold text-ink md:block">
        {skill.title}
      </p>
    </div>
  );
}
