# 🔧 Configurar GitHub Pages - EXATAMENTE O QUE FAZER

## ⚠️ CONFIGURAÇÃO CORRETA

### 1. Ir no GitHub

```
https://github.com/carvmatheus/fresh-store
```

### 2. Clicar em "Settings" (Configurações)

No topo da página do repositório, clicar na aba **Settings** (⚙️ engrenagem)

### 3. No menu lateral esquerdo, clicar em "Pages"

Rolar até encontrar **Pages** no menu lateral

### 4. Configurar EXATAMENTE assim:

```
Source
├── Deploy from a branch ✅ (selecionado)
└── Branch
    ├── Branch: main ✅
    ├── Folder: /docs ✅  ⚠️ IMPORTANTE!
    └── [Save] ← CLICAR AQUI
```

**⚠️ IMPORTANTE:** O folder DEVE ser `/docs` e NÃO `/ (root)`!

### 5. Aguardar 2-5 minutos

GitHub Pages vai fazer o build automático.

### 6. Recarregar a página Settings → Pages

Você verá:

```
✅ Your site is live at https://carvmatheus.github.io/fresh-store/
```

---

## 🔍 VERIFICAR SE ESTÁ CORRETO

### Abrir a URL:

```
https://carvmatheus.github.io/fresh-store/
```

### Console (F12) deve mostrar:

```javascript
🔧 Da Horta API Config: {
  environment: "PRODUÇÃO",
  baseUrl: "https://dahorta-backend.onrender.com/api",
  database: "PostgreSQL",
  storage: "Cloudinary",
  version: "2.0"
}
```

---

## 🐛 SE AINDA ESTIVER MOSTRANDO VERSÃO ANTIGA

### Opção 1: Hard Refresh

- **Windows:** `Ctrl + F5` ou `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`
- **Chrome:** DevTools aberto → clicar com botão direito no ícone de reload → "Empty Cache and Hard Reload"

### Opção 2: Forçar Rebuild no GitHub

1. Fazer uma pequena alteração e commitar:

```bash
cd ~/Documents/Repositories/fresh-store

# Criar arquivo .nojekyll (desabilita Jekyll)
touch docs/.nojekyll

# Commitar
git add docs/.nojekyll
git commit -m "Force rebuild: add .nojekyll"
git push origin main

# Aguardar 2-5 minutos
```

### Opção 3: Reconfigurar GitHub Pages

1. Settings → Pages
2. **Source:** Mudar temporariamente para "None"
3. Salvar
4. Aguardar 30 segundos
5. Mudar de volta para:
   - Branch: `main`
   - Folder: `/docs`
6. Salvar
7. Aguardar 2-5 minutos

---

## 📋 CHECKLIST

- [ ] Repositório: `fresh-store` ✅
- [ ] Settings → Pages ✅
- [ ] Source: Deploy from a branch ✅
- [ ] Branch: `main` ✅
- [ ] Folder: `/docs` ⚠️ **CRITICAL!**
- [ ] Salvo ✅
- [ ] Aguardado 2-5 min ✅
- [ ] Hard refresh no navegador ✅
- [ ] Console mostra "PostgreSQL" e "Cloudinary" ✅

---

## 🎯 CONFIGURAÇÃO VISUAL

```
┌─────────────────────────────────────────┐
│ GitHub Pages                            │
├─────────────────────────────────────────┤
│                                         │
│ ○ Source                                │
│   ✓ Deploy from a branch               │
│                                         │
│ ○ Branch                                │
│   [main ▼]  [/docs ▼]  [Save]         │
│    ^^^^       ^^^^^      ^^^^^          │
│    ESTE       ESTE       CLICAR         │
│                                         │
│ Your site is published at               │
│ https://carvmatheus.github.io/          │
│ fresh-store/                            │
└─────────────────────────────────────────┘
```

---

## ❓ AINDA COM PROBLEMAS?

### Verificar qual versão está no ar:

```bash
# Ver no código-fonte da página
curl https://carvmatheus.github.io/fresh-store/config.js

# Deve conter:
# DATABASE: 'PostgreSQL',
# STORAGE: 'Cloudinary',
# VERSION: '2.0'
```

### Verificar último commit no GitHub:

```
https://github.com/carvmatheus/fresh-store/commits/main
```

O último commit deve ser um dos recentes com as mudanças.

### Verificar se /docs tem os arquivos corretos:

```
https://github.com/carvmatheus/fresh-store/tree/main/docs
```

Deve ter: `index.html`, `config.js`, `api-client.js`, etc.

---

## ✅ CONFIRMAÇÃO

Quando funcionar, você verá:

1. **No navegador:**
   - Site carrega
   - Design bonito (banner verde)
   - Produtos (mesmo sem backend rodando)

2. **No console (F12):**
   - `environment: "PRODUÇÃO"`
   - `database: "PostgreSQL"`
   - `storage: "Cloudinary"`

3. **Network (F12 → Network):**
   - Requisições para `dahorta-backend.onrender.com`
   - (podem falhar 404 se backend não estiver no ar ainda)

---

**⚠️ O MAIS IMPORTANTE:** Folder deve ser `/docs` e não `/ (root)`!

**📱 Qualquer dúvida, me mande um print da tela Settings → Pages!**

