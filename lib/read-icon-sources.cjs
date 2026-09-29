"use strict";

const fs = require("fs");
const path = require("path");

function readIconSources() {
  const iconsDir = path.join(process.cwd(), "public", "icons");
  return Object.fromEntries(
    fs
      .readdirSync(iconsDir)
      .filter((file) => file.endsWith(".svg"))
      .sort()
      .map((file) => [
        file.slice(0, -".svg".length),
        fs.readFileSync(path.join(iconsDir, file), "utf8"),
      ]),
  );
}

module.exports = { readIconSources };
