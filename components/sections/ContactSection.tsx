import { SectionLabel } from "@/components/ui/SectionLabel";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { SocialActionButton } from "@/components/ui/SocialActionButton";
import { Icon } from "@/components/ui/Icon";
import type { ReactNode } from "react";
import type { ContactContent } from "@/lib/content";

const SOCIAL_ICONS: Record<string, ReactNode> = {
  LinkedIn: <Icon name="linkedin" size={20} alt="LinkedIn" />,
  YouTube: <Icon name="youtube" color="#FFFFFF"  size={20} alt="YouTube" />,
  Github: <Icon name="github" size={20} alt="GitHub" />,
  Instagram: <span className="font-mono text-[11px] font-bold">IG</span>,
};

interface ContactSectionProps {
  contact: ContactContent;
}

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section id="contact" className="py-10 md:pb-16">
      <div className="mb-6 md:mb-9" data-aos="fade-up">
        <SectionLabel number={contact.sectionNumber} label={contact.sectionName} />
      </div>
      <WindowChrome
        filename="terminal — zsh"
        accentColor="#FF5CAA"
        bodyClassName="flex flex-col gap-8 bg-[#282c34] p-6 md:flex-row md:gap-12 md:p-[38px]"
        data-aos="fade-up"
      >
        <div className="flex flex-3 flex-col gap-4 md:gap-[22px]">
          <p className="font-mono text-sm text-mint">saf@portfolio ~ % ./connect.sh</p>
          <h2 className="font-display text-base font-bold leading-tight text-cream md:text-lg lg:text-3xl xl:text-5xl">
            {contact.sectionTitle}
          </h2>
          <p className="text-sm leading-relaxed text-cream/90 md:text-lg md:leading-[1.55]">
            {contact.sectionDescription}
          </p>
        </div>
        <div className="flex flex-col flex-5 gap-4 md:shrink-0">
          <p className="font-mono text-[13px] font-bold text-yellow-alt">Reach me at</p>
          <div className="border-2 border-ink bg-cream p-4">
            <p className="font-mono text-sm font-bold text-black md:text-[15px]">
              {contact.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {contact.links.map((link) => (
              <SocialActionButton
                key={link.label}
                href={link.url}
                label={link.label}
                backgroundColor={link.style.backgroundColor}
                shadowColor={link.style.dropShadowColor}
                textColor={link.style.backgroundColor === "#FFFDFC" ? "#0F0F0F" : "#FFFDFC"}
                icon={SOCIAL_ICONS[link.label]}
                iconOnly
              />
            ))}
          </div>
        </div>
      </WindowChrome>
    </section>
  );
}
