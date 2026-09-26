import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync(process.env.SITE_CONFIG || "./site.config.json", "utf8"));

export default defineConfig({
  site: (cfg.seo && cfg.seo.url) || undefined,
  output: "static",
  compressHTML: true,
  build: { inlineStylesheets: "auto" },
  vite: {  // (o alvo do JS do cliente é ajustado no pós-build: scripts/legacy.mjs)
    // Compatibilidade com navegadores/WebViews antigos (ex.: Android 9)
    build: { target: "es2015", cssTarget: "chrome61" },
    esbuild: { target: "es2015" }
  }
});
