import { ResumeButton } from "@/components/ui/ResumeButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { iconSources } from "@/components/ui/icon-sources";
import type { ExperienceContent, SkillsContent } from "@/lib/content";
import { buildExperienceView } from "@/lib/experience";
import type { ExperienceItemView } from "@/lib/experience";
import { ExperienceCard } from "./ExperienceCard";

const AVAILABLE_ICONS: ReadonlySet<string> = new Set(Object.keys(iconSources));

interface ExperienceSectionProps {
  experience: ExperienceContent;
  skills: SkillsContent;
  number: number;
}

interface ExperienceTimelineItemProps {
  item: ExperienceItemView;
  index: number;
  isLast: boolean;
}

function ExperienceTimelineItem({
  item,
  index,
  isLast,
}: ExperienceTimelineItemProps) {
  const badge = item.badgeLabel === "Present" ? "NOW" : item.badgeLabel;
  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 md:gap-x-6">
      {/* Rail is decorative: the badge repeats the <time> inside the card. */}
      <div
        aria-hidden="true"
        className="flex flex-col items-center"
        data-aos="fade-down"
        data-aos-delay={Math.min(index * 100, 500)}
        data-aos-duration="500"
      >
        <div
          data-aos="zoom-in"
          className="mt-1 flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-white"
        >
          <span className={`z-10 font-mono font-bold text-ink text-[10px]`}>
            {badge}
          </span>
        </div>
        {!isLast && <span className="w-[2px] mb-[-10px] flex-1 bg-ink" />}
      </div>
      {/* The entry gap is padding on this cell so the rail line runs through it. */}
      <div className={isLast ? "" : "pb-8 md:pb-14"}>
        <div data-aos="fade-up" data-aos-delay={Math.min(index * 100, 500)}>
          <ExperienceCard item={item} />
        </div>
      </div>
    </li>
  );
}

export function ExperienceSection({
  experience,
  skills,
  number,
}: ExperienceSectionProps) {
  const items = buildExperienceView(experience, skills.skills, AVAILABLE_ICONS);

  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="scroll-mt-10 py-10 lg:scroll-mt-[70px]"
    >
      <div
        className="mb-9 flex flex-col gap-3 md:mb-[34px] md:flex-row md:items-end md:justify-between md:gap-6"
        data-aos="fade-up"
      >
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-3 md:gap-4">
            <SectionLabel
              number={number}
              label={experience.sectionName}
            />
            <h2
              id="experience-title"
              className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl xl:text-5xl"
            >
              {experience.sectionTitle}
            </h2>
          </div>
          <p className="mt-3 font-mono text-xs text-muted md:mt-0 md:text-[13px]">
            <span className="md:hidden">$ experience --timeline</span>
            <span className="hidden md:inline">
              {items.length} entries • verified
            </span>
          </p>
        </div>
        <ResumeButton className="self-start md:shrink-0 md:self-auto" />
      </div>
      <ol aria-label="Work history">
        {items.map((item, index) => (
          <ExperienceTimelineItem
            key={item.key}
            item={item}
            index={index}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}
