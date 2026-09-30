import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { ExperienceContent, ExperienceEntry, Skill } from "./content.ts";
import {
  EXPERIENCE_CONFIG,
  buildExperienceView,
  formatDateRange,
  formatMonthYear,
  getBadgeLabel,
  resolveTech,
  sortExperience,
} from "./experience.ts";

function entry(overrides: Partial<ExperienceEntry> = {}): ExperienceEntry {
  return {
    start: "2023-08-15T00:00:00+08:00",
    end: "2025-10-25T00:00:00+08:00",
    title: "Developer",
    company: "Maybank",
    filename: "experience.maybank.md",
    responsibilities: [],
    skills: [],
    ...overrides,
  };
}

const skills: Skill[] = [
  {
    label: "language.ts",
    title: "TypeScript",
    icon: "typescript",
    style: { backgroundColor: "#3D8BFF", color: "#000000" },
  },
];

const available = new Set(["typescript", "git", "link"]);

function content(entries: ExperienceEntry[]): ExperienceContent {
  return {
    type: "experience",
    visible: true,
    sectionName: "EXPERIENCE.LOG",
    sectionTitle: "MY EXPERIENCE",
    sectionTitleStyles: {
      fontWeight: "bold",
      fontSize: "48px",
      color: "#000000",
      fontFamily: "Space Grotesk",
    },
    content: entries,
  };
}

describe("formatDateRange", () => {
  it("formats a closed range", () => {
    assert.equal(
      formatDateRange("2023-08-15T00:00:00+08:00", "2025-10-25T00:00:00+08:00"),
      "Aug 2023 - Oct 2025",
    );
  });

  it("uses the present label for an open range", () => {
    assert.equal(
      formatDateRange("2025-10-27T00:00:00+08:00", null),
      `Oct 2025 - ${EXPERIENCE_CONFIG.presentLabel}`,
    );
    assert.equal(formatDateRange("2025-10-27T00:00:00+08:00", null), "Oct 2025 - Present");
  });

  it("rejects an invalid ISO date", () => {
    assert.throws(() => formatDateRange("nope", null), /Invalid ISO date/);
  });
});

describe("sortExperience", () => {
  it("puts a null end first, then end desc, then start desc", () => {
    const current = entry({ filename: "current", end: null, start: "2019-01-01T00:00:00+08:00" });
    const late = entry({ filename: "late", end: "2025-10-25T00:00:00+08:00" });
    const lateEarlyStart = entry({
      filename: "late-early-start",
      start: "2021-01-01T00:00:00+08:00",
      end: "2025-10-25T00:00:00+08:00",
    });
    const old = entry({ filename: "old", start: "2020-04-01T00:00:00+08:00", end: "2023-08-01T00:00:00+08:00" });

    const sorted = sortExperience([old, late, lateEarlyStart, current]);
    assert.deepEqual(
      sorted.map((e) => e.filename),
      ["current", "late", "late-early-start", "old"],
    );
  });

  it("sorts any object with start/end, keeping its extra fields", () => {
    const items = [
      { start: "2016-09-01T00:00:00+08:00", end: "2019-01-30T00:00:00+08:00", title: "degree" },
      { start: "2019-07-01T00:00:00+08:00", end: "2019-07-02T00:00:00+08:00", title: "course" },
    ];
    assert.deepEqual(sortExperience(items).map((i) => i.title), ["course", "degree"]);
  });

  it("is stable for identical dates and does not mutate the input", () => {
    const a = entry({ filename: "a" });
    const b = entry({ filename: "b" });
    const input = [a, b];
    const sorted = sortExperience(input);
    assert.deepEqual(sorted.map((e) => e.filename), ["a", "b"]);
    assert.notEqual(sorted, input);
    assert.deepEqual(input, [a, b]);
  });
});

describe("formatMonthYear", () => {
  it('formats "2020-04-01T00:00:00+08:00" as "Apr 2020" regardless of TZ', () => {
    assert.equal(formatMonthYear("2020-04-01T00:00:00+08:00"), "Apr 2020");
    assert.equal(formatMonthYear("2025-10-25T00:00:00+08:00"), "Oct 2025");
  });

  it("throws on a malformed date", () => {
    assert.throws(() => formatMonthYear("nope"), /Invalid ISO date/);
  });
});

describe("getBadgeLabel", () => {
  it('uses the end year for "end" and the start year for "start"', () => {
    const maybank = entry();
    assert.equal(getBadgeLabel(maybank, "end", "Present"), "2025");
    assert.equal(getBadgeLabel(maybank, "start", "Present"), "2023");
  });

  it("returns the present label for a null end under each rule", () => {
    const current = entry({ end: null });
    assert.equal(getBadgeLabel(current, "end", "Present"), "Present");
    assert.equal(getBadgeLabel(current, "start", "Present"), "Present");
  });
});

describe("resolveTech", () => {
  it("takes the label from the Skills section, with TECH_EXTRAS overriding the fill (null = none)", () => {
    assert.deepEqual(resolveTech("typescript", skills, available), {
      slug: "typescript",
      label: "TypeScript",
      color: null,
      icon: "typescript",
    });
  });

  it("uses TECH_EXTRAS for git and rest-api, with their icons", () => {
    assert.equal(resolveTech("git", skills, available).icon, "git");
    assert.equal(resolveTech("rest-api", skills, available).icon, "link");
  });

  it("returns a null icon for a TECH_EXTRAS slug that has none", () => {
    const tech = resolveTech("aws", skills, available);
    assert.equal(tech.label, "AWS");
    assert.equal(tech.icon, null);
  });

  it("falls back to the slug as label for an unknown slug", () => {
    const original = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      assert.deepEqual(resolveTech("cobol", skills, available), {
        slug: "cobol",
        label: "cobol",
        color: "#FFFFFF",
        icon: null,
      });
    } finally {
      console.warn = original;
    }
    assert.equal(warnings.length, 1);
  });
});

describe("buildExperienceView", () => {
  const source = content([
    entry({ skills: ["typescript", "aws"] }),
  ]);

  afterEach(() => {
    EXPERIENCE_CONFIG.missingIcon = "text";
  });

  it('keeps slugs without an icon as text chips in "text" mode', () => {
    EXPERIENCE_CONFIG.missingIcon = "text";
    const [item] = buildExperienceView(source, skills, available);
    assert.deepEqual(item.techs.map((t) => t.slug), ["typescript", "aws"]);
  });

  it('drops slugs without an icon in "omit" mode', () => {
    EXPERIENCE_CONFIG.missingIcon = "omit";
    const [item] = buildExperienceView(source, skills, available);
    assert.deepEqual(item.techs.map((t) => t.slug), ["typescript"]);
  });

  it("builds labels, months, badge and key", () => {
    const [item] = buildExperienceView(source, skills, available);
    assert.equal(item.key, "experience.maybank.md");
    assert.equal(item.startMonth, "2023-08");
    assert.equal(item.endMonth, "2025-10");
    assert.equal(item.startLabel, "Aug 2023");
    assert.equal(item.endLabel, "Oct 2025");
    assert.equal(item.badgeLabel, "2023");
  });

  it("uses the present label and a null endMonth when the role is ongoing", () => {
    const [item] = buildExperienceView(content([entry({ end: null })]), skills, available);
    assert.equal(item.endMonth, null);
    assert.equal(item.endLabel, "Present");
    assert.equal(item.badgeLabel, "Present");
  });
});
