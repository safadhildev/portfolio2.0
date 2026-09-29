import { createRequire } from "node:module";

const require = createRequire(__filename);
const { readIconSources } = require("../../lib/read-icon-sources.cjs") as {
  readIconSources: () => Record<string, string>;
};

// Webpack replaces this module at compile time with the current public/icons
// files. Restart the dev server after adding or editing an icon.
export const iconSources: Record<string, string> = readIconSources();
