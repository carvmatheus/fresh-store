# 📄 GitHub Pages - Limitações e Alternativas

## ⚠️ Importante: GitHub Pages NÃO suporta backend!

O GitHub Pages é um serviço de hospedagem **apenas para sites estáticos** (HTML, CSS, JavaScript). Ele **NÃO pode**:

- ❌ Rodar Python/FastAPI
- ❌ Rodar banco de dados MongoDB
- ❌ Executar código server-side
- ❌ Processar APIs REST

## 🤔 Então, qual a solução?

### Opção 1: 🎯 Recomendada - Deploy Separado

**Frontend (GitHub Pages)** + **Backend (outro serviço)**

```
GitHub Pages (Gratuito)          Heroku/Railway/Render (Gratuito/Pago)
┌─────────────────┐              ┌─────────────────────────┐
│   Frontend      │ ────HTTP───► │  Backend (API)          │
│   HTML/CSS/JS   │              │  Python/FastAPI         │
└─────────────────┘              │  + MongoDB Atlas        │
                                 └─────────────────────────┘
```

#### Frontend no GitHub Pages:
1. Deploy o conteúdo de `/docs` no GitHub Pages
2. Configurar `config.js` para apontar para o backend remoto

```javascript
// docs/config.js
const API_CONFIG = {
    BASE_URL: 'https://seu-backend.herokuapp.com/api',  // URL do backend
    TIMEOUT: 30000
};
```

#### Backend em outro serviço:
- **Heroku** (Gratuito com limitações)
- **Railway** (Gratuito $5/mês de crédito)
- **Render** (Gratuito com sleep)
- **Fly.io** (Gratuito com limites)
- **VPS** (DigitalOcean, Linode, AWS)

### Opção 2: 🐳 Docker em Servidor VPS (Recomendado para Produção)

**Tudo em um servidor:**

- **DigitalOcean**: $5/mês (1GB RAM)
- **Linode**: $5/mês
- **AWS Lightsail**: $3.50/mês

```bash
# Deploy completo com Docker
ssh user@seu-servidor.com
git clone seu-repositorio
cd fresh-store
./docker-start.sh
```

**Vantagens:**
- ✅ Controle total
- ✅ Melhor performance
- ✅ Sem limitações
- ✅ Banco de dados local

### Opção 3: 🚀 Plataformas All-in-One

#### Railway.app (Recomendado!)
```bash
# Instalar CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway up
```

**Vantagens:**
- ✅ Deploy automático do GitHub
- ✅ $5 de crédito grátis/mês
- ✅ Suporta Docker Compose
- ✅ MongoDB incluído
- ✅ SSL automático
- ✅ Domínio grátis

#### Render.com
```yaml
# render.yaml
services:
  - type: web
    name: dahorta-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/main.py
  
  - type: web
    name: dahorta-frontend
    env: static
    staticPublishPath: ./docs
```

#### Fly.io
```bash
# Instalar CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

---

## 📋 Guia Completo: Frontend no GitHub Pages + Backend no Railway

### 1. Deploy Backend no Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up

# Obter URL
railway domain
# Exemplo: https://seu-projeto.railway.app
```

### 2. Configurar Frontend

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://seu-projeto.railway.app/api',  // URL do Railway
    TIMEOUT: 30000
};
```

### 3. Deploy Frontend no GitHub Pages

```bash
# Criar branch gh-pages
git checkout -b gh-pages

# Copiar docs para raiz (opcional)
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Ou usar GitHub Actions
```

Ativar GitHub Pages:
1. Ir em Settings → Pages
2. Source: Branch `gh-pages` ou `main` → `/docs`
3. Save

**URL:** `https://seu-usuario.github.io/fresh-store`

---

## 🎯 Comparação de Serviços

| Serviço | Gratuito? | Backend | MongoDB | SSL | Domínio |
|---------|-----------|---------|---------|-----|---------|
| **GitHub Pages** | ✅ Sim | ❌ Não | ❌ Não | ✅ Sim | ✅ Sim |
| **Railway** | ⚠️ $5/mês | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Render** | ⚠️ Com sleep | ✅ Sim | ⚠️ Pago | ✅ Sim | ✅ Sim |
| **Heroku** | ⚠️ Limitado | ✅ Sim | ⚠️ Pago | ✅ Sim | ✅ Sim |
| **Fly.io** | ⚠️ Limitado | ✅ Sim | ⚠️ Pago | ✅ Sim | ✅ Sim |
| **VPS (DO)** | ❌ $5/mês | ✅ Sim | ✅ Sim | ⚠️ Manual | ⚠️ Pago |

---

## 💰 Custos Estimados

### Opção 1: GitHub Pages + Railway
- **Frontend**: Grátis (GitHub Pages)
- **Backend**: $5/mês (Railway com MongoDB)
- **Total**: ~$5/mês

### Opção 2: VPS (DigitalOcean)
- **Tudo incluído**: $5-10/mês
- **Controle total**

### Opção 3: GitHub Pages + MongoDB Atlas + Render
- **Frontend**: Grátis
- **Backend**: Grátis (com sleep)
- **MongoDB**: Grátis (512MB)
- **Total**: Grátis (com limitações)

---

## 🚀 Recomendação Final

### Para Desenvolvimento/Testes:
```bash
./docker-start.sh  # Rodar localmente
```

### Para Produção Pequena (< 1000 usuários):
**Railway** (Backend + Frontend + MongoDB)
- Fácil de usar
- $5/mês
- Deploy automático
- Escalável

### Para Produção Média (1000-10000 usuários):
**VPS com Docker**
- DigitalOcean $10-20/mês
- Controle total
- Melhor performance

### Para Produção Grande:
**AWS/Google Cloud/Azure**
- Kubernetes
- Auto-scaling
- CDN
- Load balancing

---

## 📝 Resumo

✅ **Sim, pode usar GitHub Pages** → Mas APENAS para o frontend  
✅ **Backend precisa** → Railway, Render, VPS, etc  
✅ **Solução mais fácil** → Railway (backend + frontend)  
✅ **Solução mais barata** → GitHub Pages + Render Free + MongoDB Atlas  
✅ **Solução mais profissional** → VPS com Docker ($5/mês)  

---

## 🎓 Tutorial Completo

### Deploy Completo em Railway (Recomendado!)

#### 1. Criar conta no Railway
https://railway.app

#### 2. Instalar CLI
```bash
npm i -g @railway/cli
```

#### 3. Login
```bash
railway login
```

#### 4. Criar projeto
```bash
cd fresh-store
railway init
```

#### 5. Adicionar MongoDB
No dashboard Railway:
- New → Database → Add MongoDB

#### 6. Deploy
```bash
railway up
```

#### 7. Configurar domínio
```bash
railway domain
```

#### 8. Obter URL da API
```
https://seu-projeto.railway.app
```

#### 9. Atualizar frontend
Editar `docs/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'https://seu-projeto.railway.app/api',
    TIMEOUT: 30000
};
```

#### 10. Commit e push
```bash
git add .
git commit -m "Update API URL"
git push
```

**Pronto!** 🎉

---

**🌍 Sistema online e acessível de qualquer lugar!**

**Dúvidas?** Consulte a documentação oficial dos serviços!
