import { WindowChrome } from "@/components/ui/WindowChrome";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { AboutContent } from "@/lib/content";

interface AboutSectionProps {
  about: AboutContent;
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-20 py-10 sm:py-14 sm:scroll-mt-[96px]">
      <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
        <div
          className="flex flex-col gap-3 sm:w-[390px] sm:shrink-0"
          data-aos="fade-up"
        >
          <SectionLabel number={about.sectionNumber} label={about.sectionName} />
          <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">
            {about.sectionTitle}
          </h2>
          <p className="font-mono text-sm text-muted">$ whoami --verbose</p>
        </div>
        <div className="flex-1" data-aos="zoom-in-left" data-aos-delay="100">
          <WindowChrome filename="README.md" accentColor="#66E3B4" bodyClassName="flex flex-col gap-3 p-4 sm:gap-5 sm:p-[34px]">
            <p className="font-mono text-xs font-bold text-markdown sm:text-sm">
              ## developer_profile
            </p>
            <p className="whitespace-pre-line font-code text-xs leading-[1.4] text-ink sm:text-base">
              {about.content}
            </p>
          </WindowChrome>
        </div>
      </div>
    </section>
  );
}
