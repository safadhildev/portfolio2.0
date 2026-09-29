import { SectionLabel } from "@/components/ui/SectionLabel";
import { SkillChip } from "@/components/ui/SkillChip";
import type { SkillsContent } from "@/lib/content";

interface SkillsSectionProps {
  skills: SkillsContent;
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">
      <div className="flex flex-col gap-3" data-aos="fade-up">
        <SectionLabel
          number={skills.sectionNumber}
          label={skills.sectionName}
        />
        <p className="font-display text-xl leading-snug text-ink  md:text-2xl">
          {skills.sectionTitle}
        </p>
        <p className="font-mono text-xs text-muted">
          {skills.skills.length} modules loaded ✓
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 md:gap-3">
        {skills.skills.map((skill, index) => (
          <div
            key={skill.label}
            data-aos="flip-right"
            data-aos-delay={Math.min(index * 100, 500)}
          >
            <SkillChip skill={skill} />
          </div>
        ))}
      </div>
    </div>
  );
}
