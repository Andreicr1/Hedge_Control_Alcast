import fs from "node:fs";
import path from "node:path";

const ENV_FILENAME = ".env.figma.local";
const ENV_PATH = path.resolve(process.cwd(), ENV_FILENAME);
const KEY = "FIGMA_TOKEN";

function quoteEnvValue(value) {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function upsertEnvVar(content, key, value) {
  const lines = content ? content.split(/\r?\n/) : [];
  const re = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);

  let replaced = false;
  const out = lines.map((line) => {
    if (!line.trimStart().startsWith("#") && re.test(line)) {
      replaced = true;
      return `${key}=${quoteEnvValue(value)}`;
    }
    return line;
  });

  if (!replaced) {
    if (out.length && out[out.length - 1].trim() !== "") out.push("");
    out.push(`${key}=${quoteEnvValue(value)}`);
  }

  return out.join("\n").replace(/\s*$/, "\n");
}

async function promptSecret(promptText) {
  const stdin = process.stdin;
  const stdout = process.stdout;

  if (!stdin.isTTY) {
    throw new Error("Terminal não interativo. Defina FIGMA_TOKEN no ambiente e rode novamente.");
  }

  stdout.write(promptText);

  stdin.setEncoding("utf8");
  stdin.resume();
  stdin.setRawMode(true);

  let value = "";

  return await new Promise((resolve, reject) => {
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdout.write("\n");
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          resolve(value);
          return;
        }

        if (ch === "\u0003") {
          stdout.write("\n");
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          reject(new Error("cancelado"));
          return;
        }

        if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }

        value += ch;
        stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

async function pingFigma(token) {
  const res = await fetch("https://api.figma.com/v1/me", {
    headers: { "X-Figma-Token": token },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Token inválido ou sem permissão.");
  }
  if (!res.ok) {
    throw new Error(`Erro da API do Figma: HTTP ${res.status}`);
  }
  return await res.json();
}

async function main() {
  let token = (process.env[KEY] ?? "").trim();
  if (!token) token = (await promptSecret("Cole seu FIGMA_TOKEN (Personal Access Token): ")).trim();

  if (!token) throw new Error("FIGMA_TOKEN vazio.");
  if (/\s/.test(token)) throw new Error("FIGMA_TOKEN contém espaços/quebras de linha. Cole apenas o token.");

  const prev = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  fs.writeFileSync(ENV_PATH, upsertEnvVar(prev, KEY, token), { encoding: "utf8" });

  await pingFigma(token);

  console.log(`OK: token configurado e validado. Arquivo atualizado: ${ENV_FILENAME}`);
}

main().catch((err) => {
  console.error(`Falha ao configurar o token do Figma: ${err?.message ?? String(err)}`);
  process.exitCode = 1;
});
