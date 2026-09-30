import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePortfolio } from "../lib/content-schema.ts";
import { RESUME_FILE, buildResumeModel } from "../lib/resume.ts";
import { renderResumePdf } from "../lib/resume-pdf.ts";

// Writes public/<RESUME_FILE> from content/portfolio.json. Any failure exits 1 so the deploy fails loudly.
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const raw: unknown = JSON.parse(
    readFileSync(path.join(root, "content", "portfolio.json"), "utf8"),
  );
  const model = buildResumeModel(parsePortfolio(raw));
  const { pdf, pages } = await renderResumePdf(model, {
    fontDir: path.join(root, "assets", "fonts"),
    creationDate: new Date(),
  });

  const outDir = path.join(root, "public");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, RESUME_FILE), pdf);
  console.log(`resume: ${pdf.length} bytes, ${pages} pages -> public/${RESUME_FILE}`);
}

main().catch((error: unknown) => {
  console.error("resume: build failed", error);
  process.exit(1);
});
