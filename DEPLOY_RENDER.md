# 🚀 Deploy no Render.com

Guia completo para deploy no Render.com (Frontend no GitHub Pages + Backend no Render).

## 📋 Configuração

### 1. Criar conta no Render

https://render.com → Sign up with GitHub

---

## 🔙 Backend no Render

### 1. Criar Web Service

No dashboard Render:
1. **New** → **Web Service**
2. **Connect repository:** Selecione `fresh-store`
3. **Configure:**

```
Name: fresh-store-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: python main.py
```

### 2. Variáveis de Ambiente

Adicionar em **Environment**:

```bash
# MongoDB Atlas (criar conta grátis em mongodb.com/cloud/atlas)
MONGODB_URL=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/da_horta_db

# Gerar chave forte
SECRET_KEY=gere-uma-chave-aleatoria-aqui

# Outras configurações
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DB_NAME=da_horta_db
ENVIRONMENT=production

# Render fornece automaticamente a PORT
# NÃO precisa adicionar PORT manualmente!
```

**⚠️ IMPORTANTE:** Gerar SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Criar MongoDB Atlas (Grátis)

1. Ir em https://www.mongodb.com/cloud/atlas
2. **Create Free Cluster**
3. Região: Escolher mais próxima (Oregon se backend no Oregon)
4. **Database Access:**
   - Create user
   - Username: `seu_usuario`
   - Password: `sua_senha_forte`
5. **Network Access:**
   - Add IP: `0.0.0.0/0` (permitir todos)
6. **Connect:**
   - Drivers → Python
   - Copiar connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```

### 4. Deploy

Clicar em **Create Web Service**

Aguardar deploy (5-10 minutos).

### 5. Obter URL

Após deploy, você terá uma URL:
```
https://fresh-store-backend.onrender.com
```

### 6. Testar Backend

Acessar:
```
https://fresh-store-backend.onrender.com/health
https://fresh-store-backend.onrender.com/docs
```

Se retornar JSON/Swagger, está funcionando! ✅

---

## 🎨 Frontend no GitHub Pages

### 1. Configurar API URL

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    // Trocar pela URL do Render
    BASE_URL: 'https://fresh-store-backend.onrender.com/api',
    TIMEOUT: 30000
};
```

### 2. Commit e Push

```bash
git add docs/config.js
git commit -m "Configure API URL for Render backend"
git push origin main
```

### 3. Ativar GitHub Pages

1. Ir em: https://github.com/carvmatheus/fresh-store/settings/pages
2. **Source:** Deploy from a branch
3. **Branch:** `main` → Pasta: `/docs`
4. **Save**

Aguardar 1-2 minutos.

### 4. Acessar

**Frontend:**
```
https://carvmatheus.github.io/fresh-store
```

**Backend:**
```
https://fresh-store-backend.onrender.com
```

---

## ⚡ Inicializar Banco de Dados

Após o primeiro deploy, inicializar o banco:

### Opção 1: Via Render Shell

1. No dashboard Render, abrir o service
2. **Shell** (botão no canto superior direito)
3. Executar:
```bash
python init_db.py
```

### Opção 2: Via API

Criar um endpoint temporário em `backend/main.py`:

```python
@app.get("/init-db")
async def initialize_database():
    """Endpoint temporário para inicializar DB"""
    from init_db import init_database
    await init_database()
    return {"status": "Database initialized"}
```

Acessar uma vez:
```
https://fresh-store-backend.onrender.com/init-db
```

Depois **remover** esse endpoint (por segurança).

---

## 📊 Estrutura Final

```
GitHub Pages (GRÁTIS)               Render.com (GRÁTIS*)
┌──────────────────────────┐       ┌────────────────────────┐
│  Frontend                │ API─► │  Backend (Python)      │
│  https://carvmatheus.    │       │  https://fresh-store-  │
│  github.io/fresh-store   │       │  backend.onrender.com  │
└──────────────────────────┘       └───────┬────────────────┘
                                           │
                                           ▼
                                   ┌────────────────────────┐
                                   │  MongoDB Atlas         │
                                   │  (GRÁTIS - 512MB)      │
                                   └────────────────────────┘
```

**Custo Total:** GRÁTIS! 🎉

---

## ⚠️ Limitações do Plano Free Render

1. **Sleep após 15 min de inatividade**
   - Primeira requisição após sleep: 30-60s
   - Requisições seguintes: normal

2. **750 horas/mês grátis**
   - Suficiente para 1 serviço 24/7

3. **Solução para o sleep:**
   - Usar serviço de "ping" (UptimeRobot, Cron-job.org)
   - Fazer requisição a cada 10 minutos
   - Mantém o serviço ativo

---

## 🔧 Configuração Completa do Render

### Build Command:
```bash
pip install -r requirements.txt
```

### Start Command:
```bash
python main.py
```

### Environment Variables:
```bash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/da_horta_db
SECRET_KEY=sua-chave-super-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DB_NAME=da_horta_db
ENVIRONMENT=production
```

### Health Check Path:
```
/health
```

---

## 🐛 Troubleshooting

### Backend não inicia

1. **Verificar logs no Render:**
   - Dashboard → Logs
   - Ver mensagens de erro

2. **Variáveis de ambiente:**
   - MONGODB_URL correto?
   - SECRET_KEY configurado?

3. **MongoDB Atlas:**
   - IP `0.0.0.0/0` liberado?
   - Usuário/senha corretos?

### Frontend não conecta no backend

1. **CORS:**
   - Backend já tem CORS configurado
   - Permite todas as origens

2. **URL correta:**
   - `docs/config.js` aponta para Render?
   - Incluiu `/api` no final?

3. **Backend está rodando:**
   - Testar: `https://seu-backend.onrender.com/health`

### Sleep/Lentidão

**Usar UptimeRobot** (grátis):
1. Criar conta em https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://fresh-store-backend.onrender.com/health`
   - Interval: 5 minutes
3. Pronto! Backend fica sempre ativo

---

## 💰 Custos

| Serviço | Plano | Custo |
|---------|-------|-------|
| **Render (Backend)** | Free | Grátis* |
| **MongoDB Atlas** | M0 (Free) | Grátis |
| **GitHub Pages** | Free | Grátis |
| **Total** | - | **R$ 0/mês** 🎉 |

**Limitação:** Backend "dorme" após 15min sem uso.

**Upgrade (opcional):**
- Render Pro: $7/mês (sem sleep)
- MongoDB M2: $9/mês (2GB)

---

## 🚀 Deploy Automático

Render faz deploy automático do GitHub!

```bash
# Fazer alterações
git add .
git commit -m "Update"
git push origin main

# Render detecta e faz deploy automático! ✨
```

---

## 📝 Checklist Final

- [ ] Conta criada no Render
- [ ] Conta criada no MongoDB Atlas
- [ ] Cluster MongoDB criado
- [ ] Usuário MongoDB criado
- [ ] IP 0.0.0.0/0 liberado
- [ ] Web Service criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Backend deployed e funcionando
- [ ] `/health` retorna OK
- [ ] `/docs` mostra Swagger
- [ ] Banco inicializado (`init_db.py`)
- [ ] `docs/config.js` atualizado
- [ ] GitHub Pages ativado
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Produtos carregando

---

## ✅ URLs Finais

**Frontend:**
```
https://carvmatheus.github.io/fresh-store
```

**Backend:**
```
https://fresh-store-backend.onrender.com
```

**API Docs:**
```
https://fresh-store-backend.onrender.com/docs
```

**Health Check:**
```
https://fresh-store-backend.onrender.com/health
```

---

## 🎯 Credenciais de Teste

Após inicializar o banco (`init_db.py`):

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

---

**🎉 Sistema completo no ar - 100% GRÁTIS!**

**Dúvidas?** Consulte os logs do Render ou me avise! 🚀

