import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectCard } from "./ProjectCard";
import type { ProjectsContent } from "@/lib/content";

interface ProjectsSectionProps {
  projects: ProjectsContent;
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
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
            number={projects.sectionNumber}
            label={projects.sectionName}
          />
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl xl:text-5xl">
            {projects.sectionTitle}
          </h2>
        </div>
        <p className="font-mono text-xs text-muted md:text-sm">
          {projects.content.length} files open • no errors
        </p>
      </div>
      <div className="flex flex-col gap-6 md:gap-8">
        {projects.content.map((project, index) => (
          <div
            key={project.filename + project.number}
            data-aos="slide-right"
            data-aos-delay={Math.min(index * 80, 240)}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </section>
  );
}
