// Gera arquivos derivados do site.config.json antes de cada build:
//  - src/styles/fonts.gen.css  (importa só as fontes usadas)
// Também valida os campos essenciais e avisa sobre pendências.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfgPath = process.env.SITE_CONFIG ? resolve(process.env.SITE_CONFIG) : resolve(root, "site.config.json");
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
const presets = JSON.parse(readFileSync(resolve(root, "src/lib/presets.json"), "utf8"));

const FONTS = JSON.parse(readFileSync(resolve(root, "src/lib/fonts.json"), "utf8"));

const theme = cfg.theme || {};
const preset = presets[cfg.direction] || presets["corporativo"];
const fonts = Object.assign({}, preset.fonts, theme.fonts || {});

const warn = [];
const lines = ["/* Gerado por scripts/configure.mjs — não editar à mão */"];
const seen = new Set();
for (const role of ["heading", "body"]) {
  const f = FONTS[fonts[role]];
  if (!f) { warn.push(`Fonte desconhecida para ${role}: ${fonts[role]} (use: ${Object.keys(FONTS).join(", ")})`); continue; }
  if (seen.has(f.pkg)) continue;
  seen.add(f.pkg);
  lines.push(`@import "${f.pkg}/index.css";`);
  if (f.italic && role === "heading") lines.push(`@import "${f.pkg}/wght-italic.css";`);
}
mkdirSync(resolve(root, "src/styles"), { recursive: true });
writeFileSync(resolve(root, "src/styles/fonts.gen.css"), lines.join("\n") + "\n");

const pal = (theme.palette || {});
// Validação
const req = [
  ["brand.name", cfg.brand && cfg.brand.name],
  ["theme.palette.primary", pal.primary],
  ["contact.email", cfg.contact && cfg.contact.email],
  ["contact.whatsapp", cfg.contact && cfg.contact.whatsapp],
  ["services.items", cfg.services && cfg.services.items && cfg.services.items.length]
];
for (const [k, v] of req) if (!v) warn.push(`Campo obrigatório vazio: ${k}`);
const form = (cfg.contact && cfg.contact.form) || {};
if (form.provider && form.provider !== "mailto" && !form.endpoint && !form.accessKey)
  warn.push(`Formulário (${form.provider}) sem endpoint/accessKey — o envio vai cair no fallback por e-mail.`);
const json = JSON.stringify(cfg);
if (/\bTODO\b|PLACEHOLDER|lorem ipsum/.test(json)) warn.push("Há textos TODO/PLACEHOLDER no site.config.json.");
if (/de exemplo|\(exemplo\)/i.test(json)) warn.push("Há conteúdo de EXEMPLO (depoimentos, números ou clientes) — substitua por dados reais ou desative a seção antes de publicar.");

if (warn.length) console.warn("\n[configure] Avisos:\n - " + warn.join("\n - ") + "\n");
else console.log("[configure] ok — fontes:", [...seen].join(", "));
