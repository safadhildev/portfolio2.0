import { WindowChrome } from "@/components/ui/WindowChrome";
import { TechTag } from "@/components/ui/TechTag";
import { Icon } from "@/components/ui/Icon";
import type { Project } from "@/lib/content";
import { track } from "@vercel/analytics";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {

  const accentColor = project.windowStyles.backgroundColor;

  return (
    <WindowChrome
      filename={project.filename}
      accentColor={accentColor}
      bodyClassName="flex flex-col gap-4 p-4 md:flex-row md:gap-[30px] md:p-[30px]"
    >
      <div className="flex size-14 shrink-0 items-center justify-center border-2 border-ink bg-ink font-display text-xl font-bold text-cream md:size-[86px] md:text-3xl">
        {project.number}
      </div>
      <div className="flex flex-1 flex-col gap-3 md:gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold leading-tight text-ink md:text-2xl xl:text-[32px]">
            {project.title}
          </h3>
          <TechTag label={project.year} accentColor={accentColor} />
        </div>
        <p className="text-sm leading-relaxed text-ink/80 md:text-base">
          {project.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {project.skills.map((skill) => (
              <TechTag key={skill} label={skill} accentColor={accentColor} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {project.links.map((link) => (
              <a
                key={`${link.type}-${link.link}`}
                href={link.link || undefined}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={link.type}
                onClick={() => {
                  track(`${project.id}_${link.type}_clicked`);
                }}
                className="flex size-9 items-center justify-center rounded-md border-2 border-ink bg-cream shadow-[3px_3px_0_0_#151515] transition-transform duration-100 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none md:size-11"
              >
                <Icon name={link.icon} size={18} alt={link.type} color="#000000" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}
