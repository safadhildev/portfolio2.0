import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  SECTION_TYPES,
  parsePortfolio,
  pickSections,
  validateDetails,
  validateEducation,
  validateExperience,
  validateQualification,
  validateSkills,
} from "./content-schema.ts";

const sectionsOf = (types: readonly string[]) => types.map((type) => ({ type }));

const style = {
  fontWeight: "bold",
  fontSize: "48px",
  color: "#000000",
  fontFamily: "Space Grotesk",
};

function entry(overrides: Record<string, unknown> = {}) {
  return {
    start: "2023-08-15T00:00:00+08:00",
    end: "2025-10-25T00:00:00+08:00",
    title: "Developer",
    company: "Maybank",
    filename: "experience.maybank.md",
    responsibilities: ["Did things"],
    skills: ["react"],
    ...overrides,
  };
}

function section(content: unknown[]) {
  return {
    type: "experience",
    visible: true,
    sectionName: "EXPERIENCE.LOG",
    sectionTitle: "MY EXPERIENCE",
    sectionTitleStyles: style,
    content,
  };
}

describe("pickSections", () => {
  for (const type of SECTION_TYPES) {
    it(`resolves "${type}" regardless of array position`, () => {
      const reversed = sectionsOf([...SECTION_TYPES].reverse());
      const picked = pickSections(reversed);
      assert.deepEqual(picked[type], { type });
    });
  }

  it("throws on a missing type", () => {
    const missing = SECTION_TYPES.filter((type) => type !== "experience");
    assert.throws(() => pickSections(sectionsOf(missing)), /missing.*experience/);
  });

  it("throws on a duplicate type", () => {
    assert.throws(
      () => pickSections(sectionsOf([...SECTION_TYPES, "about"])),
      /duplicate section type "about"/,
    );
  });

  it("throws on an unknown type", () => {
    assert.throws(
      () => pickSections(sectionsOf([...SECTION_TYPES, "bogus"])),
      /unknown section type "bogus"/,
    );
  });

  it("throws on a section without a type", () => {
    assert.throws(() => pickSections([{}]), /sections\[0\]\.type/);
  });
});

describe("validateExperience", () => {
  it("accepts a valid section, an empty responsibilities array and a null end", () => {
    const result = validateExperience(
      section([entry({ responsibilities: [], end: null })]),
    );
    assert.equal(result.content.length, 1);
    assert.equal(result.content[0].end, null);
    assert.deepEqual(result.content[0].responsibilities, []);
  });

  it("throws with a field path on an empty company", () => {
    assert.throws(
      () => validateExperience(section([entry({ company: "  " })])),
      /experience\.content\[0\]\.company/,
    );
  });

  it("throws when start is after end", () => {
    assert.throws(
      () =>
        validateExperience(
          section([entry({ start: "2026-01-01T00:00:00+08:00" })]),
        ),
      /experience\.content\[0\]\.start/,
    );
  });

  it("throws on a malformed ISO date", () => {
    assert.throws(
      () => validateExperience(section([entry({ start: "Aug 2023" })])),
      /experience\.content\[0\]\.start/,
    );
  });

  it("throws on a duplicate filename", () => {
    assert.throws(
      () => validateExperience(section([entry(), entry()])),
      /experience\.content\[1\]\.filename/,
    );
  });

  it("throws when skills is not an array of strings", () => {
    assert.throws(
      () => validateExperience(section([entry({ skills: "react-native" })])),
      /experience\.content\[0\]\.skills/,
    );
  });
});

describe("SECTION_TYPES", () => {
  it("lists all 9 section types", () => {
    assert.deepEqual(
      [...SECTION_TYPES].sort(),
      [
        "about",
        "contact",
        "details",
        "education",
        "experience",
        "hero",
        "projects",
        "qualification",
        "skills",
      ],
    );
  });
});

describe("validateExperience visible", () => {
  it("keeps visible", () => {
    assert.equal(validateExperience(section([entry()])).visible, true);
  });

  it("throws with the path when visible is missing", () => {
    const raw: Record<string, unknown> = section([entry()]);
    delete raw.visible;
    assert.throws(() => validateExperience(raw), /experience\.visible/);
  });

  it("throws when visible is not a boolean", () => {
    assert.throws(
      () => validateExperience({ ...section([entry()]), visible: "true" }),
      /experience\.visible: must be a boolean/,
    );
  });
});

const details = (overrides: Record<string, unknown> = {}) => ({
  type: "details",
  visible: false,
  content: {
    name: "Jane Doe",
    position: "Engineer",
    email: "jane@example.com",
    location: "KL",
    "portfolio-link": "https://example.com",
    ...overrides,
  },
});

describe("validateDetails", () => {
  it("maps portfolio-link to portfolioLink and keeps visible false", () => {
    const result = validateDetails(details());
    assert.equal(result.visible, false);
    assert.equal(result.content.portfolioLink, "https://example.com");
    assert.equal(result.content.name, "Jane Doe");
  });

  for (const key of ["name", "position", "email", "location", "portfolio-link"]) {
    it(`throws with a path on an empty ${key}`, () => {
      assert.throws(
        () => validateDetails(details({ [key]: "" })),
        new RegExp(`details\\.content\\.${key}`),
      );
    });
  }

  it("throws when visible is missing", () => {
    const raw: Record<string, unknown> = details();
    delete raw.visible;
    assert.throws(() => validateDetails(raw), /details\.visible/);
  });
});

const education = (entries: unknown[], extra: Record<string, unknown> = {}) => ({
  type: "education",
  visible: false,
  sectionName: "EDUCATION.LOG",
  sectionTitle: "EDUCATION",
  content: entries,
  ...extra,
});

const educationEntry = (overrides: Record<string, unknown> = {}) => ({
  start: "2019-07-01T00:00:00+08:00",
  end: "2019-07-02T00:00:00+08:00",
  title: "Course",
  subtitle: "School",
  details: ["Learned things"],
  ...overrides,
});

describe("validateEducation", () => {
  it("accepts an entry with a null end and no sectionTitleStyles", () => {
    const result = validateEducation(education([educationEntry({ end: null })]));
    assert.equal(result.content[0].end, null);
    assert.equal(result.sectionTitleStyles, undefined);
    assert.equal(result.visible, false);
  });

  it("reads sectionTitleStyles when present", () => {
    const result = validateEducation(
      education([educationEntry()], { sectionTitleStyles: style }),
    );
    assert.deepEqual(result.sectionTitleStyles, style);
  });

  it("throws when start is after end", () => {
    assert.throws(
      () =>
        validateEducation(
          education([educationEntry({ start: "2020-01-01T00:00:00+08:00" })]),
        ),
      /education\.content\[0\]\.start/,
    );
  });

  it("throws on an empty subtitle", () => {
    assert.throws(
      () => validateEducation(education([educationEntry({ subtitle: "" })])),
      /education\.content\[0\]\.subtitle/,
    );
  });

  it("throws when details is not an array of strings", () => {
    assert.throws(
      () => validateEducation(education([educationEntry({ details: 1 })])),
      /education\.content\[0\]\.details/,
    );
  });
});

const qualification = (content: unknown) => ({
  type: "qualification",
  visible: false,
  sectionName: "QUALIFICATION.LOG",
  sectionTitle: "Qualification",
  content,
});

describe("validateQualification", () => {
  it("accepts non-empty strings", () => {
    const result = validateQualification(qualification(["A", "B"]));
    assert.deepEqual(result.content, ["A", "B"]);
    assert.equal(result.visible, false);
  });

  it("throws with an index path on an empty string", () => {
    assert.throws(
      () => validateQualification(qualification(["A", " "])),
      /qualification\.content\[1\]/,
    );
  });

  it("throws when content is not an array", () => {
    assert.throws(
      () => validateQualification(qualification("A")),
      /qualification\.content: must be an array/,
    );
  });
});

const skills = (list: unknown[], extra: Record<string, unknown> = {}) => ({
  type: "skills",
  visible: true,
  sectionName: "SKILLS.LOG",
  sectionTitle: "SKILLS",
  sectionTitleStyles: style,
  skills: list,
  ...extra,
});

const skill = (overrides: Record<string, unknown> = {}) => ({
  label: "language.js",
  title: "JavaScript",
  icon: "js",
  style: { backgroundColor: "#F5E642", color: "#000000" },
  ...overrides,
});

describe("validateSkills", () => {
  it("accepts a valid section", () => {
    const result = validateSkills(skills([skill()]));
    assert.equal(result.skills[0].icon, "js");
    assert.equal(result.visible, true);
  });

  it("throws with a path on an empty icon", () => {
    assert.throws(
      () => validateSkills(skills([skill({ icon: "" })])),
      /skills\.skills\[0\]\.icon/,
    );
  });

  it("throws when style.color is missing", () => {
    assert.throws(
      () =>
        validateSkills(
          skills([skill({ style: { backgroundColor: "#fff" } })]),
        ),
      /skills\.skills\[0\]\.style\.color/,
    );
  });

  it("throws when skills is not an array", () => {
    assert.throws(
      () => validateSkills(skills([], { skills: {} })),
      /skills\.skills: must be an array/,
    );
  });
});

describe("parsePortfolio", () => {
  const real: unknown = JSON.parse(
    readFileSync(new URL("../content/portfolio.json", import.meta.url), "utf8"),
  );

  function clone(): { title: string; sections: Record<string, unknown>[] } {
    return JSON.parse(JSON.stringify(real));
  }

  it("parses the real content/portfolio.json", () => {
    const parsed = parsePortfolio(real);
    assert.equal(typeof parsed.title, "string");
    assert.equal(parsed.details.content.portfolioLink.startsWith("https://"), true);
    assert.equal(parsed.experience.visible, true);
    assert.equal(parsed.skills.skills.length > 0, true);
    assert.equal(parsed.education.content.length > 0, true);
    assert.equal(parsed.qualification.content.length > 0, true);
  });

  it("carries the section visible flags from the JSON", () => {
    const parsed = parsePortfolio(real);
    assert.deepEqual(
      {
        details: parsed.details.visible,
        hero: parsed.hero.visible,
        about: parsed.about.visible,
        skills: parsed.skills.visible,
        experience: parsed.experience.visible,
        education: parsed.education.visible,
        qualification: parsed.qualification.visible,
        projects: parsed.projects.visible,
        contact: parsed.contact.visible,
      },
      {
        details: false,
        hero: true,
        about: true,
        skills: true,
        experience: true,
        education: false,
        qualification: false,
        projects: true,
        contact: true,
      },
    );
  });

  for (const type of SECTION_TYPES) {
    it(`throws with the path when "${type}" has no visible flag`, () => {
      const raw = clone();
      const target = raw.sections.find((s) => s.type === type);
      assert.ok(target);
      delete target.visible;
      assert.throws(
        () => parsePortfolio(raw),
        new RegExp(`${type}\\.visible: must be a boolean`),
      );
    });

    it(`throws when "${type}" visible is not a boolean`, () => {
      const raw = clone();
      const target = raw.sections.find((s) => s.type === type);
      assert.ok(target);
      target.visible = 1;
      assert.throws(() => parsePortfolio(raw), new RegExp(`${type}\\.visible`));
    });
  }

  it("throws on a missing section type", () => {
    const raw = clone();
    raw.sections = raw.sections.filter((s) => s.type !== "qualification");
    assert.throws(() => parsePortfolio(raw), /missing.*qualification/);
  });

  it("throws on a duplicate section type", () => {
    const raw = clone();
    raw.sections.push({ ...raw.sections[0] });
    assert.throws(() => parsePortfolio(raw), /duplicate section type "details"/);
  });

  it("throws on an unknown section type", () => {
    const raw = clone();
    raw.sections.push({ type: "bogus", visible: true });
    assert.throws(() => parsePortfolio(raw), /unknown section type "bogus"/);
  });

  it("throws when the root is not an object or sections is not an array", () => {
    assert.throws(() => parsePortfolio(null), /portfolio: must be an object/);
    assert.throws(
      () => parsePortfolio({ title: "x", sections: {} }),
      /sections: must be an array/,
    );
  });
});
