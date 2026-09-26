// Pós-build: reescreve o JS gerado para ES2018 (sem ?. / ?? etc.), garantindo
// que o site funcione em navegadores e WebViews Android mais antigos.
// O Astro fixa o alvo "esnext" no bundle do cliente, por isso este passo existe.
import { transform } from "esbuild";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const out = resolve(process.argv[2] || "dist");
const dir = join(out, "_astro");
if (!existsSync(dir)) process.exit(0);
let n = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".js")) continue;
  const p = join(dir, f);
  try {
    const r = await transform(readFileSync(p, "utf8"), { loader: "js", format: "esm", target: ["es2018", "chrome64", "safari12"], minify: true, logLevel: "silent" });
    writeFileSync(p, r.code);
    n++;
  } catch (e) {
    // Ex.: lenis (rolagem suave) — só é baixado em desktop com mouse, onde o navegador é moderno.
    console.log(`[legacy] mantido como está: ${f}`);
  }
}
console.log(`[legacy] ${n} arquivo(s) JS convertidos para ES2018`);
