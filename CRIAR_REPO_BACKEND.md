# 📦 Criar Repositório Separado para o Backend

Guia passo a passo para criar um repositório só com o backend.

## 🎯 Por que fazer isso?

- ✅ Render encontra `requirements.txt` na raiz
- ✅ Deploy mais simples
- ✅ Repositório mais limpo
- ✅ Menos confusão

---

## 🚀 Passo a Passo

### 1. Criar Nova Pasta

```bash
cd ~/Documents/Repositories
mkdir fresh-store-backend
cd fresh-store-backend
```

### 2. Copiar Arquivos do Backend

```bash
cp -r ../fresh-store/backend/* .
```

### 3. Verificar Arquivos

```bash
ls -la
```

Deve ter:
- `main.py`
- `requirements.txt`
- `config.py`
- `database.py`
- `init_db.py`
- `models/`
- `routes/`
- `.gitignore`

### 4. Criar README.md

```bash
cat > README.md << 'EOF'
# 🔙 Fresh Store - Backend API

Backend Python/FastAPI + MongoDB para o marketplace Da Horta Distribuidora.

## 🛠 Tecnologias

- Python 3.11+
- FastAPI
- MongoDB (Motor)
- JWT Authentication

## 🚀 Deploy no Render.com

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
python main.py
```

**Environment Variables:**
```
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/da_horta_db
SECRET_KEY=<gerar-chave-forte>
DB_NAME=da_horta_db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

## 📡 Endpoints

- `GET /health` - Health check
- `GET /docs` - Swagger API
- `POST /api/auth/login` - Login
- `GET /api/products` - Produtos
- `POST /api/orders` - Criar pedido

## 🗄️ Inicializar Banco

```bash
python init_db.py
```

## 🔑 Credenciais

- Admin: `admin` / `admin123`
- Cliente: `cliente` / `cliente123`

---

**Frontend:** https://github.com/carvmatheus/fresh-store
EOF
```

### 5. Criar DEPLOY.md

```bash
cat > DEPLOY.md << 'EOF'
# 🚀 Deploy no Render

## Configuração

**Nome:** fresh-store-backend
**Runtime:** Python 3
**Build:** pip install -r requirements.txt
**Start:** python main.py

## Variáveis

```
MONGODB_URL=mongodb+srv://...
SECRET_KEY=<gerar>
DB_NAME=da_horta_db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

## MongoDB Atlas

1. https://mongodb.com/cloud/atlas
2. Create Free Cluster
3. Database Access → Create User
4. Network Access → 0.0.0.0/0
5. Connect → Copy connection string

## Pós-Deploy

Shell → `python init_db.py`

## URLs

- Health: /health
- Docs: /docs
- API: /api/*
EOF
```

### 6. Inicializar Git

```bash
git init
git add .
git status
```

### 7. Commit Inicial

```bash
git commit -m "Initial commit: Backend Python/FastAPI + MongoDB

- FastAPI framework
- MongoDB async driver
- JWT authentication
- CRUD produtos e pedidos
- Documentação Swagger
- Ready for Render deployment"
```

### 8. Criar Repositório no GitHub

**Opção A: Via GitHub CLI**
```bash
gh repo create fresh-store-backend --public --source=. --remote=origin --push
```

**Opção B: Via Web (https://github.com/new)**

1. Ir em: https://github.com/new
2. Nome: `fresh-store-backend`
3. Descrição: "Backend API - Da Horta Distribuidora (Python/FastAPI + MongoDB)"
4. Public
5. **NÃO** marcar "Initialize with README"
6. Create repository

### 9. Conectar e Push (se usou Opção B)

```bash
git remote add origin https://github.com/carvmatheus/fresh-store-backend.git
git branch -M main
git push -u origin main
```

### 10. Verificar

Abrir: https://github.com/carvmatheus/fresh-store-backend

Deve ter todos os arquivos do backend! ✅

---

## 🌐 Deploy no Render

### 1. Novo Web Service

1. Dashboard Render: https://dashboard.render.com
2. **New** → **Web Service**
3. **Connect:** `fresh-store-backend` (o novo repo!)

### 2. Configurar

```
Name: fresh-store-backend
Region: Oregon
Branch: main
Root Directory: (deixar vazio! Agora está na raiz!)
Runtime: Python 3

Build Command:
pip install -r requirements.txt

Start Command:
python main.py
```

### 3. Environment Variables

```bash
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/da_horta_db
SECRET_KEY=<gerar com: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DB_NAME=da_horta_db
```

### 4. Create Web Service

Aguardar deploy (5-10 min).

### 5. Inicializar Banco

Shell do Render → `python init_db.py`

### 6. Testar

```
https://fresh-store-backend.onrender.com/health
https://fresh-store-backend.onrender.com/docs
```

---

## ✅ Atualizar Frontend

No repositório `fresh-store`, editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://fresh-store-backend.onrender.com/api',
    TIMEOUT: 30000
};
```

Commit e push:
```bash
cd ~/Documents/Repositories/fresh-store
git add docs/config.js
git commit -m "Update API URL to new backend repository"
git push origin main
```

---

## 🎉 Pronto!

Agora você tem:

✅ **Backend:** https://github.com/carvmatheus/fresh-store-backend  
✅ **Frontend:** https://github.com/carvmatheus/fresh-store  
✅ **Deploy:** https://fresh-store-backend.onrender.com  
✅ **GitHub Pages:** https://carvmatheus.github.io/fresh-store  

---

## 📊 Estrutura Final

```
GitHub
├── fresh-store                    (Frontend + Docs)
│   ├── docs/                      (GitHub Pages)
│   ├── app/                       (Next.js - opcional)
│   ├── components/
│   └── README.md
│
└── fresh-store-backend            (Backend apenas)
    ├── main.py
    ├── requirements.txt
    ├── models/
    ├── routes/
    └── README.md
```

```
Deploy
├── GitHub Pages                   (Frontend grátis)
│   └── carvmatheus.github.io/fresh-store
│
└── Render.com                     (Backend grátis)
    └── fresh-store-backend.onrender.com
```

**Custo Total: R$ 0,00/mês** 🎉

---

## 🔄 Manutenção

### Atualizar Backend

```bash
cd ~/Documents/Repositories/fresh-store-backend
# Fazer alterações
git add .
git commit -m "Update: ..."
git push origin main
# Render faz deploy automático!
```

### Atualizar Frontend

```bash
cd ~/Documents/Repositories/fresh-store
# Fazer alterações
git add .
git commit -m "Update: ..."
git push origin main
# GitHub Pages atualiza automático!
```

---

**🚀 Agora sim, deploy profissional e organizado!**

