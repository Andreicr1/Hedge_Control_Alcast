import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(process.cwd(), ".env.figma.local");

function readEnvFromFile(filePath, key) {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(new RegExp(`^(?:export\\s+)?${key}\\s*=\\s*(.*)\\s*$`));
    if (!m) continue;
    let v = m[1].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v.trim();
  }
  return undefined;
}

function getToken() {
  const t = (process.env.FIGMA_TOKEN ?? "").trim() || (readEnvFromFile(ENV_PATH, "FIGMA_TOKEN") ?? "").trim();
  if (!t) throw new Error("FIGMA_TOKEN não encontrado (env ou .env.figma.local).");
  return t;
}

async function fetchJson(url, token) {
  const res = await fetch(url, { headers: { "X-Figma-Token": token } });
  if (res.status === 401 || res.status === 403) throw new Error("Sem acesso (401/403).");
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  return await res.json();
}

function walk(node, level, filter) {
  const type = node.type;
  const name = node.name ?? "";
  const id = node.id ?? "";

  const interesting = ["CANVAS", "FRAME", "SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE"];
  const matches = !filter || name.toLowerCase().includes(filter);

  if (interesting.includes(type) && matches) {
    console.log(`${"  ".repeat(level)}- ${type} ${id} "${name}"`);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, level + 1, filter);
  }
}

async function main() {
  const token = getToken();
  const fileKey = process.argv[2] || "wGyl9MgA49IJKzgb3hwfse";
  const depth = Number(process.argv[3] || "4");
  const filter = (process.argv[4] || "").toLowerCase();

  const data = await fetchJson(`https://api.figma.com/v1/files/${fileKey}?depth=${depth}`, token);
  walk(data.document, 0, filter);
}

main().catch((e) => {
  console.error(e?.message ?? String(e));
  process.exitCode = 1;
});
