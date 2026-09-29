"use strict";

const path = require("path");
const { readIconSources } = require("./read-icon-sources.cjs");

function iconSourcesLoader() {
  return "";
}

iconSourcesLoader.pitch = function pitch() {
  this.addContextDependency(path.join(process.cwd(), "public", "icons"));
  const icons = readIconSources();
  return `export const iconSources = ${JSON.stringify(icons)};\n`;
};

module.exports = iconSourcesLoader;
