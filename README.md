# Site institucional (Astro + GSAP)

Todo o conteúdo e o visual ficam em **`site.config.json`** — textos, serviços, contatos, paleta e fontes.

## Rodar localmente
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
```

## Editar
- Textos, serviços, FAQ, depoimentos: `site.config.json`
- Cores: `theme.palette` · Direção visual/fontes: `direction` e `theme.fonts`
- Logo: coloque o arquivo em `public/` e informe em `brand.logo` (ex.: `/logo.svg`)
- Desligar uma seção: `"enabled": false` (about, clients, testimonials, faq…)

## Formulário
`contact.form.provider`:
- `webhook` → POST JSON para `endpoint` (ex.: webhook do n8n)
- `formspree` → `endpoint` = URL do formulário Formspree
- `web3forms` → `accessKey` = chave do Web3Forms
- `mailto` → abre o e-mail do visitante (sem serviço externo)

## Deploy no EasyPanel (Hostinger)
1. Suba este projeto para um repositório no GitHub.
2. EasyPanel → Projeto → **+ Service → App** → Source **Git** (URL do repositório, branch `main`).
3. Build: **Dockerfile** (caminho `Dockerfile`).
4. Domains: adicione o domínio, porta **80**, HTTPS ligado.
5. Deploy. Cada push na `main` pode redeployar automaticamente (ative o Auto Deploy / webhook).
