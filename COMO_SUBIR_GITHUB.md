# 📤 Como Subir para o GitHub

Guia completo para publicar seu código no GitHub.

## 🎯 Passo a Passo

### 1. Verificar se Git está configurado

```bash
# Ver configuração atual
git config --global user.name
git config --global user.email

# Se não estiver configurado, configure:
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 2. Inicializar repositório Git (se ainda não estiver)

```bash
cd /Users/carvmatheus/Documents/Repositories/fresh-store

# Verificar se já é um repositório
git status

# Se não for, inicializar
git init
```

### 3. Adicionar arquivos

```bash
# Adicionar todos os arquivos
git add .

# Ver o que será commitado
git status
```

### 4. Fazer primeiro commit

```bash
git commit -m "Initial commit - Sistema completo com Docker"
```

### 5. Criar repositório no GitHub

1. Ir para https://github.com/new
2. Nome do repositório: `fresh-store` (ou outro nome)
3. Descrição: "Marketplace B2B - Sistema completo com Python/FastAPI + MongoDB + Docker"
4. **NÃO** marcar "Initialize with README" (já temos)
5. Clicar em "Create repository"

### 6. Conectar com GitHub

```bash
# Copiar a URL do seu repositório (exemplo)
# https://github.com/carvmatheus/fresh-store.git

# Adicionar remote
git remote add origin https://github.com/carvmatheus/fresh-store.git

# Verificar
git remote -v
```

### 7. Push para GitHub

```bash
# Renomear branch para main (se necessário)
git branch -M main

# Push
git push -u origin main
```

**Pronto!** 🎉 Código no GitHub!

---

## 📄 Sobre GitHub Pages

### ⚠️ IMPORTANTE: Limitações

**GitHub Pages serve APENAS arquivos estáticos:**
- ✅ HTML, CSS, JavaScript
- ❌ Python, FastAPI (backend)
- ❌ MongoDB (banco de dados)
- ❌ APIs server-side

### 🤔 O que você PODE fazer?

#### Opção 1: Frontend no GitHub Pages + Backend em outro lugar

```
┌─────────────────────────────────────────────┐
│  GitHub Pages (GRÁTIS)                      │
│  https://carvmatheus.github.io/fresh-store  │
│                                             │
│  Frontend: HTML/CSS/JS                      │
└──────────────┬──────────────────────────────┘
               │
               │ HTTP Requests
               ▼
┌─────────────────────────────────────────────┐
│  Backend em outro serviço:                  │
│  - Railway ($5/mês)                         │
│  - Render (grátis com sleep)                │
│  - VPS ($5/mês)                             │
│                                             │
│  Backend: Python/FastAPI + MongoDB          │
└─────────────────────────────────────────────┘
```

---

## 🚀 Como Configurar GitHub Pages

### Passo a Passo

#### 1. Preparar Frontend para Produção

Editar `docs/config.js` para apontar para o backend em produção:

```javascript
const API_CONFIG = {
    // Trocar localhost pela URL do seu backend em produção
    BASE_URL: 'https://seu-backend.railway.app/api',
    TIMEOUT: 30000
};
```

Commit:
```bash
git add docs/config.js
git commit -m "Configure API URL for production"
git push
```

#### 2. Ativar GitHub Pages

No GitHub:
1. Ir no repositório
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` → `/docs` 
5. **Save**

Aguardar 1-2 minutos para deploy.

#### 3. Acessar

**URL do Frontend:**
```
https://carvmatheus.github.io/fresh-store
```

---

## 🎯 Opções Completas de Deploy

### Opção 1: 📄 Frontend (GitHub Pages) + Backend (Railway)

**Custos:**
- Frontend: **Grátis** (GitHub Pages)
- Backend: **$5/mês** (Railway com MongoDB)

**Passos:**

1. **Deploy Backend no Railway:**
```bash
npm i -g @railway/cli
railway login
railway up
```

2. **Obter URL do Backend:**
```bash
railway domain
# Exemplo: https://fresh-store-backend.railway.app
```

3. **Atualizar Frontend:**
Editar `docs/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'https://fresh-store-backend.railway.app/api',
    TIMEOUT: 30000
};
```

4. **Commit e Push:**
```bash
git add docs/config.js
git commit -m "Update API URL"
git push
```

5. **Ativar GitHub Pages:**
Settings → Pages → main → /docs

**URLs:**
- Frontend: `https://carvmatheus.github.io/fresh-store`
- Backend: `https://fresh-store-backend.railway.app`
- API Docs: `https://fresh-store-backend.railway.app/docs`

---

### Opção 2: 🚀 Tudo no Railway (Recomendado!)

**Custos:** $5/mês (tudo incluído)

```bash
railway login
railway up
railway domain
```

**Vantagens:**
- ✅ Deploy automático
- ✅ MongoDB incluído
- ✅ SSL automático
- ✅ Domínio grátis
- ✅ Mais fácil

**URL única:**
```
https://seu-projeto.railway.app
```

---

### Opção 3: 🐳 VPS com Docker (Mais Controle)

**Custos:** $5/mês (DigitalOcean, Linode, etc)

```bash
# No servidor
ssh user@seu-ip
curl -fsSL https://get.docker.com | sh
git clone https://github.com/carvmatheus/fresh-store.git
cd fresh-store
./docker-start.sh
```

**Vantagens:**
- ✅ Controle total
- ✅ Melhor performance
- ✅ Pode usar seu domínio

**URLs:**
```
http://seu-ip
http://seudominio.com (se configurar)
```

---

## 📊 Comparação

| Opção | Frontend | Backend | Custo | Dificuldade |
|-------|----------|---------|-------|-------------|
| **GitHub Pages + Railway** | GitHub Pages | Railway | $5/mês | ⭐⭐ |
| **Tudo Railway** | Railway | Railway | $5/mês | ⭐ |
| **VPS + Docker** | VPS | VPS | $5/mês | ⭐⭐⭐ |

---

## 🎯 Minha Recomendação

### Para você (baseado no seu caso):

**Opção A: Tudo no Railway** (Mais fácil)
```bash
railway login
railway up
```

✅ 1 comando  
✅ 1 URL  
✅ Tudo funcionando  

**Opção B: GitHub Pages (frontend) + Railway (backend)**
- Frontend grátis no GitHub Pages
- Backend pago no Railway
- 2 URLs diferentes

**Opção C: VPS com Docker** (Mais profissional)
- Tudo em um servidor
- Domínio próprio
- Controle total

---

## ❓ FAQ

### P: Posso usar APENAS GitHub Pages?
**R:** Não. GitHub Pages só serve arquivos estáticos (HTML/CSS/JS). Você precisa de um servidor para rodar Python e MongoDB.

### P: GitHub Pages é grátis?
**R:** Sim! Mas só para o frontend.

### P: Preciso pagar para ter o sistema online?
**R:** Sim, você precisa de um servidor para o backend. Opções:
- Railway: $5/mês
- VPS: $5/mês
- Render Free: Grátis (com limitações)

### P: Posso usar meu próprio domínio?
**R:** Sim! Em todas as opções. GitHub Pages aceita domínios customizados gratuitamente.

---

## 🛠 Manutenção

### Atualizar código no GitHub

```bash
# Fazer alterações
git add .
git commit -m "Descrição das alterações"
git push
```

### Atualizar GitHub Pages

GitHub Pages atualiza automaticamente quando você faz push!

### Atualizar Railway

Railway faz deploy automático quando você faz push no GitHub!

---

## 🔒 Segurança

### Antes de subir para produção:

```bash
# 1. Não commitar .env
echo ".env" >> .gitignore

# 2. Usar .env.example
cp .env .env.example
# Editar .env.example e remover valores reais

# 3. Commit
git add .gitignore .env.example
git commit -m "Add env example"
git push
```

---

## ✨ Resumo

1. **Subir código:**
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/carvmatheus/fresh-store.git
git push -u origin main
```

2. **GitHub Pages:**
- ✅ Serve APENAS o frontend (`/docs`)
- ❌ NÃO roda backend Python
- ❌ NÃO roda MongoDB

3. **Solução completa:**
- Frontend no GitHub Pages (grátis)
- Backend no Railway/VPS ($5/mês)

4. **Forma mais fácil:**
- Tudo no Railway ($5/mês)
- 1 comando: `railway up`

---

**🎉 Agora é só escolher sua opção e colocar no ar!**

**Dúvidas?** Me avise que eu te ajudo! 🚀

