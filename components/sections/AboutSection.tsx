import { SectionLabel } from "@/components/ui/SectionLabel";
import { WindowChrome } from "@/components/ui/WindowChrome";
import type { AboutContent, SkillsContent } from "@/lib/content";
import { SkillsSection } from "./SkillsSection";
import { BoxView } from "../ui/BoxVIew";

interface AboutSectionProps {
  about: AboutContent;
  skills: SkillsContent;
  number: number;
}

export function AboutSection({ about, number, skills }: AboutSectionProps) {
  return (
    <section
      id="about"
      className="scroll-mt-20 sm:scroll-mt-25 lg:scroll-mt-[90px]"
      data-aos="fade-up"
    >
      <BoxView
        id="about"
        className="bg-yellow-alt flex flex-col gap-16 px-4 py-6 mt-10 shadow-none md:mt-20 md:shadow-[6px_6px_0_0_#151515] lg:gap-10"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="flex flex-col flex-1 gap-3 lg:shrink-0">
            <SectionLabel number={number} label={about.sectionName} />
            <h2 className="font-display text-3xl font-bold leading-tight text-ink lg:text-5xl">
              {about.sectionTitle}
            </h2>
            <p className="font-mono text-sm text-muted">$ whoami --verbose</p>
          </div>
          <div className="flex-2" data-aos="zoom-in-left" data-aos-delay="100">
            <WindowChrome
              filename="README.md"
              accentColor="#66E3B4"
              bodyClassName="flex flex-col gap-3 p-4 lg:gap-5 lg:p-[34px]"
              data-aos="zoom-in-right"
              data-aos-anchor-placement="left-bottom"
            >
              <p className="font-mono text-xs font-bold text-markdown lg:text-sm">
                ## developer_profile
              </p>
              <p className="whitespace-pre-line font-code text-xs leading-[1.4] text-ink lg:text-base">
                {about.content}
              </p>
            </WindowChrome>
          </div>
        </div>
        {skills.skills.length > 0 && (
          <SkillsSection skills={skills} number={number + 1} />
        )}
      </BoxView>
    </section>
  );
}
