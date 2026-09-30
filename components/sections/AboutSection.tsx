import { SectionLabel } from "@/components/ui/SectionLabel";
import { WindowChrome } from "@/components/ui/WindowChrome";
import type { AboutContent } from "@/lib/content";

interface AboutSectionProps {
  about: AboutContent;
  number: number;
}

export function AboutSection({ about, number }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-30 sm:scroll-mt-25 lg:scroll-mt-[120px]">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div
          className="flex flex-col flex-1 gap-3 lg:shrink-0"
          data-aos="fade-up"
        >
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
    </section>
  );
}
