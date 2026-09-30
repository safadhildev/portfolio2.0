"use client";

import { SECTION_HREF, buildVisibleHrefs } from "@/components/constants";
import { FileExplorerSidebar } from "@/components/layout/FileExplorerSidebar";
import { IdeNavigation } from "@/components/layout/IdeNavigation";
import { IdeStatusFooter } from "@/components/layout/IdeStatusFooter";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HomeSection } from "@/components/sections/HomeSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { BoxView } from "@/components/ui/BoxVIew";
import { getPortfolioContent } from "@/lib/content";
import {
  WEBSITE_ORDER,
  numberSections,
  visibleSectionTypes,
} from "@/lib/visibility";
import { useEffect } from "react";

export default function Home() {
  const content = getPortfolioContent();
  // Display flag only: the full JSON is still in the client bundle.
  const visible = new Set(visibleSectionTypes(content));
  // Experience also needs entries, otherwise there is nothing to render.
  if (content.experience.content.length === 0) visible.delete("experience");
  const numbers = numberSections(WEBSITE_ORDER, visible);
  const visibleHrefs = buildVisibleHrefs(visible);
  const showIntroBox = visible.has("about") || visible.has("skills");

  useEffect(() => {
    if (!window.location.hash || window.location.hash === SECTION_HREF.HOME) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <>
      <IdeNavigation visibleHrefs={visibleHrefs} />
      <FileExplorerSidebar visibleHrefs={visibleHrefs} />
      <main className="bg-background px-4 pb-10 pt-6 md:px-8 md:pb-20 md:pt-10 lg:ml-[300px] lg:mr-8 lg:w-auto lg:px-0 lg:pb-[10px] lg:pt-[85px]">
        {visible.has("hero") && <HomeSection hero={content.hero} />}
        {showIntroBox && (
          <BoxView
            className="bg-yellow-alt flex flex-col gap-16 px-4 py-6 mt-10 shadow-none md:mt-20 md:shadow-[6px_6px_0_0_#151515] lg:gap-10"
            data-aos="fade-up"
          >
            {visible.has("about") && (
              <AboutSection about={content.about} number={numbers.about ?? 0} />
            )}
            {visible.has("skills") && (
              <SkillsSection
                skills={content.skills}
                number={numbers.skills ?? 0}
              />
            )}
          </BoxView>
        )}
        {visible.has("experience") && (
          <ExperienceSection
            experience={content.experience}
            skills={content.skills}
            number={numbers.experience ?? 0}
          />
        )}
        {visible.has("projects") && (
          <ProjectsSection
            projects={content.projects}
            number={numbers.projects ?? 0}
          />
        )}
        {visible.has("contact") && (
          <ContactSection
            contact={content.contact}
            number={numbers.contact ?? 0}
          />
        )}
      </main>
      <IdeStatusFooter />
    </>
  );
}
