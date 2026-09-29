import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SECTION_TYPES,
  pickSections,
  validateExperience,
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
    sectionNumber: 3,
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
