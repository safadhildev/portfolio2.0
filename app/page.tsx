import { IdeNavigation } from "@/components/layout/IdeNavigation";
import { FileExplorerSidebar } from "@/components/layout/FileExplorerSidebar";
import { IdeStatusFooter } from "@/components/layout/IdeStatusFooter";
import { HomeSection } from "@/components/sections/HomeSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getPortfolioContent } from "@/lib/content";
import { BODY_PADDING_TOP } from "@/components/constants";

export default function Home() {
  const content = getPortfolioContent();

  return (
    <>
      <IdeNavigation />
      <FileExplorerSidebar />
      <main
        className={`mx-auto w-full max-w-[1920px] px-8 pb-10 pt-6 md:px-8 md:pb-20 md:pt-10 xl:ml-[300px] xl:mr-8 xl:w-auto xl:max-w-none xl:px-0 xl:pb-[10px] xl:pt-[85px]`}
      >
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
