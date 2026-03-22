# 💧 Hidratação Ativa — Método RCF

App PWA de acompanhamento ativo de hidratação para clientes da consultoria **Reconstrução do Corpo Feminino**.

---

## ✨ Funcionalidades

- **Meta personalizada** calculada pelo peso (35ml/kg — referência SBME)
- **Divisão em turnos**: Manhã (40%) / Tarde (40%) / Noite (20%)
- **Registro rápido** com doses pré-definidas: 150ml, 200ml, 250ml, 300ml, 500ml, 750ml
- **Dose personalizada** para qualquer quantidade
- **Acompanhamento ativo** com alertas do turno atual
- **Histórico completo** por cliente e por data
- **Multi-cliente**: cadastre todas as suas alunas
- **Funciona offline** — PWA com Service Worker
- **Instalável** no celular como app nativo (iOS e Android)

---

## 🚀 Deploy no GitHub Pages

### 1. Crie o repositório

```bash
git init
git add .
git commit -m "feat: RCF Hidratação PWA"
```

Crie um repositório no GitHub (ex: `rcf-hidratacao`) e suba:

```bash
git remote add origin https://github.com/SEU_USUARIO/rcf-hidratacao.git
git branch -M main
git push -u origin main
```

### 2. Ative o GitHub Pages

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione **Deploy from a branch**
3. Selecione a branch `main` e pasta `/ (root)`
4. Clique em **Save**

Após alguns minutos, o app estará em:
```
https://SEU_USUARIO.github.io/rcf-hidratacao/
```

### 3. Atualize o manifest.json (se necessário)

Se o repo não for a raiz do domínio, ajuste o `start_url` no `manifest.json`:

```json
"start_url": "/rcf-hidratacao/",
"scope": "/rcf-hidratacao/"
```

E no `sw.js`, ajuste os caminhos dos assets:

```js
const ASSETS = [
  '/rcf-hidratacao/',
  '/rcf-hidratacao/index.html',
  ...
];
```

---

## 📱 Instalação do App (para as clientes)

### iPhone (Safari)
1. Abra o link no Safari
2. Toque em **Compartilhar** (ícone de caixa com seta)
3. Role para baixo e toque em **Adicionar à Tela de Início**
4. Confirme o nome e toque em **Adicionar**

### Android (Chrome)
1. Abra o link no Chrome
2. Toque nos **3 pontinhos** no canto superior direito
3. Toque em **Instalar app** ou **Adicionar à tela inicial**
4. Confirme

---

## 📁 Estrutura do Projeto

```
rcf-hidratacao/
├── index.html       # App principal
├── style.css        # Estilos (identidade RCF)
├── app.js           # Lógica do app
├── manifest.json    # Web App Manifest (PWA)
├── sw.js            # Service Worker (offline)
├── icons/           # Ícones do app em todos os tamanhos
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── README.md
```

---

## 🔧 Dados e Privacidade

Todos os dados são salvos **localmente** no dispositivo via `localStorage`. Nenhuma informação é enviada para servidores externos. Cada cliente usa o app no próprio celular e mantém seu histórico privado.

---

## 📐 Referência Científica

Meta de hidratação baseada na recomendação da **SBME** (Sociedade Brasileira de Medicina do Exercício e do Esporte): **35ml por kg de peso corporal** por dia.

---

**Método RCF — Reconstrução do Corpo Feminino**
