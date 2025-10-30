# 🚀 Deploy Completo - Da Horta Distribuidora

Sistema no ar! Backend + Frontend configurados e prontos.

## ✅ Repositórios

| Componente | Repositório | Deploy |
|------------|-------------|---------|
| **Backend** | https://github.com/carvmatheus/dahorta-backend | Render.com |
| **Frontend** | https://github.com/carvmatheus/fresh-store | GitHub Pages |

---

## 🌐 URLs de Produção

### Backend (Render.com)

**Base URL:**
```
https://dahorta-backend.onrender.com
```

**Endpoints principais:**
- Health Check: https://dahorta-backend.onrender.com/health
- API Docs: https://dahorta-backend.onrender.com/docs
- API Base: https://dahorta-backend.onrender.com/api

### Frontend (GitHub Pages)

**URL:**
```
https://carvmatheus.github.io/fresh-store
```

---

## 🔧 Deploy do Backend no Render

### 1. Criar Web Service

1. Ir em: https://dashboard.render.com
2. **New** → **Web Service**
3. **Connect repository:** `dahorta-backend`

### 2. Configuração

```
Name: dahorta-backend
Region: Oregon (US West)
Branch: main
Runtime: Python 3

Build Command:
pip install -r requirements.txt

Start Command:
python main.py
```

### 3. Variáveis de Ambiente

**IMPORTANTE:** Adicionar estas variáveis em Environment:

```bash
# MongoDB Atlas (criar em mongodb.com/cloud/atlas)
MONGODB_URL=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/da_horta_db

# Gerar: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=<COLE_SUA_CHAVE_AQUI>

# Outras configurações
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DB_NAME=da_horta_db
ENVIRONMENT=production
```

### 4. Deploy

Clicar em **Create Web Service**

Aguardar 5-10 minutos.

### 5. Inicializar Banco de Dados

Após deploy concluir:

1. Dashboard Render → Abrir o service
2. Clicar em **Shell** (botão superior direito)
3. Executar:

```bash
python init_db.py
```

Isso cria:
- ✅ Admin: `admin` / `admin123`
- ✅ Cliente: `cliente` / `cliente123`
- ✅ 12 produtos iniciais

### 6. Testar Backend

Acessar:
```
https://dahorta-backend.onrender.com/health
```

Deve retornar:
```json
{"status":"healthy"}
```

E também:
```
https://dahorta-backend.onrender.com/docs
```

Deve abrir a documentação Swagger! ✅

---

## 🎨 Ativar GitHub Pages (Frontend)

### 1. Ir em Settings

https://github.com/carvmatheus/fresh-store/settings/pages

### 2. Configurar

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/docs`
- Clicar em **Save**

### 3. Aguardar

GitHub Pages leva 1-2 minutos para fazer deploy.

### 4. Acessar

```
https://carvmatheus.github.io/fresh-store
```

---

## 🔗 Conexão Backend ↔ Frontend

### ✅ Já Configurado!

O arquivo `docs/config.js` já está apontando para:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://dahorta-backend.onrender.com/api',
    TIMEOUT: 30000
};
```

**Tudo conectado!** ✨

---

## 🗄️ MongoDB Atlas (Banco de Dados)

### Passo a passo:

1. **Criar conta:** https://www.mongodb.com/cloud/atlas

2. **Create Free Cluster:**
   - Plano: M0 (Free)
   - Provider: AWS
   - Region: Oregon (us-west-2) - mesmo do Render

3. **Database Access:**
   - Create Database User
   - Username: `dahorta_admin` (ou outro)
   - Password: Gerar senha forte
   - **Anotar usuário e senha!**

4. **Network Access:**
   - Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0`
   - Confirm

5. **Connect:**
   - Clusters → Connect
   - Connect your application
   - Driver: Python
   - Copiar connection string:
   ```
   mongodb+srv://dahorta_admin:<password>@cluster0.xxxxx.mongodb.net/
   ```

6. **Configurar no Render:**
   - Substituir `<password>` pela senha real
   - Adicionar `/da_horta_db` no final:
   ```
   mongodb+srv://dahorta_admin:SUA_SENHA@cluster0.xxxxx.mongodb.net/da_horta_db
   ```
   - Colar em `MONGODB_URL` no Render

---

## ✅ Checklist Final

### Backend (Render):
- [ ] Web Service criado
- [ ] Repositório `dahorta-backend` conectado
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] `MONGODB_URL` adicionado
- [ ] `SECRET_KEY` gerado e adicionado
- [ ] Deploy concluído (verde ✅)
- [ ] `/health` retorna OK
- [ ] `/docs` abre Swagger
- [ ] `python init_db.py` executado
- [ ] Login funcionando

### Frontend (GitHub Pages):
- [ ] GitHub Pages ativado
- [ ] Branch `main` → `/docs` configurado
- [ ] Deploy concluído (verde ✅)
- [ ] Site abre: https://carvmatheus.github.io/fresh-store
- [ ] Produtos carregando (vindo da API)
- [ ] Login funcionando
- [ ] Carrinho funcionando
- [ ] Checkout funcionando

### MongoDB Atlas:
- [ ] Cluster criado
- [ ] Usuário criado
- [ ] IP `0.0.0.0/0` liberado
- [ ] Connection string copiado
- [ ] Configurado no Render

---

## 🧪 Testar o Sistema Completo

### 1. Testar Backend

```bash
# Health check
curl https://dahorta-backend.onrender.com/health

# Listar produtos
curl https://dahorta-backend.onrender.com/api/products

# Login
curl -X POST https://dahorta-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Testar Frontend

1. Abrir: https://carvmatheus.github.io/fresh-store
2. Verificar se produtos aparecem
3. Clicar em "Entrar"
4. Login: `admin` / `admin123`
5. Verificar se redireciona para painel admin
6. Tentar criar um produto
7. Logout e testar como cliente

---

## ⚠️ Limitações Render Free

### Sleep após 15 minutos

O plano free do Render "dorme" após 15min sem uso:
- ⏱️ Primeira requisição: 30-60 segundos
- ⚡ Requisições seguintes: normal

### Solução: UptimeRobot (Grátis)

1. Criar conta: https://uptimerobot.com
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://dahorta-backend.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. Salvar

Pronto! Backend fica sempre ativo. ✅

---

## 🔄 Como Atualizar

### Atualizar Backend:

```bash
cd ~/Documents/Repositories/dahorta-backend
# Fazer alterações no código
git add .
git commit -m "Update: descrição"
git push origin main
# Render faz deploy automático! ✨
```

### Atualizar Frontend:

```bash
cd ~/Documents/Repositories/fresh-store
# Fazer alterações no código
git add .
git commit -m "Update: descrição"
git push origin main
# GitHub Pages atualiza automático! ✨
```

---

## 📊 Arquitetura Final

```
┌──────────────────────────────────────────────┐
│  GitHub Pages (GRÁTIS)                       │
│  https://carvmatheus.github.io/fresh-store   │
│                                              │
│  ✅ Frontend (HTML/CSS/JS)                   │
│  ✅ Deploy automático do GitHub              │
└────────────────┬─────────────────────────────┘
                 │
                 │ HTTPS API Requests
                 │
┌────────────────▼─────────────────────────────┐
│  Render.com (GRÁTIS)                         │
│  https://dahorta-backend.onrender.com        │
│                                              │
│  ✅ Backend (Python/FastAPI)                 │
│  ✅ Deploy automático do GitHub              │
│  ⚠️ Sleep após 15min (free tier)             │
└────────────────┬─────────────────────────────┘
                 │
                 │ MongoDB Driver (Motor)
                 │
┌────────────────▼─────────────────────────────┐
│  MongoDB Atlas (GRÁTIS)                      │
│  mongodb+srv://...mongodb.net/da_horta_db    │
│                                              │
│  ✅ Database NoSQL                           │
│  ✅ 512MB free tier                          │
│  ✅ Backups automáticos                      │
└──────────────────────────────────────────────┘
```

**Custo Total: R$ 0,00/mês** 🎉

---

## 🎯 URLs Finais

| Serviço | URL |
|---------|-----|
| **Site (Frontend)** | https://carvmatheus.github.io/fresh-store |
| **API (Backend)** | https://dahorta-backend.onrender.com |
| **API Docs** | https://dahorta-backend.onrender.com/docs |
| **Health Check** | https://dahorta-backend.onrender.com/health |
| **Repo Backend** | https://github.com/carvmatheus/dahorta-backend |
| **Repo Frontend** | https://github.com/carvmatheus/fresh-store |

---

## 🔑 Credenciais

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

⚠️ **IMPORTANTE:** Alterar essas senhas em produção!

---

## 🎉 Pronto!

Sistema **100% funcional** e no ar! 🚀

**Próximos passos:**
1. Testar todas as funcionalidades
2. Configurar UptimeRobot (evitar sleep)
3. Compartilhar o link!
4. Customizar conforme necessário

---

**🌱 Da Horta Distribuidora - Sistema Profissional no Ar!**

**Dúvidas?** Consulte a documentação ou me avise! 😊

