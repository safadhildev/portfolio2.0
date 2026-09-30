import type { SectionType } from "@/lib/content";

export const BODY_PADDING_TOP = "100px";
export const BODY_PADDING_BOTTOM = "70px";

export const SECTION_LABEL = {
  HOME: "Home",
  ABOUT: "About",
  EXPERIENCE: "Experience",
  PROJECTS: "Projects",
};

export const SECTION_HREF = {
  HOME: "#home",
  ABOUT: "#about",
  EXPERIENCE: "#experience",
  PROJECTS: "#projects",
  CONTACT: "#contact",
};

/** Content section that owns each nav/sidebar anchor (exhaustive over SECTION_HREF). */
const HREF_SECTION_TYPE: Record<keyof typeof SECTION_HREF, SectionType> = {
  HOME: "hero",
  ABOUT: "about",
  EXPERIENCE: "experience",
  PROJECTS: "projects",
  CONTACT: "contact",
};

/** Anchors whose section is rendered; nav links and sidebar files filter on this. */
export function buildVisibleHrefs(
  visible: ReadonlySet<SectionType>,
): ReadonlySet<string> {
  const hrefs = new Set<string>();
  for (const key of Object.keys(HREF_SECTION_TYPE) as (keyof typeof SECTION_HREF)[]) {
    if (visible.has(HREF_SECTION_TYPE[key])) hrefs.add(SECTION_HREF[key]);
  }
  return hrefs;
}

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: SECTION_LABEL.HOME, href: SECTION_HREF.HOME },
  { label: SECTION_LABEL.ABOUT, href: SECTION_HREF.ABOUT },
  { label: SECTION_LABEL.EXPERIENCE, href: SECTION_HREF.EXPERIENCE },
  { label: SECTION_LABEL.PROJECTS, href: SECTION_HREF.PROJECTS },
];
