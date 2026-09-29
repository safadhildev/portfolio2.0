"use client";

import { WindowChrome } from "@/components/ui/WindowChrome";
import { Icon } from "@/components/ui/Icon";
import type { HeroContent } from "@/lib/content";
import { ParticlesBg } from "@/components/ui/ParticlesBg";

interface HomeSectionProps {
  hero: HeroContent;
}

const LINE_NUMBERS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
];

function renderCodeLine(description: string) {
  const match = description.match(/^(const)\s(.*)$/);
  if (!match) return description;
  return (
    <>
      <span className="text-pink">const</span> {match[2]}
    </>
  );
}

export function HomeSection({ hero }: HomeSectionProps) {
  const titleWords = hero.title.trim().split(" ");
  const lastWord = titleWords.pop();
  const leadingTitle = titleWords.join(" ");

  return (
    <section id="home" data-aos="zoom-in-right" className="scroll-mt-[100px]">
      <WindowChrome
        filename="home.tsx — Portfolio"
        accentColor="#FF5CAA"
        bodyClassName="relative"
      >
        <div className="flex">
          <div className="flex flex-col items-end gap-[16px] md:gap-[26px] px-2 py-5 font-mono text-xs md:text-sm text-ink/30 bg-[#E8E3D8] md:py-6 md:px-5">
            {LINE_NUMBERS.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="relative flex flex-1 flex-col items-start px-4 py-4  md:px-[38px] md:py-[26px]">
            <ParticlesBg type="cobweb" num={50}/>
            {hero.comments.map((comment) => (
              <p key={comment} className="font-mono text-sm text-[#169b62]">
                {`// ${comment}`}
              </p>
            ))}
            <div className="flex flex-1 flex-col mt-8 gap-6">
              <h1
                data-aos="fade-down"
                className="font-display text-[36px] line font-bold leading-none text-ink sm:text-[56px]  lg:text-[80px] xl:text-[108px]"
              >
                {leadingTitle}
                <br />
                <span className="underline text-mint">{lastWord}</span>
              </h1>
              <p className="font-mono text-base font-semibold text-ink text-[10px] md:text-[18px]">
                {renderCodeLine(hero.description)}
              </p>
            </div>
            <div className="flex flex-1 w-full items-end justify-end md:pt-10 md:items-start md:justify-start gap-3 pt-3.5">
              {hero.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-aos="zoom-in"
                  className="btn-press flex h-[42px] items-center gap-1.5 rounded-md border-2 border-ink bg-linkedin px-4 font-mono text-[13px] font-bold text-cream"
                >
                  <Icon
                    className="md:hidden"
                    name="linkedin"
                    size={18}
                    alt=""
                  />
                  <Icon
                    className="hidden md:block"
                    name="external-link"
                    size={18}
                    alt=""
                  />
                  <span className="hidden md:inline">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-markdown px-3.5 py-2 font-mono text-[11px] text-cream">
          <span>⑂ main*</span>
          <span className="hidden md:inline">
            UTF-8 TypeScript React Ln 10, Col 24
          </span>
        </div>
      </WindowChrome>
    </section>
  );
}
