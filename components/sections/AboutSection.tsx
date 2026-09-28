import { WindowChrome } from "@/components/ui/WindowChrome";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { AboutContent } from "@/lib/content";

interface AboutSectionProps {
  about: AboutContent;
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-20 py-10 md:py-14 xl:scroll-mt-[96px]">
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <div
          className="flex flex-col gap-3 md:w-[267px] md:shrink-0 xl:w-[390px]"
          data-aos="fade-up"
        >
          <SectionLabel number={about.sectionNumber} label={about.sectionName} />
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl xl:text-5xl">
            {about.sectionTitle}
          </h2>
          <p className="font-mono text-sm text-muted">$ whoami --verbose</p>
        </div>
        <div className="flex-1" data-aos="zoom-in-left" data-aos-delay="100">
          <WindowChrome filename="README.md" accentColor="#66E3B4" bodyClassName="flex flex-col gap-3 p-4 md:gap-5 md:p-[34px]">
            <p className="font-mono text-xs font-bold text-markdown md:text-sm">
              ## developer_profile
            </p>
            <p className="whitespace-pre-line font-code text-xs leading-[1.4] text-ink md:text-base">
              {about.content}
            </p>
          </WindowChrome>
        </div>
      </div>
    </section>
  );
}
