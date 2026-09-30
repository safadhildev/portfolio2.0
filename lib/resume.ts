import type { PortfolioContent } from "./content";
import {
  assertNever,
  formatDateRange,
  resolveTech,
  sortExperience,
} from "./experience.ts";

export const RESUME_FILE = "Syed-Ahmad-Fadhil-Resume.pdf";
export const RESUME_ROUTE = "/resume";

export type SkillGroupKey = "languages" | "frameworks" | "cloud" | "tools";
export type ResumeSectionKind =
  | "experience"
  | "education"
  | "skills"
  | "qualification";

export type ResumeSection =
  | {
      kind: "experience";
      heading: string;
      items: {
        title: string;
        org: string;
        dateRange: string;
        bullets: string[];
        tech: string[];
      }[];
    }
  | {
      kind: "education";
      heading: string;
      items: {
        title: string;
        org: string;
        dateRange: string;
        bullets: string[];
      }[];
    }
  | {
      kind: "skills";
      heading: string;
      groups: { key: SkillGroupKey; label: string; items: string[] }[];
    }
  | { kind: "qualification"; heading: string; bullets: string[] };

export interface ResumeModel {
  meta: { title: string; author: string; subject: string; keywords: string[] };
  header: {
    name: string;
    headline: string;
    /** [location, email, portfolio link without the scheme] */
    contact: string[];
    /** Full URL behind the last contact entry (rendered as a link annotation). */
    portfolioUrl: string;
  };
  sections: ResumeSection[];
}

export const RESUME_CONFIG: {
  /** Print order. The resume ignores `visible`; only this list decides what appears. */
  sections: readonly ResumeSectionKind[];
} = {
  sections: ["experience", "education", "skills", "qualification"],
};

const HEADINGS: Record<ResumeSectionKind, string> = {
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  qualification: "Qualifications",
};

export const SKILL_GROUP_ORDER: readonly SkillGroupKey[] = [
  "languages",
  "frameworks",
  "cloud",
  "tools",
];

export function skillGroupLabel(key: SkillGroupKey): string {
  switch (key) {
    case "languages":
      return "Languages";
    case "frameworks":
      return "Frameworks & Platforms";
    case "cloud":
      return "Cloud & Services";
    case "tools":
      return "Tools & Technologies";
    default:
      return assertNever(key);
  }
}

/** Skill label prefix ("language.ts" -> "language") to a group. Unknown prefixes fall into "tools". */
export function skillGroupForLabel(label: string): SkillGroupKey {
  const prefix = label.split(".")[0];
  switch (prefix) {
    case "language":
      return "languages";
    case "mobile":
    case "platform":
    case "runtime":
    case "framework":
      return "frameworks";
    case "cloud":
      return "cloud";
    default:
      return "tools";
  }
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function buildSkillGroups(c: PortfolioContent): ResumeSection & { kind: "skills" } {
  const { skills } = c.skills;
  const buckets: Record<SkillGroupKey, string[]> = {
    languages: [],
    frameworks: [],
    cloud: [],
    tools: [],
  };
  const seen = new Set<string>();
  const add = (key: SkillGroupKey, title: string) => {
    const id = title.toLowerCase();
    if (seen.has(id)) return;
    seen.add(id);
    buckets[key].push(title);
  };

  for (const skill of skills) add(skillGroupForLabel(skill.label), skill.title);

  // Tech used in Experience but not listed in Skills goes under "tools".
  for (const entry of sortExperience(c.experience.content)) {
    for (const slug of entry.skills) {
      add("tools", resolveTech(slug, skills, new Set()).label);
    }
  }

  return {
    kind: "skills",
    heading: HEADINGS.skills,
    groups: SKILL_GROUP_ORDER.filter((key) => buckets[key].length > 0).map(
      (key) => ({ key, label: skillGroupLabel(key), items: buckets[key] }),
    ),
  };
}

function buildSection(
  kind: ResumeSectionKind,
  c: PortfolioContent,
): ResumeSection {
  switch (kind) {
    case "experience":
      return {
        kind,
        heading: HEADINGS[kind],
        items: sortExperience(c.experience.content).map((entry) => ({
          title: entry.title,
          org: entry.company,
          dateRange: formatDateRange(entry.start, entry.end),
          bullets: [...entry.responsibilities],
          tech: [
            ...new Set(
              entry.skills.map(
                (slug) => resolveTech(slug, c.skills.skills, new Set()).label,
              ),
            ),
          ],
        })),
      };
    case "education":
      return {
        kind,
        heading: HEADINGS[kind],
        items: sortExperience(c.education.content).map((entry) => ({
          title: entry.title,
          org: entry.subtitle,
          dateRange: formatDateRange(entry.start, entry.end),
          bullets: [...entry.details],
        })),
      };
    case "skills":
      return buildSkillGroups(c);
    case "qualification":
      return {
        kind,
        heading: HEADINGS[kind],
        bullets: [...c.qualification.content],
      };
    default:
      return assertNever(kind);
  }
}

function isEmpty(section: ResumeSection): boolean {
  switch (section.kind) {
    case "experience":
    case "education":
      return section.items.length === 0;
    case "skills":
      return section.groups.length === 0;
    case "qualification":
      return section.bullets.length === 0;
    default:
      return assertNever(section);
  }
}

/**
 * Pure content -> resume model. Deliberately ignores every `visible` flag (hidden sections still
 * appear on the resume), so this module must never import or call the website's filterVisible.
 */
export function buildResumeModel(c: PortfolioContent): ResumeModel {
  const { name, position, email, location, portfolioLink } = c.details.content;
  const sections = RESUME_CONFIG.sections
    .map((kind) => buildSection(kind, c))
    .filter((section) => !isEmpty(section));

  return {
    meta: {
      title: `${name} — Resume`,
      author: name,
      subject: position,
      keywords: c.skills.skills.map((skill) => skill.title),
    },
    header: {
      name,
      headline: position,
      contact: [location, email, stripScheme(portfolioLink)],
      portfolioUrl: portfolioLink,
    },
    sections,
  };
}
