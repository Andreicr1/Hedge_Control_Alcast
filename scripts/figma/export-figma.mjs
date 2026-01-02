import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(process.cwd(), ".env.figma.local");
const OUT_DIR = path.resolve(process.cwd(), "figma-export");

function readEnvFromFile(filePath, key) {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(new RegExp(`^(?:export\\s+)?${key}\\s*=\\s*(.*)\\s*$`));
    if (!m) continue;

    let v = m[1].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v.trim();
  }
  return undefined;
}

function getToken() {
  const fromEnv = (process.env.FIGMA_TOKEN ?? "").trim();
  if (fromEnv) return fromEnv;

  const fromFile = (readEnvFromFile(ENV_PATH, "FIGMA_TOKEN") ?? "").trim();
  if (fromFile) return fromFile;

  throw new Error("FIGMA_TOKEN não encontrado. Rode o setup-token.mjs ou defina FIGMA_TOKEN no ambiente.");
}

async function fetchJson(url, token) {
  const res = await fetch(url, { headers: { "X-Figma-Token": token } });
  if (res.status === 401 || res.status === 403) throw new Error("Sem acesso (401/403). Token inválido ou sem permissão.");
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao chamar Figma API.`);
  return await res.json();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  const token = getToken();

  const fileKey = process.argv[2] || "wGyl9MgA49IJKzgb3hwfse";
  let nodeId = process.argv[3] || "4201-3851";
  if (/^\d+-\d+$/.test(nodeId)) nodeId = nodeId.replace("-", ":");

  ensureDir(OUT_DIR);

  const components = await fetchJson(`https://api.figma.com/v1/files/${fileKey}/components`, token);
  const styles = await fetchJson(`https://api.figma.com/v1/files/${fileKey}/styles`, token);
  const node = await fetchJson(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&depth=10`,
    token
  );

  writeJson(path.join(OUT_DIR, "components.json"), components);
  writeJson(path.join(OUT_DIR, "styles.json"), styles);
  writeJson(path.join(OUT_DIR, `node-${nodeId.replace(":", "-")}.json`), node);

  const componentList = (components?.meta?.components ?? []).map((c) => ({
    name: c.name,
    key: c.key,
    node_id: c.node_id,
    description: c.description,
  }));
  const styleList = (styles?.meta?.styles ?? []).map((s) => ({
    name: s.name,
    key: s.key,
    style_type: s.style_type,
    description: s.description,
  }));

  writeJson(path.join(OUT_DIR, "components-summary.json"), componentList);
  writeJson(path.join(OUT_DIR, "styles-summary.json"), styleList);

  console.log("OK: export concluído em ./figma-export");
  console.log("Envie pra mim: components-summary.json + styles-summary.json (e o node-*.json se quiser detalhes do frame).");
}

main().catch((e) => {
  console.error(e?.message ?? String(e));
  process.exitCode = 1;
});
