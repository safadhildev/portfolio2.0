import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { PortfolioContent } from "./content.ts";
import { SECTION_TYPES, parsePortfolio } from "./content-schema.ts";
import type { SectionType } from "./content-schema.ts";
import {
  WEBSITE_ORDER,
  filterVisible,
  numberSections,
  visibleSectionTypes,
} from "./visibility.ts";

function realContent(): PortfolioContent {
  const raw: unknown = JSON.parse(
    readFileSync(new URL("../content/portfolio.json", import.meta.url), "utf8"),
  );
  return parsePortfolio(raw);
}

function withVisible(hidden: readonly SectionType[]): PortfolioContent {
  const content = realContent();
  for (const type of SECTION_TYPES) {
    content[type].visible = !hidden.includes(type);
  }
  return content;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

describe("filterVisible", () => {
  it("keeps only items with visible === true, preserving order", () => {
    const items = [
      { id: 1, visible: true },
      { id: 2, visible: false },
      { id: 3, visible: true },
    ];
    assert.deepEqual(
      filterVisible(items).map((i) => i.id),
      [1, 3],
    );
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(filterVisible([]), []);
  });
});

describe("visibleSectionTypes", () => {
  it("matches the real portfolio.json", () => {
    assert.deepEqual(
      [...visibleSectionTypes(realContent())].sort(),
      ["about", "contact", "experience", "hero", "projects", "skills"],
    );
  });

  it("returns an empty set when everything is hidden", () => {
    assert.equal(visibleSectionTypes(withVisible([...SECTION_TYPES])).size, 0);
  });

  it("includes education when it is flagged visible", () => {
    const content = withVisible(SECTION_TYPES.filter((t) => t !== "education"));
    assert.deepEqual([...visibleSectionTypes(content)], ["education"]);
  });
});

describe("numberSections", () => {
  it("numbers all website sections 1..5 when all are visible", () => {
    const numbers = numberSections(WEBSITE_ORDER, visibleSectionTypes(realContent()));
    assert.deepEqual(numbers, {
      about: 1,
      skills: 2,
      experience: 3,
      projects: 4,
      contact: 5,
    });
  });

  it("closes the gap when experience is hidden (projects becomes 3)", () => {
    const numbers = numberSections(
      WEBSITE_ORDER,
      visibleSectionTypes(withVisible(["experience"])),
    );
    assert.equal(numbers.experience, undefined);
    assert.equal(numbers.projects, 3);
    assert.equal(numbers.contact, 4);
  });

  it("starts experience at 1 when about and skills are hidden", () => {
    const numbers = numberSections(
      WEBSITE_ORDER,
      visibleSectionTypes(withVisible(["about", "skills"])),
    );
    assert.equal(numbers.experience, 1);
    assert.equal(numbers.projects, 2);
  });

  it("does not number hero or sections outside the order", () => {
    const numbers = numberSections(
      WEBSITE_ORDER,
      visibleSectionTypes(realContent()),
    );
    assert.equal(numbers.hero, undefined);
    assert.equal(numbers.education, undefined);
  });

  it("returns an empty map when all are hidden", () => {
    assert.deepEqual(numberSections(WEBSITE_ORDER, new Set()), {});
  });
});

describe("WEBSITE_ORDER", () => {
  it("is exhaustively classifiable over SectionType", () => {
    const isNumbered = (type: SectionType): boolean => {
      switch (type) {
        case "about":
        case "skills":
        case "experience":
        case "projects":
        case "contact":
          return true;
        case "details":
        case "hero":
        case "education":
        case "qualification":
          return false;
        default:
          return assertNever(type);
      }
    };
    for (const type of SECTION_TYPES) {
      assert.equal(WEBSITE_ORDER.includes(type as never), isNumbered(type), type);
    }
  });
});
