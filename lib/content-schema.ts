import type {
  AboutContent,
  ContactContent,
  DetailsContent,
  EducationContent,
  EducationEntry,
  ExperienceContent,
  ExperienceEntry,
  HeroContent,
  PortfolioContent,
  ProjectsContent,
  QualificationContent,
  Skill,
  SkillsContent,
  TextStyle,
} from "./content";

export const SECTION_TYPES = [
  "details",
  "hero",
  "about",
  "skills",
  "experience",
  "education",
  "qualification",
  "projects",
  "contact",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

const ISO_START = /^\d{4}-\d{2}-\d{2}T/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSectionType(value: unknown): value is SectionType {
  return SECTION_TYPES.some((type) => type === value);
}

/**
 * Resolves every section by its explicit `type` key (not array position).
 * Throws on a missing, duplicated or unknown type so a bad JSON fails `next build`.
 */
export function pickSections(raw: unknown[]): Record<SectionType, unknown> {
  const found = new Map<SectionType, unknown>();

  raw.forEach((section, index) => {
    const type = isRecord(section) ? section.type : undefined;
    if (!isSectionType(type)) {
      throw new Error(
        `sections[${index}].type: unknown section type ${JSON.stringify(type)}`,
      );
    }
    if (found.has(type)) {
      throw new Error(
        `sections[${index}].type: duplicate section type "${type}"`,
      );
    }
    found.set(type, section);
  });

  const missing = SECTION_TYPES.filter((type) => !found.has(type));
  if (missing.length > 0) {
    throw new Error(`sections: missing section type(s) ${missing.join(", ")}`);
  }

  return {
    details: found.get("details"),
    hero: found.get("hero"),
    about: found.get("about"),
    skills: found.get("skills"),
    experience: found.get("experience"),
    education: found.get("education"),
    qualification: found.get("qualification"),
    projects: found.get("projects"),
    contact: found.get("contact"),
  };
}

function fail(path: string, reason: string): never {
  throw new Error(`${path}: ${reason}`);
}

function readString(source: UnknownRecord, key: string, path: string): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path}.${key}`, "must be a non-empty string");
  }
  return value;
}

function readStringArray(
  source: UnknownRecord,
  key: string,
  path: string,
): string[] {
  const value = source[key];
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    fail(`${path}.${key}`, "must be an array of strings");
  }
  return value as string[];
}

function readIso(source: UnknownRecord, key: string, path: string): string {
  const value = readString(source, key, path);
  if (!ISO_START.test(value) || Number.isNaN(Date.parse(value))) {
    fail(`${path}.${key}`, `must be an ISO 8601 date-time, got "${value}"`);
  }
  return value;
}

function readTextStyle(
  source: UnknownRecord,
  key: string,
  path: string,
): TextStyle {
  const style = source[key];
  if (!isRecord(style)) {
    return fail(`${path}.${key}`, "must be an object");
  }
  const stylePath = `${path}.${key}`;
  return {
    fontWeight: readString(style, "fontWeight", stylePath),
    fontSize: readString(style, "fontSize", stylePath),
    color: readString(style, "color", stylePath),
    fontFamily: readString(style, "fontFamily", stylePath),
  };
}

function readVisible(source: UnknownRecord, path: string): boolean {
  const value = source.visible;
  if (typeof value !== "boolean") {
    fail(`${path}.visible`, "must be a boolean");
  }
  return value;
}

/** Reads `start`/`end` (ISO, end nullable) and enforces start <= end. */
function readDateRange(
  source: UnknownRecord,
  path: string,
): { start: string; end: string | null } {
  const start = readIso(source, "start", path);
  const end = source.end === null ? null : readIso(source, "end", path);
  if (end !== null && Date.parse(start) > Date.parse(end)) {
    fail(`${path}.start`, `must not be after end (${start} > ${end})`);
  }
  return { start, end };
}

/** Reads `raw` as a record whose `type` is `type`, or throws with `path`. */
function readSection(raw: unknown, type: SectionType): UnknownRecord {
  if (!isRecord(raw)) {
    return fail(type, "must be an object");
  }
  if (raw.type !== type) {
    fail(`${type}.type`, `must be "${type}"`);
  }
  return raw;
}

function validateEntry(raw: unknown, index: number): ExperienceEntry {
  const path = `experience.content[${index}]`;
  if (!isRecord(raw)) {
    return fail(path, "must be an object");
  }

  const { start, end } = readDateRange(raw, path);

  const entry: ExperienceEntry = {
    start,
    end,
    title: readString(raw, "title", path),
    company: readString(raw, "company", path),
    filename: readString(raw, "filename", path),
    responsibilities: readStringArray(raw, "responsibilities", path),
    skills: readStringArray(raw, "skills", path),
  };

  if (raw.description !== undefined) {
    entry.description = readString(raw, "description", path);
  }

  if (
    isRecord(raw.windowStyles) &&
    typeof raw.windowStyles.backgroundColor === "string"
  ) {
    entry.windowStyles = { backgroundColor: raw.windowStyles.backgroundColor };
  }

  return entry;
}

export function validateExperience(raw: unknown): ExperienceContent {
  const source = readSection(raw, "experience");
  if (!Array.isArray(source.content)) {
    return fail("experience.content", "must be an array");
  }

  const content = source.content.map(validateEntry);

  const seen = new Set<string>();
  content.forEach((entry, index) => {
    if (seen.has(entry.filename)) {
      fail(
        `experience.content[${index}].filename`,
        `duplicate filename "${entry.filename}"`,
      );
    }
    seen.add(entry.filename);
  });

  return {
    type: "experience",
    visible: readVisible(source, "experience"),
    sectionName: readString(source, "sectionName", "experience"),
    sectionTitle: readString(source, "sectionTitle", "experience"),
    sectionTitleStyles: readTextStyle(source, "sectionTitleStyles", "experience"),
    content,
  };
}

export function validateDetails(raw: unknown): DetailsContent {
  const source = readSection(raw, "details");
  const visible = readVisible(source, "details");
  const content = source.content;
  if (!isRecord(content)) {
    return fail("details.content", "must be an object");
  }
  const path = "details.content";
  return {
    type: "details",
    visible,
    content: {
      name: readString(content, "name", path),
      position: readString(content, "position", path),
      email: readString(content, "email", path),
      location: readString(content, "location", path),
      portfolioLink: readString(content, "portfolio-link", path),
    },
  };
}

function validateEducationEntry(raw: unknown, index: number): EducationEntry {
  const path = `education.content[${index}]`;
  if (!isRecord(raw)) {
    return fail(path, "must be an object");
  }
  const { start, end } = readDateRange(raw, path);
  return {
    start,
    end,
    title: readString(raw, "title", path),
    subtitle: readString(raw, "subtitle", path),
    details: readStringArray(raw, "details", path),
  };
}

export function validateEducation(raw: unknown): EducationContent {
  const source = readSection(raw, "education");
  if (!Array.isArray(source.content)) {
    return fail("education.content", "must be an array");
  }
  const result: EducationContent = {
    type: "education",
    visible: readVisible(source, "education"),
    sectionName: readString(source, "sectionName", "education"),
    sectionTitle: readString(source, "sectionTitle", "education"),
    content: source.content.map(validateEducationEntry),
  };
  if (source.sectionTitleStyles !== undefined) {
    result.sectionTitleStyles = readTextStyle(
      source,
      "sectionTitleStyles",
      "education",
    );
  }
  return result;
}

export function validateQualification(raw: unknown): QualificationContent {
  const source = readSection(raw, "qualification");
  const content = source.content;
  if (!Array.isArray(content)) {
    return fail("qualification.content", "must be an array");
  }
  const items = content.map((item, index): string => {
    if (typeof item !== "string" || item.trim() === "") {
      return fail(
        `qualification.content[${index}]`,
        "must be a non-empty string",
      );
    }
    return item;
  });
  return {
    type: "qualification",
    visible: readVisible(source, "qualification"),
    sectionName: readString(source, "sectionName", "qualification"),
    sectionTitle: readString(source, "sectionTitle", "qualification"),
    content: items,
  };
}

function validateSkill(raw: unknown, index: number): Skill {
  const path = `skills.skills[${index}]`;
  if (!isRecord(raw)) {
    return fail(path, "must be an object");
  }
  const style = raw.style;
  if (!isRecord(style)) {
    return fail(`${path}.style`, "must be an object");
  }
  return {
    label: readString(raw, "label", path),
    title: readString(raw, "title", path),
    icon: readString(raw, "icon", path),
    style: {
      backgroundColor: readString(style, "backgroundColor", `${path}.style`),
      color: readString(style, "color", `${path}.style`),
    },
  };
}

export function validateSkills(raw: unknown): SkillsContent {
  const source = readSection(raw, "skills");
  if (!Array.isArray(source.skills)) {
    return fail("skills.skills", "must be an array");
  }
  return {
    type: "skills",
    visible: readVisible(source, "skills"),
    sectionName: readString(source, "sectionName", "skills"),
    sectionTitle: readString(source, "sectionTitle", "skills"),
    sectionTitleStyles: readTextStyle(source, "sectionTitleStyles", "skills"),
    skills: source.skills.map(validateSkill),
  };
}

/**
 * Hero/about/projects/contact are only shallow-checked (record, `type`, boolean `visible`);
 * their inner shape is trusted from the JSON (the website renders them as authored).
 */
function validateShallow<T extends { type: SectionType; visible: boolean }>(
  raw: unknown,
  type: T["type"],
): T {
  const source = readSection(raw, type);
  readVisible(source, type);
  return source as unknown as T;
}

/** Validates the whole portfolio JSON. Throws "path: reason" so a bad JSON fails `next build`. */
export function parsePortfolio(raw: unknown): PortfolioContent {
  if (!isRecord(raw)) {
    return fail("portfolio", "must be an object");
  }
  if (!Array.isArray(raw.sections)) {
    return fail("sections", "must be an array");
  }
  const sections = pickSections(raw.sections);
  return {
    title: readString(raw, "title", "portfolio"),
    details: validateDetails(sections.details),
    hero: validateShallow<HeroContent>(sections.hero, "hero"),
    about: validateShallow<AboutContent>(sections.about, "about"),
    skills: validateSkills(sections.skills),
    experience: validateExperience(sections.experience),
    education: validateEducation(sections.education),
    qualification: validateQualification(sections.qualification),
    projects: validateShallow<ProjectsContent>(sections.projects, "projects"),
    contact: validateShallow<ContactContent>(sections.contact, "contact"),
  };
}
