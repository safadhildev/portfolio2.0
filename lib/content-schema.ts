import type { ExperienceContent, ExperienceEntry, TextStyle } from "./content";

export const SECTION_TYPES = [
  "hero",
  "about",
  "skills",
  "experience",
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
      throw new Error(`sections[${index}].type: duplicate section type "${type}"`);
    }
    found.set(type, section);
  });

  const missing = SECTION_TYPES.filter((type) => !found.has(type));
  if (missing.length > 0) {
    throw new Error(`sections: missing section type(s) ${missing.join(", ")}`);
  }

  return {
    hero: found.get("hero"),
    about: found.get("about"),
    skills: found.get("skills"),
    experience: found.get("experience"),
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
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
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

function readTextStyle(source: UnknownRecord, key: string, path: string): TextStyle {
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

function validateEntry(raw: unknown, index: number): ExperienceEntry {
  const path = `experience.content[${index}]`;
  if (!isRecord(raw)) {
    return fail(path, "must be an object");
  }

  const start = readIso(raw, "start", path);
  const endRaw = raw.end;
  const end = endRaw === null ? null : readIso(raw, "end", path);
  if (end !== null && Date.parse(start) > Date.parse(end)) {
    fail(`${path}.start`, `must not be after end (${start} > ${end})`);
  }

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
  return entry;
}

export function validateExperience(raw: unknown): ExperienceContent {
  if (!isRecord(raw)) {
    return fail("experience", "must be an object");
  }
  if (raw.type !== "experience") {
    fail("experience.type", 'must be "experience"');
  }
  if (typeof raw.sectionNumber !== "number") {
    fail("experience.sectionNumber", "must be a number");
  }
  if (!Array.isArray(raw.content)) {
    return fail("experience.content", "must be an array");
  }

  const content = raw.content.map(validateEntry);

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
    sectionNumber: raw.sectionNumber,
    sectionName: readString(raw, "sectionName", "experience"),
    sectionTitle: readString(raw, "sectionTitle", "experience"),
    sectionTitleStyles: readTextStyle(raw, "sectionTitleStyles", "experience"),
    content,
  };
}
