"use client";

import { SECTION_HREF } from "@/components/constants";
import { FileExplorerSidebar } from "@/components/layout/FileExplorerSidebar";
import { IdeNavigation } from "@/components/layout/IdeNavigation";
import { IdeStatusFooter } from "@/components/layout/IdeStatusFooter";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { HomeSection } from "@/components/sections/HomeSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { getPortfolioContent } from "@/lib/content";
import { useEffect } from "react";

export default function Home() {
  const content = getPortfolioContent();

  useEffect(() => {
    if (window.location.hash === SECTION_HREF.HOME) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <>
      <IdeNavigation />
      <FileExplorerSidebar />
      <main className="bg-background px-8 pb-10 pt-6 md:px-8 md:pb-20 md:pt-10 lg:ml-[300px] lg:mr-8 lg:w-auto lg:px-0 lg:pb-[10px] lg:pt-[85px]">
        <HomeSection hero={content.hero} />
        <AboutSection about={content.about} />
        <SkillsSection skills={content.skills} />
        <ProjectsSection projects={content.projects} />
        <ContactSection contact={content.contact} />
      </main>
      <IdeStatusFooter />
    </>
  );
}
