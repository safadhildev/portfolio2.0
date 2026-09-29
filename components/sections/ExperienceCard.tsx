import { TechIconChip } from "@/components/ui/TechIconChip";
import { WindowChrome } from "@/components/ui/WindowChrome";
import type { ExperienceItemView } from "@/lib/experience";

export const EXPERIENCE_ACCENT = "#FFD84D";

interface ExperienceCardProps {
  item: ExperienceItemView;
}

export function ExperienceCard({ item }: ExperienceCardProps) {
  return (
    <WindowChrome
      filename={item.filename}
      accentColor={EXPERIENCE_ACCENT}
      size="compact"
      className="md:shadow-[6px_6px_0_0_#151515]!"
      bodyClassName="flex flex-col gap-2 p-[10px] md:gap-4 md:p-4"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <h3 className="font-display text-lg font-bold text-ink md:min-w-0 md:flex-1 md:text-xl">
            {item.title}
          </h3>
          <p className="order-first shrink-0 whitespace-nowrap rounded border-2 border-ink bg-yellow-alt px-2 py-1 font-mono text-[8px] font-bold text-ink md:order-none md:text-[10px]">
            <time dateTime={item.startMonth}>{item.startLabel}</time>
            {" – "}
            {item.endMonth === null ? (
              item.endLabel
            ) : (
              <time dateTime={item.endMonth}>{item.endLabel}</time>
            )}
          </p>
        </div>
        <p className="font-mono text-xs font-bold text-ink md:text-sm">
          {item.company}
        </p>
      </div>

      {item.responsibilities.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="font-mono text-[8px] font-bold text-ink md:text-[10px]">
            RESPONSIBILITIES
          </h4>
          <ul className="list-disc pl-3 font-mono text-[10px] leading-[1.4] text-ink marker:text-ink md:pl-[14px] md:text-xs">
            {item.responsibilities.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {item.techs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="font-mono text-[10px] font-bold text-ink">
            TECHNOLOGIES
          </h4>
          <ul className="flex flex-wrap gap-[5px]">
            {item.techs.map((tech, index) => {
              console.log("[DEBUG] >> ", { tech, index });

              return (
                <TechIconChip
                  key={tech.slug}
                  tech={tech}
                  tooltipAlign={
                    index >= item.techs.length / 2 ? "end" : "start"
                  }
                />
              );
            })}
          </ul>
        </div>
      )}
    </WindowChrome>
  );
}
