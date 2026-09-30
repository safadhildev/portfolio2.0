import type { PortfolioContent } from "./content.ts";
import { SECTION_TYPES } from "./content-schema.ts";
import type { SectionType } from "./content-schema.ts";

/**
 * Website-only visibility helpers. The resume pipeline must never call these.
 *
 * `visible: false` is a display flag, not a privacy control: app/page.tsx is a
 * client component that imports the whole JSON, so hidden sections still ship
 * in the client bundle.
 */

/** Numbered website sections, in page order (hero and the nav are unnumbered). */
export const WEBSITE_ORDER = [
  "about",
  "skills",
  "experience",
  "projects",
  "contact",
] as const satisfies readonly SectionType[];

/** Keeps only items whose `visible` is exactly true. */
export function filterVisible<T extends { visible: boolean }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.visible === true);
}

/** Types of every section flagged visible (all 9 are checked). */
export function visibleSectionTypes(
  content: PortfolioContent,
): ReadonlySet<SectionType> {
  const sections = SECTION_TYPES.map((type) => content[type]);
  return new Set(filterVisible(sections).map((section) => section.type));
}

/** Numbers the visible sections of `order` 1..n with no gaps. */
export function numberSections(
  order: readonly SectionType[],
  visible: ReadonlySet<SectionType>,
): Partial<Record<SectionType, number>> {
  const numbers: Partial<Record<SectionType, number>> = {};
  let next = 1;
  for (const type of order) {
    if (visible.has(type)) numbers[type] = next++;
  }
  return numbers;
}
