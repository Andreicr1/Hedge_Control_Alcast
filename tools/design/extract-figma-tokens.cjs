/* eslint-disable no-console */
/* Utility script (local) to help approximate 1:1 Figma by extracting token usage from figma-export node JSONs. */

const fs = require("fs");
const path = require("path");

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isColor(value) {
  return (
    isPlainObject(value) &&
    typeof value.r === "number" &&
    typeof value.g === "number" &&
    typeof value.b === "number" &&
    typeof value.a === "number"
  );
}

function clamp255(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function to255(x01) {
  return clamp255(x01 * 255);
}

function hex2(n) {
  return n.toString(16).padStart(2, "0");
}

function rgbaKey(c) {
  const r = to255(c.r);
  const g = to255(c.g);
  const b = to255(c.b);
  const a = Math.round(c.a * 1000) / 1000;
  return `${r},${g},${b},${a}`;
}

function keyToRgba(key) {
  const [r, g, b, a] = key.split(",");
  return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
}

function rgbaToHex({ r, g, b }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

function sortTop(map, limit = 20) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function walk(value, visitor) {
  if (value === null || value === undefined) return;
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  if (!isPlainObject(value)) return;
  for (const k of Object.keys(value)) walk(value[k], visitor);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inc(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function extractTokens(data) {
  const colors = new Map();
  const fontFamilies = new Map();
  const fontSizes = new Map();
  const fontWeights = new Map();
  const cornerRadius = new Map();
  const dropShadows = new Map();

  walk(data, (node) => {
    if (isColor(node)) {
      inc(colors, rgbaKey(node));
      return;
    }

    if (isPlainObject(node)) {
      if (typeof node.fontFamily === "string") inc(fontFamilies, node.fontFamily);
      if (typeof node.fontSize === "number") inc(fontSizes, String(node.fontSize));
      if (typeof node.fontWeight === "number") inc(fontWeights, String(node.fontWeight));

      if (typeof node.cornerRadius === "number") inc(cornerRadius, String(node.cornerRadius));
      if (Array.isArray(node.rectangleCornerRadii)) {
        inc(cornerRadius, `rect:${node.rectangleCornerRadii.join(",")}`);
      }

      if (node.type === "DROP_SHADOW") {
        const color = node.color && isColor(node.color) ? rgbaKey(node.color) : "none";
        const x = node.offset?.x ?? 0;
        const y = node.offset?.y ?? 0;
        const radius = node.radius ?? 0;
        const key = `x=${x},y=${y},r=${radius},c=${color}`;
        inc(dropShadows, key);
      }
    }
  });

  return { colors, fontFamilies, fontSizes, fontWeights, cornerRadius, dropShadows };
}

function printReport(label, tokens) {
  console.log(`\n=== ${label} ===`);

  console.log("\nTop colors:");
  for (const [k, count] of sortTop(tokens.colors, 20)) {
    const rgba = keyToRgba(k);
    const hex = rgbaToHex(rgba);
    console.log(`  ${hex} a=${rgba.a}  x${count}`);
  }

  console.log("\nFonts:");
  for (const [name, count] of sortTop(tokens.fontFamilies, 10)) {
    console.log(`  ${name}  x${count}`);
  }

  console.log("\nFont sizes:");
  for (const [size, count] of sortTop(tokens.fontSizes, 10)) {
    console.log(`  ${size}px  x${count}`);
  }

  console.log("\nFont weights:");
  for (const [w, count] of sortTop(tokens.fontWeights, 10)) {
    console.log(`  ${w}  x${count}`);
  }

  console.log("\nCorner radius:");
  for (const [r, count] of sortTop(tokens.cornerRadius, 10)) {
    console.log(`  ${r}  x${count}`);
  }

  console.log("\nDrop shadows:");
  for (const [s, count] of sortTop(tokens.dropShadows, 10)) {
    console.log(`  ${s}  x${count}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args
      : [
          "figma-export/node-17-1326.json",
          "figma-export/node-2202-3860.json",
          "figma-export/node-37-8309.json",
          "figma-export/node-81-20623.json",
        ];

  for (const file of files) {
    const fullPath = path.resolve(process.cwd(), file);
    const label = path.relative(process.cwd(), fullPath);
    const data = readJson(fullPath);
    const tokens = extractTokens(data);
    printReport(label, tokens);
  }
}

main();
