import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { PortfolioContent } from "./content.ts";
import { parsePortfolio } from "./content-schema.ts";
import {
  RESUME_CONFIG,
  RESUME_FILE,
  RESUME_ROUTE,
  SKILL_GROUP_ORDER,
  buildResumeModel,
  skillGroupForLabel,
  skillGroupLabel,
} from "./resume.ts";
import type { SkillGroupKey } from "./resume.ts";

function realContent(): PortfolioContent {
  return parsePortfolio(
    JSON.parse(
      readFileSync(new URL("../content/portfolio.json", import.meta.url), "utf8"),
    ),
  );
}

/** Same content with every section flagged hidden. */
function allHidden(): PortfolioContent {
  const c = structuredClone(realContent());
  c.details.visible = false;
  c.hero.visible = false;
  c.about.visible = false;
  c.skills.visible = false;
  c.experience.visible = false;
  c.education.visible = false;
  c.qualification.visible = false;
  c.projects.visible = false;
  c.contact.visible = false;
  return c;
}

describe("resume constants", () => {
  it("exposes the public file and route", () => {
    assert.equal(RESUME_FILE, "Syed-Ahmad-Fadhil-Resume.pdf");
    assert.equal(RESUME_ROUTE, "/resume");
  });
});

describe("buildResumeModel", () => {
  it("ignores `visible`: hidden sections still produce the full resume", () => {
    const model = buildResumeModel(allHidden());
    assert.equal(model.header.name, "Syed Ahmad Fadhil Bin Syed Hassan");
    assert.deepEqual(
      model.sections.map((s) => s.kind),
      ["experience", "education", "skills", "qualification"],
    );
  });

  it("follows the configured section order and headings", () => {
    const model = buildResumeModel(realContent());
    assert.deepEqual(model.sections.map((s) => s.kind), [...RESUME_CONFIG.sections]);
    assert.deepEqual(
      model.sections.map((s) => s.heading),
      ["Experience", "Education", "Skills", "Qualifications"],
    );
  });

  it("maps details to header and metadata", () => {
    const model = buildResumeModel(realContent());
    assert.equal(model.header.headline, "Product Engineer");
    assert.deepEqual(model.header.contact, [
      "Kuala Lumpur, Malaysia",
      "safadhil95@gmail.com",
      "syedahmadfadhil.vercel.app",
    ]);
    assert.equal(model.header.portfolioUrl, "https://syedahmadfadhil.vercel.app");
    assert.equal(model.meta.title, "Syed Ahmad Fadhil Bin Syed Hassan — Resume");
    assert.equal(model.meta.author, "Syed Ahmad Fadhil Bin Syed Hassan");
    assert.equal(model.meta.subject, "Product Engineer");
    assert.ok(model.meta.keywords.includes("React Native"));
  });

  it("orders experience newest first with formatted date ranges", () => {
    const model = buildResumeModel(realContent());
    const experience = model.sections[0];
    assert.equal(experience.kind, "experience");
    if (experience.kind !== "experience") return;
    assert.deepEqual(
      experience.items.map((i) => i.dateRange),
      ["Oct 2025 - Present", "Aug 2023 - Oct 2025", "Apr 2020 - Aug 2023"],
    );
    assert.equal(experience.items[0].org, "Big Corridor Sdn Bhd");
    assert.equal(
      experience.items[0].bullets[0],
      "Working as a Full Stack Developer, I'm responsible for building and maintaining the company's products.",
    );
    assert.deepEqual(experience.items[0].tech.slice(0, 3), ["React Native", "Next.js", "JavaScript"]);
    assert.equal(new Set(experience.items[1].tech).size, experience.items[1].tech.length);
  });

  it("sorts education newest first and uses subtitle as org", () => {
    const model = buildResumeModel(realContent());
    const education = model.sections[1];
    assert.equal(education.kind, "education");
    if (education.kind !== "education") return;
    assert.deepEqual(
      education.items.map((i) => i.title),
      [
        "Data Analyst with Python Track",
        "Bachelor of Science (Hons.) Computational Mathematics",
        "Diploma in Mathematical Sciences",
      ],
    );
    assert.equal(education.items[1].org, "Universiti Teknologi Mara (UiTM) Negeri Sembilan");
    assert.equal(education.items[1].dateRange, "Sep 2016 - Jan 2019");
  });

  it("prints qualification bullets verbatim, fragments included", () => {
    const c = realContent();
    const model = buildResumeModel(c);
    const q = model.sections[3];
    assert.equal(q.kind, "qualification");
    if (q.kind !== "qualification") return;
    assert.deepEqual(q.bullets, c.qualification.content);
  });

  it("groups skills by label prefix and puts extra experience tech under tools", () => {
    const model = buildResumeModel(realContent());
    const skills = model.sections[2];
    assert.equal(skills.kind, "skills");
    if (skills.kind !== "skills") return;
    const byKey = new Map(skills.groups.map((g) => [g.key, g.items]));
    assert.deepEqual(byKey.get("languages"), ["Java", "JavaScript", "TypeScript"]);
    assert.deepEqual(byKey.get("frameworks"), ["React Native", "Android", "Node.js"]);
    assert.deepEqual(byKey.get("cloud"), ["Firebase"]);
    const tools = byKey.get("tools") ?? [];
    assert.ok(tools.includes("Next.js") && tools.includes("Jira"));
    assert.ok(!tools.includes("React Native") && !tools.includes("TypeScript"));
    const all = skills.groups.flatMap((g) => g.items.map((i) => i.toLowerCase()));
    assert.equal(new Set(all).size, all.length, "no skill is listed twice");
  });

  it("produces every section kind and every skill group key", () => {
    const c = realContent();
    c.skills.skills.push({
      label: "misc.unknown",
      title: "Figma",
      icon: "figma",
      style: { backgroundColor: "#fff", color: "#000" },
    });
    const model = buildResumeModel(c);
    const kinds = new Set(model.sections.map((s) => s.kind));
    assert.deepEqual([...kinds].sort(), ["education", "experience", "qualification", "skills"]);
    const skills = model.sections.find((s) => s.kind === "skills");
    assert.ok(skills && skills.kind === "skills");
    if (!skills || skills.kind !== "skills") return;
    const keys = new Set<SkillGroupKey>(skills.groups.map((g) => g.key));
    for (const key of SKILL_GROUP_ORDER) assert.ok(keys.has(key), `missing group ${key}`);
    assert.deepEqual(skills.groups.map((g) => g.key), [...SKILL_GROUP_ORDER]);
    assert.ok(skills.groups.find((g) => g.key === "tools")?.items.includes("Figma"));
  });

  it("omits empty sections", () => {
    const c = realContent();
    c.education.content = [];
    c.qualification.content = [];
    const model = buildResumeModel(c);
    assert.deepEqual(model.sections.map((s) => s.kind), ["experience", "skills"]);
  });

  it("never includes hero, about, projects or contact text", () => {
    const c = realContent();
    const json = JSON.stringify(buildResumeModel(c));
    assert.ok(!json.includes(c.hero.title));
    assert.ok(!json.includes(c.about.content.slice(0, 40)));
    assert.ok(!json.includes(c.contact.email));
    for (const p of c.projects.content) assert.ok(!json.includes(p.title));
  });

  it("does not mutate the content", () => {
    const c = realContent();
    const before = structuredClone(c);
    buildResumeModel(c);
    assert.deepEqual(c, before);
  });
});

describe("skill grouping", () => {
  const cases: [string, SkillGroupKey][] = [
    ["language.ts", "languages"],
    ["mobile.framework", "frameworks"],
    ["platform.android", "frameworks"],
    ["runtime.node", "frameworks"],
    ["framework.next", "frameworks"],
    ["cloud.firebase", "cloud"],
    ["tool.git", "tools"],
    ["nodots", "tools"],
  ];
  for (const [label, expected] of cases) {
    it(`${label} -> ${expected}`, () => {
      assert.equal(skillGroupForLabel(label), expected);
    });
  }

  it("has a label for every group key", () => {
    assert.deepEqual(SKILL_GROUP_ORDER.map(skillGroupLabel), [
      "Languages",
      "Frameworks & Platforms",
      "Cloud & Services",
      "Tools & Technologies",
    ]);
  });
});
