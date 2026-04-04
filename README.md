# 💧 Hidratação Ativa — Método RCF

PWA de acompanhamento de hidratação para alunas da consultoria **Reconstrução do Corpo Feminino**.

## Como funciona

Cada aluna acessa o link, configura **seu próprio nome e peso** uma única vez, e usa o app individualmente no celular dela. Os dados ficam salvos localmente — cada pessoa vê apenas os seus.

## Funcionalidades

- **Onboarding pessoal** — configura nome e peso na primeira abertura
- **Meta automática** — 35ml × peso (referência SBME)
- **3 turnos diários** — Manhã (40%) / Tarde (40%) / Noite (20%)
- **Doses rápidas** — 150, 200, 250, 300, 500, 750ml + personalizado
- **Histórico pessoal** com stats: dias registrados, metas atingidas, média geral
- **Streak de dias** — contagem de dias consecutivos com meta atingida
- **Perfil editável** — atualiza nome/peso a qualquer momento
- **Funciona offline** (Service Worker + cache)
- **Instalável** como app no celular (iOS e Android)

## Deploy no GitHub Pages

```bash
# 1. Inicialize o repositório
git init
git add .
git commit -m "feat: RCF Hidratação PWA"

# 2. Suba para o GitHub
git remote add origin https://github.com/SEU_USUARIO/rcf-hidratacao.git
git branch -M main
git push -u origin main
```

Depois: **Settings → Pages → Source: main / root → Save**

URL final: `https://SEU_USUARIO.github.io/rcf-hidratacao/`

> Se o repositório não estiver na raiz do domínio, ajuste `start_url` e `scope` no `manifest.json` para `/rcf-hidratacao/` e os caminhos no `sw.js`.

## Como as alunas instalam

**iPhone (Safari):** Compartilhar → Adicionar à Tela de Início

**Android (Chrome):** Menu (3 pontos) → Instalar app

## Estrutura

```
rcf-hidratacao/
├── index.html      — App completo
├── style.css       — Identidade visual RCF
├── app.js          — Lógica do app
├── manifest.json   — Configuração PWA
├── sw.js           — Service Worker (offline)
├── icons/          — Ícones em 8 tamanhos
└── README.md
```

---
**Método RCF — Reconstrução do Corpo Feminino**
