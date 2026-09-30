import path from "node:path";
import PDFDocument from "pdfkit";
import { assertNever } from "./experience.ts";
import type { ResumeModel, ResumeSection } from "./resume.ts";

// Liberation Sans (SIL OFL 1.1, metric-compatible with Arial). Type sizes in pt; the base body size drives the rest.
export const RESUME_LAYOUT = {
  margin: 50,
  bodySize: 11,
  nameSize: 22,
  headingSize: 12.5,
  metaSize: 10.5,
  ruleWidth: 0.75,
  lineGap: 1.5,
  bulletRadius: 1.6,
  bulletTextIndent: 12,
  gapAfterHeader: 6,
  gapAfterHeading: 6,
  gapBetweenSections: 12,
  gapBetweenEntries: 8,
  gapAfterLine: 2,
} as const;

export const RESUME_FONT_FILES = {
  regular: "LiberationSans-Regular.ttf",
  bold: "LiberationSans-Bold.ttf",
} as const;

const REGULAR = "Body";
const BOLD = "Bold";
// Kerning only: default ligatures would turn "fi"/"fl" into single glyphs that some ATS parsers extract badly.
const FEATURES: PDFKit.Mixins.OpenTypeFeatures[] = ["kern"];

export interface RenderResumeOptions {
  fontDir: string;
  creationDate: Date;
}

export interface RenderedResume {
  pdf: Buffer;
  pages: number;
}

type Doc = InstanceType<typeof PDFDocument>;
type Struct = ReturnType<Doc["struct"]>;

export function renderResumePdf(
  model: ResumeModel,
  options: RenderResumeOptions,
): Promise<RenderedResume> {
  const L = RESUME_LAYOUT;
  const docOptions: PDFKit.PDFDocumentOptions = {
    size: "A4",
    margins: { top: L.margin, bottom: L.margin, left: L.margin, right: L.margin },
    tagged: true,
    lang: "en",
    displayTitle: true,
    pdfVersion: "1.7",
    info: {
      Title: model.meta.title,
      Author: model.meta.author,
      Subject: model.meta.subject,
      Keywords: model.meta.keywords.join(", "),
      Creator: "portfolio2.0",
      Producer: "PDFKit",
      CreationDate: options.creationDate,
    },
  };
  const doc = new PDFDocument(docOptions);
  let pages = 1;
  doc.on("pageAdded", () => {
    pages += 1;
  });
  doc.registerFont(REGULAR, path.join(options.fontDir, RESUME_FONT_FILES.regular));
  doc.registerFont(BOLD, path.join(options.fontDir, RESUME_FONT_FILES.bold));

  const chunks: Buffer[] = [];
  const done = new Promise<RenderedResume>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve({ pdf: Buffer.concat(chunks), pages }));
  });

  const contentWidth = doc.page.width - L.margin * 2;
  const bottom = () => doc.page.height - L.margin;

  const font = (face: string, size: number) => doc.font(face).fontSize(size);

  /** Moves to a fresh page when the next block would not fit in the remaining space. */
  const ensureSpace = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const heightOf = (text: string, face: string, size: number, width = contentWidth) => {
    font(face, size);
    return doc.heightOfString(text, { width, features: FEATURES, lineGap: L.lineGap });
  };

  const line = (
    parent: Struct,
    type: string,
    text: string,
    face: string,
    size: number,
    extra: PDFKit.Mixins.TextOptions = {},
  ) => {
    font(face, size);
    doc.text(text, {
      width: contentWidth,
      features: FEATURES,
      lineGap: L.lineGap,
      structParent: parent,
      structType: type,
      ...extra,
    });
  };

  const bulletList = (parent: Struct, bullets: string[], size: number) => {
    if (bullets.length === 0) return;
    const list = doc.struct("L");
    parent.add(list);
    font(REGULAR, size);
    doc.list(bullets, {
      width: contentWidth,
      features: FEATURES,
      lineGap: L.lineGap,
      bulletRadius: L.bulletRadius,
      textIndent: L.bulletTextIndent,
      structParent: list,
    });
    list.end();
  };

  // The rule is decoration, not content: mark it as an artifact so it never enters the text flow.
  const rule = () => {
    doc.markContent("Artifact", { type: "Layout" });
    doc
      .lineWidth(L.ruleWidth)
      .strokeColor("#000000")
      .moveTo(L.margin, doc.y)
      .lineTo(L.margin + contentWidth, doc.y)
      .stroke();
    doc.endMarkedContent();
    doc.fillColor("#000000");
  };

  const gap = (points: number) => {
    doc.y += points;
  };

  doc.fillColor("#000000");
  const root = doc.struct("Document");
  doc.addStructure(root);

  // Header
  const { header } = model;
  line(root, "H1", header.name, BOLD, L.nameSize);
  line(root, "P", header.headline, REGULAR, L.bodySize);
  drawContact(doc, root, header.contact, header.portfolioUrl, contentWidth, line);
  gap(L.gapAfterHeader);

  model.sections.forEach((section, index) => {
    if (index > 0) gap(L.gapBetweenSections);
    drawSection(section);
  });

  function drawSection(section: ResumeSection) {
    const sect = doc.struct("Sect");
    root.add(sect);

    const headingText = section.heading.toUpperCase();
    // Keep the heading with the first entry: reserve room for both before drawing either.
    ensureSpace(
      heightOf(headingText, BOLD, L.headingSize) + L.gapAfterHeading + firstBlockHeight(section),
    );
    line(sect, "H2", headingText, BOLD, L.headingSize);
    gap(1);
    rule();
    gap(L.gapAfterHeading);

    switch (section.kind) {
      case "experience":
        section.items.forEach((item, i) => {
          if (i > 0) gap(L.gapBetweenEntries);
          ensureSpace(entryHeadHeight(item.title, item.org, item.dateRange, item.bullets[0]));
          line(sect, "H3", item.title, BOLD, L.bodySize);
          line(sect, "P", `${item.org} | ${item.dateRange}`, REGULAR, L.metaSize);
          gap(L.gapAfterLine);
          bulletList(sect, item.bullets, L.bodySize);
          if (item.tech.length > 0) {
            gap(L.gapAfterLine);
            line(sect, "P", `Tech: ${item.tech.join(", ")}`, REGULAR, L.metaSize);
          }
        });
        break;
      case "education":
        section.items.forEach((item, i) => {
          if (i > 0) gap(L.gapBetweenEntries);
          ensureSpace(entryHeadHeight(item.title, item.org, item.dateRange, item.bullets[0]));
          line(sect, "H3", item.title, BOLD, L.bodySize);
          line(sect, "P", `${item.org} | ${item.dateRange}`, REGULAR, L.metaSize);
          gap(L.gapAfterLine);
          bulletList(sect, item.bullets, L.bodySize);
        });
        break;
      case "skills":
        section.groups.forEach((group, i) => {
          if (i > 0) gap(L.gapAfterLine);
          ensureSpace(heightOf(`${group.label}: ${group.items.join(", ")}`, REGULAR, L.bodySize));
          line(sect, "P", `${group.label}: ${group.items.join(", ")}`, REGULAR, L.bodySize);
        });
        break;
      case "qualification":
        bulletList(sect, section.bullets, L.bodySize);
        break;
      default:
        assertNever(section);
    }
    sect.end();
  }

  function entryHeadHeight(title: string, org: string, dateRange: string, firstBullet?: string) {
    return (
      heightOf(title, BOLD, L.bodySize) +
      heightOf(`${org} | ${dateRange}`, REGULAR, L.metaSize) +
      L.gapAfterLine +
      (firstBullet === undefined
        ? 0
        : heightOf(firstBullet, REGULAR, L.bodySize, contentWidth - L.bulletTextIndent))
    );
  }

  function firstBlockHeight(section: ResumeSection): number {
    switch (section.kind) {
      case "experience":
      case "education": {
        const first = section.items[0];
        return first
          ? entryHeadHeight(first.title, first.org, first.dateRange, first.bullets[0])
          : 0;
      }
      case "skills": {
        const first = section.groups[0];
        return first ? heightOf(`${first.label}: ${first.items.join(", ")}`, REGULAR, L.bodySize) : 0;
      }
      case "qualification":
        return section.bullets[0]
          ? heightOf(section.bullets[0], REGULAR, L.bodySize, contentWidth - L.bulletTextIndent)
          : 0;
      default:
        return assertNever(section);
    }
  }

  root.end();
  doc.end();
  return done;
}

/** One contact line "a | b | c"; the last entry (portfolio URL) also gets a clickable link annotation. */
function drawContact(
  doc: Doc,
  parent: Struct,
  contact: string[],
  url: string,
  width: number,
  line: (
    parent: Struct,
    type: string,
    text: string,
    face: string,
    size: number,
    extra?: PDFKit.Mixins.TextOptions,
  ) => void,
) {
  const L = RESUME_LAYOUT;
  const text = contact.join(" | ");
  const last = contact[contact.length - 1] ?? "";
  doc.font(REGULAR).fontSize(L.metaSize);
  if (doc.widthOfString(text, { features: FEATURES }) > width) {
    throw new Error("resume: contact line does not fit on one line");
  }
  const x = L.margin + doc.widthOfString(text.slice(0, text.length - last.length), { features: FEATURES });
  const y = doc.y;
  const height = doc.currentLineHeight();
  line(parent, "P", text, REGULAR, L.metaSize);
  if (last.length > 0) {
    doc.link(x, y, doc.widthOfString(last, { features: FEATURES }), height, url);
  }
}
