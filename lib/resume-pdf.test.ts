import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { parsePortfolio } from "./content-schema.ts";
import { buildResumeModel } from "./resume.ts";
import type { ResumeModel } from "./resume.ts";
import { renderResumePdf } from "./resume-pdf.ts";
import type { RenderedResume } from "./resume-pdf.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(root, "assets", "fonts");
const creationDate = new Date("2026-09-30T00:00:00Z");

const raw: unknown = JSON.parse(
  readFileSync(path.join(root, "content", "portfolio.json"), "utf8"),
);
const content = parsePortfolio(raw);
const model = buildResumeModel(content);

interface Extracted {
  rendered: RenderedResume;
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

async function extract(m: ResumeModel): Promise<Extracted> {
  const rendered = await renderResumePdf(m, { fontDir, creationDate });
  const pdf = await getDocumentProxy(new Uint8Array(rendered.pdf));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const meta = await getMeta(pdf);
  return { rendered, text, pages: totalPages, info: meta.info as Record<string, unknown> };
}

// pdfjs may re-wrap or re-space lines; compare on whitespace-normalised text.
const flat = (s: string) => s.replace(/\s+/g, " ").trim();
// A line wrap can land right after "/" (extracted as "ReactJs/ NextJs"), so verbatim checks ignore all whitespace.
const squash = (s: string) => s.replace(/\s+/g, "");

describe("renderResumePdf", () => {
  let out: Extracted;
  before(async () => {
    out = await extract(model);
  });

  it("is a PDF and reports the same page count pdfjs sees", () => {
    assert.equal(out.rendered.pdf.subarray(0, 5).toString("latin1"), "%PDF-");
    assert.equal(out.rendered.pages, out.pages);
  });

  it("fits in at most 3 pages", () => {
    assert.ok(out.pages >= 1 && out.pages <= 3, `pages = ${out.pages}`);
  });

  it("starts with the name and keeps headings in order", () => {
    const text = flat(out.text);
    assert.ok(text.startsWith(model.header.name));
    const idx = ["EXPERIENCE", "EDUCATION", "SKILLS", "QUALIFICATIONS"].map((h) => text.indexOf(h));
    idx.forEach((i, n) => assert.ok(i >= 0, `heading ${n} missing`));
    assert.ok(idx[0] < idx[1] && idx[1] < idx[2] && idx[2] < idx[3], `order ${idx.join(",")}`);
  });

  it("prints the contact line with the portfolio link without the scheme", () => {
    const text = flat(out.text);
    assert.ok(
      text.includes("Kuala Lumpur, Malaysia | safadhil95@gmail.com | syedahmadfadhil.vercel.app"),
    );
    assert.ok(!text.includes("https://"));
  });

  it("contains every responsibility, education detail and qualification verbatim", () => {
    const text = squash(out.text);
    for (const entry of content.experience.content) {
      for (const r of entry.responsibilities) assert.ok(text.includes(squash(r)), `missing: ${r}`);
    }
    for (const q of content.qualification.content) assert.ok(text.includes(squash(q)), `missing: ${q}`);
    for (const e of content.education.content) {
      for (const d of e.details) assert.ok(text.includes(squash(d)), `missing: ${d}`);
    }
  });

  it("has no replacement characters and keeps curly quote, en dash and ligature words", () => {
    assert.ok(!out.text.includes("�"));
    const text = flat(out.text);
    assert.ok(text.includes("I’ve created"), "curly apostrophe");
    assert.ok(text.includes("(InIIC Series 1/2020) – I’ve"), "en dash");
    assert.ok(text.includes("Firebase"), "Firebase");
    assert.ok(!/[ﬀ-ﬆ]/.test(out.text), "no ligature code points");
  });

  it("sets document metadata, language and title display", () => {
    assert.equal(out.info.Title, "Syed Ahmad Fadhil Bin Syed Hassan — Resume");
    assert.equal(out.info.Author, model.header.name);
    assert.equal(out.info.Subject, "Product Engineer");
    assert.equal(out.info.Keywords, model.meta.keywords.join(", "));
    assert.equal(out.info.Language, "en");
    const s = out.rendered.pdf.toString("latin1");
    assert.match(s, /\/DisplayDocTitle true/);
  });

  it("is tagged with a structure tree", () => {
    const s = out.rendered.pdf.toString("latin1");
    assert.match(s, /\/Marked true/);
    assert.match(s, /\/Type \/StructTreeRoot/);
    for (const tag of ["/S /Document", "/S /H1", "/S /H2", "/S /P", "/S /L", "/S /LI"]) {
      assert.ok(s.includes(tag), `missing structure tag ${tag}`);
    }
  });

  it("embeds Liberation Sans subsets and no standard-14 fonts", () => {
    const s = out.rendered.pdf.toString("latin1");
    assert.match(s, /\/FontName \/[A-Z]{6}\+LiberationSans-Bold/);
    assert.match(s, /\/FontName \/[A-Z]{6}\+LiberationSans\b/);
    assert.ok(s.includes("/FontFile2"));
    assert.ok(!/\/BaseFont \/(Helvetica|Times|Courier)/.test(s));
  });

  it("adds no images or tables", () => {
    const s = out.rendered.pdf.toString("latin1");
    assert.ok(!s.includes("/Subtype /Image"));
    assert.ok(!/\/S \/(Table|TR|TD|TH)\b/.test(s));
  });

  it("links the portfolio URL", () => {
    const s = out.rendered.pdf.toString("latin1");
    assert.ok(s.includes("/URI (https://syedahmadfadhil.vercel.app)"));
  });

  it("renders hidden sections too (resume ignores visible)", async () => {
    const hidden = structuredClone(content);
    hidden.education.visible = false;
    hidden.qualification.visible = false;
    hidden.experience.visible = false;
    const r = await extract(buildResumeModel(hidden));
    assert.ok(r.text.includes("EDUCATION") && r.text.includes("QUALIFICATIONS"));
  });

  it("paginates long content without dropping text", async () => {
    const big = structuredClone(model);
    const exp = big.sections[0];
    assert.equal(exp.kind, "experience");
    if (exp.kind !== "experience") return;
    exp.items = Array.from({ length: 12 }, (_, i) => ({ ...exp.items[0], title: `Role ${i}` }));
    const r = await extract(big);
    assert.ok(r.pages > 3);
    for (let i = 0; i < 12; i += 1) assert.ok(r.text.includes(`Role ${i}`));
  });
});
