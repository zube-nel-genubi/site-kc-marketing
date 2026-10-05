import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import presets from "./presets.json";
import fonts from "./fonts.json";

const path = process.env.SITE_CONFIG ? resolve(process.env.SITE_CONFIG) : resolve(process.cwd(), "site.config.json");
const raw: any = JSON.parse(readFileSync(path, "utf8"));

const preset: any = (presets as any)[raw.direction] || (presets as any)["corporativo"];
const theme: any = Object.assign({}, preset, raw.theme || {});
theme.fonts = Object.assign({}, preset.fonts, (raw.theme && raw.theme.fonts) || {});
const fh: any = (fonts as any)[theme.fonts.heading] || (fonts as any)["inter"];
const fb: any = (fonts as any)[theme.fonts.body] || (fonts as any)["inter"];
theme.fontHeading = `"${fh.family}", ${fh.serif ? "Georgia, 'Times New Roman', serif" : "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"}`;
theme.fontBody = `"${fb.family}", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
theme.headingSerif = !!fh.serif;

const DEFAULT_TONES: Record<string, string> = {
  header: "base", hero: "base", marquee: "brand", about: "alt", services: "base", method: "alt",
  featuredService: "brand", differentials: "base", clients: "base", testimonials: "alt", faq: "base", contact: "alt", footer: "base"
};
theme.tones = Object.assign({}, DEFAULT_TONES, theme.tones || {});

export const site: any = raw;
export const t: any = theme;

export function on(section: string): boolean {
  const s = raw[section];
  if (!s) return false;
  if (s.enabled === false) return false;
  return true;
}

/** Divide um título em partes, marcando o trecho de destaque. */
export function splitHighlight(title: string, highlight?: string): { text: string; hl: boolean }[] {
  if (!title) return [];
  if (!highlight || title.indexOf(highlight) === -1) return [{ text: title, hl: false }];
  const i = title.indexOf(highlight);
  return [
    { text: title.slice(0, i), hl: false },
    { text: highlight, hl: true },
    { text: title.slice(i + highlight.length), hl: false }
  ].filter((p) => p.text.length > 0);
}

export function waLink(number: string, message?: string): string {
  const digits = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function img(url: string, w = 1600): string {
  if (!url) return "";
  if (/images\.unsplash\.com/.test(url) && url.indexOf("?") === -1)
    return `${url}?auto=format&fit=crop&w=${w}&q=80`;
  return url;
}

export const NAV_DEFAULT = [
  { id: "sobre", section: "about", label: "Sobre" },
  { id: "servicos", section: "services", label: "Serviços" },
  { id: "servico-destaque", section: "featuredService", label: "Destaque" },
  { id: "metodo", section: "method", label: "Método" },
  { id: "diferenciais", section: "differentials", label: "Diferenciais" },
  { id: "depoimentos", section: "testimonials", label: "Depoimentos" },
  { id: "faq", section: "faq", label: "FAQ" },
  { id: "contato", section: "contact", label: "Contato" }
];

export const nav: { label: string; href: string }[] = raw.nav && raw.nav.length
  ? raw.nav
  : NAV_DEFAULT.filter((n) => on(n.section)).map((n) => ({ label: (raw[n.section] && raw[n.section].navLabel) || n.label, href: `#${n.id}` }));
