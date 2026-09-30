import type { ExperienceContent, ExperienceEntry, Skill } from "./content";

export type BadgeRule = "start" | "end";
export type MissingIconMode = "text" | "omit";

export const EXPERIENCE_CONFIG: {
  badgeRule: BadgeRule;
  presentLabel: string;
  missingIcon: MissingIconMode;
} = {
  // Year badge on each card: "start" shows the start year, "end" the end year. Current roles always show presentLabel.
  badgeRule: "start",
  presentLabel: "Present",
  // Slugs with no icon still show up, as a text chip.
  missingIcon: "text",
};

/** Tech that is not in the Skills section; slug -> label, chip colour and optional icon. */
export const TECH_EXTRAS: Record<
  string,
  { label: string; color: string | null; icon?: string }
> = {
  reactjs: {
    label: "ReactJS",
    // color: "#3D8BFF",
    color: null,
    icon: "react",
  },
  nextjs: { label: "Next.js", color: null, icon: "nextjs" },
  expressjs: { label: "Express.js", color: null, icon: "expressjs" },
  mongodb: { label: "MongoDB", color: null, icon: "mongodb" },
  aws: { label: "AWS", color: null, icon: "aws" },
  git: { label: "Git", color: null, icon: "git" },
  trpc: { label: "tRPC", color: null, icon: "trpc" },
  laravel: { label: "Laravel", color: null, icon: "laravel" },
  "google-analytics": {
    label: "Google Analytics",
    color: null,
    icon: "google-analytics",
  },
  "rest-api": { label: "REST API", color: null, icon: "link" },
  jira: { label: "Jira", color: null, icon: "jira" },
  confluence: { label: "Confluence", color: null, icon: "confluence" },
  js: { label: "JavaScript", color: null, icon: "js" },
  typescript: { label: "TypeScript", color: null, icon: "typescript" },
  firebase: { label: "Firebase", color: null, icon: "firebase" },
};

const FALLBACK_COLOR = "#FFFFFF";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface ResolvedTech {
  slug: string;
  label: string;
  /** null = no fill; the icon artwork provides the colour. */
  color: string | null;
  icon: string | null;
}

export interface ExperienceItemView {
  key: string;
  filename: string;
  title: string;
  company: string;
  startMonth: string;
  endMonth: string | null;
  startLabel: string;
  endLabel: string;
  badgeLabel: string;
  responsibilities: string[];
  techs: ResolvedTech[];
  windowStyles?: { backgroundColor: string };
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

// Dates are read from the ISO string, never via Date, so SSR and CSR agree in any timezone.
function parseYearMonth(iso: string): { year: string; month: number } {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  const month = match ? Number(match[2]) : 0;
  if (!match || month < 1 || month > 12) {
    throw new Error(`Invalid ISO date: "${iso}"`);
  }
  return { year: match[1], month };
}

/** Newest first by end date (still-running roles on top), then by start date. Non-mutating and stable. */
export function sortExperience<T extends { start: string; end: string | null }>(
  entries: T[],
): T[] {
  const endTime = (entry: T) =>
    entry.end === null ? Number.POSITIVE_INFINITY : Date.parse(entry.end);

  return [...entries].sort((a, b) => {
    const endA = endTime(a);
    const endB = endTime(b);
    if (endA !== endB) return endA > endB ? -1 : 1;
    const startA = Date.parse(a.start);
    const startB = Date.parse(b.start);
    if (startA !== startB) return startA > startB ? -1 : 1;
    return 0;
  });
}

export function formatMonthYear(iso: string): string {
  const { year, month } = parseYearMonth(iso);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "Aug 2023 - Oct 2025", or "Aug 2023 - Present" while the role is still running. */
export function formatDateRange(start: string, end: string | null): string {
  const endLabel =
    end === null ? EXPERIENCE_CONFIG.presentLabel : formatMonthYear(end);
  return `${formatMonthYear(start)} - ${endLabel}`;
}

export function getBadgeLabel(
  entry: ExperienceEntry,
  rule: BadgeRule,
  presentLabel: string,
): string {
  if (entry.end === null) return presentLabel;

  switch (rule) {
    case "end":
      return parseYearMonth(entry.end).year;
    case "start":
      return parseYearMonth(entry.start).year;
    default:
      return assertNever(rule);
  }
}

export function resolveTech(
  slug: string,
  skills: Skill[],
  available: ReadonlySet<string>,
): ResolvedTech {
  const skill = skills.find((item) => item.icon === slug);
  const extra = TECH_EXTRAS[slug];
  if (skill) {
    return {
      slug,
      label: skill.title,
      // A TECH_EXTRAS entry overrides the Skills chip fill (null = no fill).
      color: extra ? extra.color : skill.style.backgroundColor,
      icon: available.has(slug) ? slug : null,
    };
  }

  if (extra) {
    return {
      slug,
      label: extra.label,
      color: extra.color,
      icon: extra.icon && available.has(extra.icon) ? extra.icon : null,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[experience] Unknown tech slug "${slug}"; add it to TECH_EXTRAS.`,
    );
  }
  return { slug, label: slug, color: FALLBACK_COLOR, icon: null };
}

export function buildExperienceView(
  content: ExperienceContent,
  skills: Skill[],
  available: ReadonlySet<string>,
): ExperienceItemView[] {
  const { badgeRule, presentLabel, missingIcon } = EXPERIENCE_CONFIG;

  return sortExperience(content.content).map((entry) => {
    const resolved = entry.skills.map((slug) =>
      resolveTech(slug, skills, available),
    );

    let techs: ResolvedTech[];
    switch (missingIcon) {
      case "text":
        techs = resolved;
        break;
      case "omit":
        techs = resolved.filter((tech) => tech.icon !== null);
        break;
      default:
        return assertNever(missingIcon);
    }

    return {
      key: entry.filename,
      filename: entry.filename,
      title: entry.title,
      company: entry.company,
      startMonth: entry.start.slice(0, 7),
      endMonth: entry.end === null ? null : entry.end.slice(0, 7),
      startLabel: formatMonthYear(entry.start),
      endLabel: entry.end === null ? presentLabel : formatMonthYear(entry.end),
      badgeLabel: getBadgeLabel(entry, badgeRule, presentLabel),
      responsibilities: entry.responsibilities,
      techs,
      windowStyles: entry.windowStyles,
    };
  });
}
