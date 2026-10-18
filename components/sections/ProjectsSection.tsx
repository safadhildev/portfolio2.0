import { SectionLabel } from "@/components/ui/SectionLabel";
import type { ProjectsContent } from "@/lib/content";
import { PROJECTS_ROUTE } from "@/lib/resume";
import { Button } from "../ui/Button";
import { ProjectCard } from "./ProjectCard";

interface ProjectsSectionProps {
  projects: ProjectsContent;
  number: number;
}

export function ProjectsSection({ projects, number }: ProjectsSectionProps) {
  return (
    <section
      id="projects"
      className="py-10 md:py-10 scroll-mt-10 lg:scroll-mt-[70px]"
    >
      <div
        className="mb-8 flex flex-wrap items-end justify-between gap-3 md:mb-11"
        data-aos="fade-up"
      >
        <div className="flex flex-col gap-3">
          <SectionLabel
            number={number}
            label={projects.sectionName}
          />
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl xl:text-5xl">
            {projects.sectionTitle}
          </h2>
          <p className="font-mono text-xs text-muted md:text-sm">
          {projects.content.length} files open • no errors
        </p>
        </div>
        <Button className="self-start md:shrink-0 md:self-auto md:w-[350px]"  text="View All My Projects" href={PROJECTS_ROUTE} icon="external-link" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
        {projects.content.map((project, index) => (
          <div
            key={project.filename + project.number}
            data-aos="fade-right"
            data-aos-delay={(index + 1) * 100}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </section>
  );
}
