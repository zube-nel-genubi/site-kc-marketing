// Interações e animações do site. Escrito para funcionar sem sintaxe moderna
// arriscada (sem ?. / ??) — o build também transpila para ES2015.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const doc = document.documentElement;
const ANIM = doc.classList.contains("anim");
const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) => Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];
const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------------- Rolagem suave (desktop) ---------------- */
// Carregada sob demanda e só em desktop (mouse): celulares antigos nunca baixam
// este pedaço, então sintaxe moderna da biblioteca não quebra o site neles.
let lenis: any = null;
if (ANIM && finePointer) {
  import("lenis").then((mod: any) => {
    try {
      const Lenis = mod.default;
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }).catch(() => { lenis = null; });
}
function scrollToHash(hash: string) {
  const el = hash === "#topo" ? document.body : $(hash);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: hash === "#topo" ? 0 : -76 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- Header, menu e links âncora ---------------- */
const header = $("[data-header]");
let lastY = 0;
function onScroll() {
  const y = window.pageYOffset || doc.scrollTop;
  if (header) {
    header.classList.toggle("is-scrolled", y > 24);
    const menuOpen = doc.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove("is-hidden");
  }
  const bar = $(".progress span");
  if (bar) {
    const max = (document.body.scrollHeight - window.innerHeight) || 1;
    bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
  }
  lastY = y;
}
window.addEventListener("scroll", onScroll, { passive: true } as any);
onScroll();

const burger = $("[data-burger]");
function closeMenu() { doc.classList.remove("menu-open"); if (burger) burger.setAttribute("aria-expanded", "false"); if (lenis) lenis.start(); }
if (burger) burger.addEventListener("click", () => {
  const open = !doc.classList.contains("menu-open");
  doc.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  if (lenis) { open ? lenis.stop() : lenis.start(); }
});

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href") || "";
    if (hash.length < 2) return;
    e.preventDefault();
    closeMenu();
    scrollToHash(hash);
    if (history.replaceState) history.replaceState(null, "", hash);
  });
});

// Link ativo no menu conforme a seção visível
const navLinks = $$("[data-nav]");
navLinks.forEach((link) => {
  const id = link.getAttribute("href") || "";
  const sec = id.length > 1 ? $(id) : null;
  if (!sec) return;
  ScrollTrigger.create({
    trigger: sec, start: "top 45%", end: "bottom 45%",
    onToggle: (self: any) => {
      if (!self.isActive) return;
      navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
    }
  });
});

/* ---------------- Divisão de títulos em palavras ---------------- */
function splitWords(el: HTMLElement) {
  if (el.classList.contains("is-split")) return;
  const walk = (node: Node) => {
    const kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach((k: Node) => {
      if (k.nodeType === 3) {
        const text = k.textContent || "";
        const frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span"); i.className = "wi"; i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        node.replaceChild(frag, k);
      } else if (k.nodeType === 1) walk(k);
    });
  };
  walk(el);
  el.classList.add("is-split");
}

/* ---------------- Contadores ---------------- */
function formatNum(n: number, decimals: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function setupCounter(el: HTMLElement) {
  const raw = String(el.getAttribute("data-count") || "");
  const target = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  if (isNaN(target)) return;
  const decimals = (raw.split(",")[1] || "").length;
  const pre = el.getAttribute("data-prefix") || "";
  const suf = el.getAttribute("data-suffix") || "";
  const obj = { v: 0 };
  el.textContent = pre + formatNum(0, decimals) + suf;
  gsap.to(obj, {
    v: target, duration: 2.2, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
    onUpdate: () => { el.textContent = pre + formatNum(obj.v, decimals) + suf; }
  });
}

/* ---------------- Animações ---------------- */
if (ANIM) {
  const ease = "expo.out";

  // Hero
  const heroTitle = $('[data-split="hero"]');
  const tl = gsap.timeline({ defaults: { ease } });
  if (heroTitle) {
    splitWords(heroTitle);
    tl.from($$(".wi", heroTitle), { yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.06 }, 0.15);
  }
  tl.to($$("[data-hero-in]"), { opacity: 1, duration: 1 }, 0.5)
    .from($$("[data-hero-in]"), { y: 26, duration: 1.2, stagger: 0.1 }, 0.5);
  const hv = $("[data-hero-visual]");
  if (hv) {
    tl.to(hv, { opacity: 1, duration: 1.4 }, 0.3)
      .from(hv, { scale: 0.92, y: 40, duration: 1.8 }, 0.3)
      .from($$(".float-card", hv), { y: 40, opacity: 0, duration: 1.2, stagger: 0.15 }, 0.9)
      .from($$(".hero__rings circle", hv), { scale: 0.6, opacity: 0, transformOrigin: "50% 50%", duration: 1.8, stagger: 0.08 }, 0.4);
    gsap.to($$(".hero__rings", hv), { rotate: 360, duration: 90, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
  }

  // Títulos de seção
  $$("[data-split]").forEach((el) => {
    if (el.getAttribute("data-split") === "hero") return;
    splitWords(el);
    gsap.from($$(".wi", el), {
      yPercent: 110, duration: 1.1, ease, stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 86%", once: true }
    });
  });

  // Revelações (fade + subida), em grupo com stagger
  const done = new Set<HTMLElement>();
  $$("[data-reveal-group]").forEach((group) => {
    const items = $$("[data-reveal]", group).filter((i) => !done.has(i));
    items.forEach((i) => done.add(i));
    if (!items.length) return;
    gsap.fromTo(items, { opacity: 0, y: 36 }, {
      opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 85%", once: true }
    });
  });
  $$("[data-reveal]").filter((i) => !done.has(i)).forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1.1, ease, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // Imagens com revelação por máscara
  $$("[data-clip-reveal]").forEach((el) => {
    const r = getComputedStyle(doc).getPropertyValue("--radius-lg") || "0px";
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0 round " + r + ")", webkitClipPath: "inset(0 0 0% 0 round " + r + ")",
      duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 80%", once: true }
    } as any);
    const im = $("img", el);
    if (im) gsap.fromTo(im, { scale: 1.25 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
  });

  // Parallax suave
  $$("[data-parallax]").forEach((el) => {
    const f = parseFloat(el.getAttribute("data-parallax") || "0.2");
    gsap.to(el, { yPercent: f * 100, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // Cartões flutuantes
  $$("[data-float]").forEach((el, i) => {
    gsap.to(el, { y: i % 2 ? 12 : -12, duration: 3.2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
  });

  // Demonstração animada de conversa e CRM
  const featureDemo = $<HTMLElement>("[data-feature-demo]");
  if (featureDemo) {
    const messages = $$<HTMLElement>("[data-feature-message]", featureDemo);
    const typing = $<HTMLElement>("[data-feature-typing]", featureDemo);
    const confirmation = $<HTMLElement>("[data-feature-confirmation]", featureDemo);
    const sequence = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.2,
      scrollTrigger: { trigger: featureDemo, start: "top 78%", toggleActions: "play pause resume pause" }
    });

    sequence.set([...messages, typing, confirmation].filter(Boolean), { autoAlpha: 0, y: 12 });
    messages.forEach((message, i) => {
      if (i === 1 && typing) {
        sequence.to(typing, { autoAlpha: 1, y: 0, duration: 0.25 }, ">+=0.25")
          .to(typing, { autoAlpha: 0, y: -4, duration: 0.2 }, "+=0.7");
      }
      sequence.to(message, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, ">+=0.2");
    });
    if (typing && confirmation) {
      sequence.to(typing, { autoAlpha: 1, y: 0, duration: 0.25 }, ">+=0.35")
        .to(typing, { autoAlpha: 0, y: -4, duration: 0.2 }, "+=0.75")
        .to(confirmation, { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }, ">+=0.15");
    }
    sequence.to([...messages, typing, confirmation].filter(Boolean), { autoAlpha: 0, y: -8, duration: 0.3 }, "+=2.4");

    $$<HTMLElement>("[data-demo-count]", featureDemo).forEach((element) => {
      const target = Number(element.dataset.demoCount);
      const precision = String(target).split(".")[1]?.length || 0;
      const suffix = element.dataset.suffix || "";
      const counter = { value: 0 };
      element.textContent = `${counter.value}${suffix}`;
      gsap.to(counter, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: featureDemo, start: "top 78%", once: true },
        onUpdate: () => { element.textContent = `${counter.value.toFixed(precision).replace(".", ",")}${suffix}`; }
      });
    });

    const chart = $<SVGPathElement>("[data-demo-chart]", featureDemo);
    if (chart) {
      const length = chart.getTotalLength();
      gsap.set(chart, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(chart, { strokeDashoffset: 0, duration: 2, ease: "power2.out", scrollTrigger: { trigger: featureDemo, start: "top 78%", once: true } });
    }
  }

  // Linha do tempo do método
  const fill = $("[data-timeline-fill]");
  const tlEl = $("[data-timeline]");
  if (fill && tlEl) {
    gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tlEl, start: "top 60%", end: "bottom 60%", scrub: 0.6 } });
    $$("[data-step]", tlEl).forEach((st) => {
      ScrollTrigger.create({ trigger: st, start: "top 62%", onEnter: () => st.classList.add("is-active"), onLeaveBack: () => st.classList.remove("is-active") });
      gsap.from(st, { opacity: 0, x: 40, duration: 1, ease, scrollTrigger: { trigger: st, start: "top 85%", once: true } });
    });
  }

  // Contadores
  $$("[data-count]").forEach(setupCounter);

  // Botões magnéticos + tilt do hero (apenas mouse)
  if (finePointer) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("mousemove", (e: MouseEvent) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.5, ease: "power3.out" });
      });
      b.addEventListener("mouseleave", () => gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }));
    });
    const tilt = $("[data-tilt]");
    const vis = $("[data-hero-visual]");
    if (tilt && vis) {
      vis.addEventListener("mousemove", (e: MouseEvent) => {
        const r = vis.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(tilt, { rotateY: px * 8, rotateX: -py * 8, duration: 0.8, ease: "power3.out", transformPerspective: 1000 });
        tilt.style.setProperty("--sx", (px + 0.5) * 100 + "%");
        tilt.style.setProperty("--sy", (py + 0.5) * 100 + "%");
      });
      vis.addEventListener("mouseleave", () => gsap.to(tilt, { rotateX: 0, rotateY: 0, duration: 1.2, ease: "power3.out" }));
    }
  }
  (window as any).__animReady = true;
}

/* ---------------- Spotlight nos cartões ---------------- */
$$("[data-spotlight]").forEach((card) => {
  card.addEventListener("mousemove", (e: MouseEvent) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

/* ---------------- Chips do hero em ciclo ---------------- */
const chipList = $("[data-chip-cycle]");
if (chipList) {
  const chips = $$("li", chipList);
  let ci = 0;
  if (chips.length > 1 && ANIM) setInterval(() => {
    chips[ci].classList.remove("is-on");
    ci = (ci + 1) % chips.length;
    chips[ci].classList.add("is-on");
  }, 2200);
}

/* ---------------- FAQ (acordeão com animação) ---------------- */
$$("[data-acc]").forEach((d) => {
  const det = d as HTMLDetailsElement;
  const sum = $("summary", det);
  const body = $(".acc__body", det);
  if (!sum || !body) return;
  sum.addEventListener("click", (e) => {
    if (!ANIM) return;
    e.preventDefault();
    if (det.open) {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { det.open = false; gsap.set(body, { clearProps: "all" }); } });
    } else {
      // fecha os outros
      $$("[data-acc]").forEach((o) => {
        const od = o as HTMLDetailsElement;
        if (od !== det && od.open) {
          const ob = $(".acc__body", od);
          if (ob) gsap.to(ob, { height: 0, opacity: 0, duration: 0.4, ease: "power3.inOut", onComplete: () => { od.open = false; gsap.set(ob, { clearProps: "all" }); } });
        }
      });
      det.open = true;
      gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.55, ease: "power3.out", onComplete: () => { gsap.set(body, { clearProps: "height" }); ScrollTrigger.refresh(); } });
    }
  });
});

/* ---------------- Carrossel de depoimentos ---------------- */
const car = $("[data-carousel]");
if (car) {
  const track = $("[data-car-track]", car) as HTMLElement;
  const slides = $$(".quote", track);
  const dotsWrap = $("[data-car-dots]");
  let idx = 0;
  const perView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 960 ? 2 : 3);
  const maxIdx = () => Math.max(0, slides.length - perView());
  const renderDots = () => {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIdx(); i++) {
      const b = document.createElement("button");
      b.type = "button"; if (i === idx) b.className = "is-on";
      b.addEventListener("click", () => go(i));
      dotsWrap.appendChild(b);
    }
  };
  const go = (i: number) => {
    idx = Math.max(0, Math.min(i, maxIdx()));
    track.style.transform = "translateX(" + (-idx * (100 / perView())) + "%)";
    renderDots();
  };
  const prev = $("[data-car-prev]"), next = $("[data-car-next]");
  if (prev) prev.addEventListener("click", () => go(idx <= 0 ? maxIdx() : idx - 1));
  if (next) next.addEventListener("click", () => go(idx >= maxIdx() ? 0 : idx + 1));
  let timer = setInterval(() => go(idx >= maxIdx() ? 0 : idx + 1), 6500);
  car.addEventListener("mouseenter", () => clearInterval(timer));
  car.addEventListener("mouseleave", () => { timer = setInterval(() => go(idx >= maxIdx() ? 0 : idx + 1), 6500); });
  // swipe
  let sx = 0;
  track.addEventListener("touchstart", (e: TouchEvent) => { sx = e.touches[0].clientX; }, { passive: true } as any);
  track.addEventListener("touchend", (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
  });
  window.addEventListener("resize", () => go(idx));
  go(0);
}

/* ---------------- Formulário de contato ---------------- */
const form = $("[data-form]") as HTMLFormElement | null;
if (form) {
  const status = $("[data-status]", form);
  const btn = $("[data-submit]", form);
  const success = $("[data-success]");
  const phone = $("[data-phone]", form) as HTMLInputElement | null;
  const sel = $("select", form) as HTMLSelectElement | null;
  if (sel) sel.addEventListener("change", () => sel.classList.toggle("has-value", !!sel.value));
  if (phone) phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "").slice(0, 13);
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    d = d.slice(0, 11);
    let out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(d.length - 4);
    phone.value = out;
  });

  const validate = () => {
    let ok = true;
    $$("[required]", form).forEach((el) => {
      const input = el as HTMLInputElement;
      let valid = input.type === "checkbox" ? input.checked : !!String(input.value).trim();
      if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      if (valid && input.hasAttribute("data-phone")) valid = input.value.replace(/\D/g, "").length >= 10;
      const wrap = (input.closest(".field") || input.closest(".consent")) as HTMLElement | null;
      if (wrap) wrap.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  };
  form.addEventListener("input", (e) => {
    const t = e.target as HTMLElement;
    const w = (t.closest(".field") || t.closest(".consent")) as HTMLElement | null;
    if (w) w.classList.remove("is-invalid");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (status) status.textContent = "";
    if (!validate()) { if (status) status.textContent = "Confira os campos destacados."; return; }
    const fd = new FormData(form);
    if (fd.get("_gotcha")) return; // robô
    const data: Record<string, any> = {};
    fd.forEach((v, k) => { if (k !== "_gotcha") data[k] = v; });
    data.origem = location.href;
    data.enviado_em = new Date().toISOString();

    const provider = form.getAttribute("data-provider") || "mailto";
    const endpoint = form.getAttribute("data-endpoint") || "";
    const key = form.getAttribute("data-key") || "";
    const brand = form.getAttribute("data-brand") || "";
    const mail = form.getAttribute("data-email") || "";
    const cc = form.getAttribute("data-cc") || "";

    const done = (title?: string, text?: string) => {
      if (btn) btn.classList.remove("is-loading");
      form.style.display = "none";
      if (success) {
        const h = $("h3", success), p = $("p", success);
        if (title && h) h.textContent = title;
        if (text && p) p.textContent = text;
        success.hidden = false;
        if (ANIM) gsap.from(success.children, { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" });
      }
    };
    const mailto = () => {
      const body = Object.keys(data).map((k) => k + ": " + data[k]).join("\n");
      location.href = "mailto:" + mail + "?subject=" + encodeURIComponent("Contato pelo site — " + brand) + "&body=" + encodeURIComponent(body);
      // Neste modo nada é enviado pelo site: o e-mail do visitante abre com a mensagem pronta.
      done("Quase lá!", "Abrimos o seu aplicativo de e-mail com a mensagem pronta — é só clicar em enviar. Se preferir, fale com a gente pelo WhatsApp.");
    };
    if (provider === "mailto" || (!endpoint && !key)) { mailto(); return; }

    let url = endpoint, init: RequestInit;
    if (provider === "web3forms") {
      url = "https://api.web3forms.com/submit";
      init = { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({ access_key: key, subject: "Novo contato pelo site — " + brand, from_name: brand }, data)) };
    } else if (provider === "formsubmit") {
      // FormSubmit (grátis, sem cadastro). endpoint = e-mail principal (ou o código que o FormSubmit envia).
      url = "https://formsubmit.co/ajax/" + endpoint;
      const extra: Record<string, any> = { _subject: "Novo contato pelo site — " + brand, _template: "table", _captcha: "false" };
      if (cc) extra._cc = cc;
      if (data.email) extra._replyto = data.email;
      init = { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign(extra, data)) };
    } else if (provider === "formspree") {
      init = { method: "POST", headers: { Accept: "application/json" }, body: fd };
    } else {
      init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }
    if (btn) btn.classList.add("is-loading");
    fetch(url, init).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.text().then((t) => {
        let j: any = null;
        try { j = JSON.parse(t); } catch (e) { j = null; }
        if (j && (j.success === false || j.success === "false")) throw new Error(j.message || "falha");
        done();
      });
    }).catch(() => {
      if (btn) btn.classList.remove("is-loading");
      if (status) status.innerHTML = 'Não foi possível enviar agora. Tente de novo ou <a href="mailto:' + mail + '" style="text-decoration:underline">envie um e-mail</a>.';
    });
  });
}

/* ---------------- Balão do WhatsApp ---------------- */
const wa = $("[data-wa]");
if (wa) {
  let closed = false;
  try { closed = sessionStorage.getItem("wa-bubble") === "0"; } catch (e) { /* sem storage */ }
  if (!closed) setTimeout(() => wa.classList.add("bubble-on"), 4500);
  const x = $("[data-wa-close]", wa);
  if (x) x.addEventListener("click", () => {
    wa.classList.remove("bubble-on");
    try { sessionStorage.setItem("wa-bubble", "0"); } catch (e) { /* ignora */ }
  });
}

window.addEventListener("load", () => ScrollTrigger.refresh());
