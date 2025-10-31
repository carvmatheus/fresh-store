# 📄 GitHub Pages Setup - Da Horta Distribuidora

Guia completo de quais arquivos vão para GitHub Pages e como configurar.

---

## 🎯 O Que É GitHub Pages?

GitHub Pages é um serviço de hospedagem **GRATUITO** do GitHub que serve arquivos **HTML, CSS e JavaScript estáticos**.

### ✅ O Que Funciona:
- ✅ HTML, CSS, JavaScript
- ✅ Imagens, fontes, assets estáticos
- ✅ Frontend completo (SPA - Single Page Application)
- ✅ React, Vue, Angular (após build)

### ❌ O Que NÃO Funciona:
- ❌ Backend (Python, Node.js, etc)
- ❌ Banco de dados (PostgreSQL, MongoDB, etc)
- ❌ Processamento server-side
- ❌ APIs

---

## 📦 Arquitetura Da Horta

```
┌──────────────────────────────────────────┐
│   FRONTEND (GitHub Pages)                │
│   https://carvmatheus.github.io          │
│   /fresh-store                           │
│                                          │
│   • HTML + CSS + JavaScript              │
│   • Imagens estáticas (logo, banner)    │
│   • Faz requisições via fetch()          │
└──────────────┬───────────────────────────┘
               │
               │ API REST (JSON)
               │
┌──────────────▼───────────────────────────┐
│   BACKEND (Render.com)                   │
│   https://dahorta-backend.onrender.com   │
│                                          │
│   • Python FastAPI                       │
│   • PostgreSQL (database)                │
│   • Cloudinary (imagens)                 │
└──────────────────────────────────────────┘
```

---

## 📁 Arquivos Para GitHub Pages

### ✅ Diretório `/docs` - VAI PARA GITHUB PAGES

```
docs/
├── index.html              ← Página principal
├── carrinho.html           ← Página do carrinho
├── login.html              ← Página de login
├── admin.html              ← Painel admin
├── cliente.html            ← Área do cliente
├── styles.css              ← Estilos
├── config.js               ← Configuração da API
├── api-client.js           ← Cliente HTTP (fetch)
├── auth.js                 ← Lógica de autenticação
├── app.js                  ← Lógica da home
├── admin.js                ← Lógica do admin
├── cliente.js              ← Lógica do cliente
├── cart.js                 ← Lógica do carrinho
└── images/                 ← Imagens estáticas
    ├── Header_da_horta.png ← Banner
    ├── logo.png            ← Logo
    └── (outras imagens)    ← Placeholders
```

**Total:** ~15 arquivos HTML + JS + CSS + imagens

### ❌ Diretório `/backend` - NÃO VAI PARA GITHUB PAGES

```
backend/                    ← FICA NO RENDER
├── main_sql.py             ← Aplicação FastAPI
├── config_sql.py           ← Config (DATABASE_URL, etc)
├── database_sql.py         ← SQLAlchemy
├── models_sql.py           ← Models PostgreSQL
├── routes_sql/             ← Routes da API
│   ├── auth.py
│   ├── products.py
│   ├── orders.py
│   └── users.py
├── requirements_sql.txt    ← Dependências Python
└── schema.sql              ← Schema PostgreSQL
```

**Estes arquivos ficam em:** `https://github.com/carvmatheus/dahorta-backend`

---

## 🚀 Como Ativar GitHub Pages

### Opção 1: Via Interface Web

1. Ir no GitHub: https://github.com/carvmatheus/fresh-store
2. Clicar em **Settings** (Configurações)
3. No menu lateral, clicar em **Pages**
4. Em **Source**, selecionar:
   - **Branch:** `main`
   - **Folder:** `/docs` ⚠️ **IMPORTANTE!**
5. Clicar em **Save**
6. Aguardar 2-5 minutos

### Opção 2: Via Terminal

```bash
# Já está configurado! Só fazer push:
cd ~/Documents/Repositories/fresh-store
git add docs/
git commit -m "Update: Frontend files"
git push origin main

# GitHub Pages detecta automaticamente
```

---

## 🔗 URLs Finais

### Frontend (GitHub Pages):
```
https://carvmatheus.github.io/fresh-store
```

**Páginas disponíveis:**
- `https://carvmatheus.github.io/fresh-store/` ← Home
- `https://carvmatheus.github.io/fresh-store/carrinho.html` ← Carrinho
- `https://carvmatheus.github.io/fresh-store/login.html` ← Login
- `https://carvmatheus.github.io/fresh-store/admin.html` ← Admin
- `https://carvmatheus.github.io/fresh-store/cliente.html` ← Cliente

### Backend (Render.com):
```
https://dahorta-backend.onrender.com/api
```

**Endpoints disponíveis:**
- `GET /api/products` ← Listar produtos
- `POST /api/auth/login` ← Login
- `POST /api/products` ← Criar produto (admin)
- `POST /api/products/upload-image` ← Upload imagem (admin)
- `GET /api/orders` ← Listar pedidos
- `POST /api/orders` ← Criar pedido

**API Docs:**
```
https://dahorta-backend.onrender.com/docs
```

---

## 📊 Como Funciona a Integração

### 1. Usuário Acessa GitHub Pages

```
https://carvmatheus.github.io/fresh-store
```

### 2. Navegador Carrega Arquivos Estáticos

```html
<!-- index.html -->
<script src="config.js"></script>      ← Define URL do backend
<script src="api-client.js"></script>  ← Cliente HTTP
<script src="app.js"></script>         ← Lógica da página
```

### 3. JavaScript Faz Requisição para Render

```javascript
// app.js
const products = await api.getProducts();
// Faz: GET https://dahorta-backend.onrender.com/api/products
```

### 4. Backend Processa no Render

```python
# routes_sql/products.py
@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    # Consulta PostgreSQL
    products = db.query(Product).all()
    return products
```

### 5. Backend Retorna JSON

```json
[
  {
    "id": "uuid-123",
    "name": "Alface Crespa",
    "price": 3.50,
    "image_url": "https://res.cloudinary.com/..."
  }
]
```

### 6. Frontend Renderiza Dados

```javascript
// app.js
products.forEach(product => {
    const card = createProductCard(product);
    container.appendChild(card);
});
```

---

## 🧪 Testando

### 1. Verificar GitHub Pages

```bash
# Abrir no navegador
open https://carvmatheus.github.io/fresh-store
```

**Console (F12) deve mostrar:**
```
🔧 Da Horta API Config: {
  environment: "PRODUÇÃO",
  baseUrl: "https://dahorta-backend.onrender.com/api",
  database: "PostgreSQL",
  storage: "Cloudinary"
}
✅ API Client inicializado
✅ 12 produtos carregados da API
```

### 2. Verificar Backend (Render)

```bash
# Health check
curl https://dahorta-backend.onrender.com/health

# Retorna:
{"status": "healthy"}
```

### 3. Verificar API

```bash
# Listar produtos
curl https://dahorta-backend.onrender.com/api/products

# Retorna: JSON com produtos
```

---

## 🐛 Troubleshooting

### Erro: 404 Page Not Found

**Problema:** GitHub Pages não encontra a página

**Solução:**
1. Verificar se `/docs` foi selecionado nas configurações
2. Aguardar 2-5 minutos após ativar
3. Fazer hard refresh (Ctrl+F5 ou Cmd+Shift+R)

### Erro: CORS blocked

**Problema:** Backend bloqueia requisições

**Solução:** Backend já tem CORS habilitado:
```python
# main_sql.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]  # Permite qualquer origem
)
```

### Erro: 404 no /api/products

**Problema:** Backend não está rodando ou URL errada

**Verificar:**
1. Backend está online? (Render Dashboard)
2. URL está correta em `docs/config.js`?
3. Backend foi deployado com `main_sql.py`?

### Produtos não aparecem

**Verificar:**
1. PostgreSQL foi inicializado? (`schema.sql`)
2. Console (F12) mostra erros?
3. Backend retorna produtos? (testar no `/docs`)

---

## 📝 Checklist de Deploy

### Backend (Render):

- [ ] PostgreSQL criado no Render
- [ ] `schema.sql` executado
- [ ] Cloudinary configurado
- [ ] Environment Variables configuradas:
  - `DATABASE_URL`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `SECRET_KEY`
- [ ] `requirements_sql.txt` correto
- [ ] Deploy feito com `main_sql.py`
- [ ] Health check funcionando
- [ ] `/docs` acessível

### Frontend (GitHub Pages):

- [ ] Arquivos em `/docs` commitados
- [ ] GitHub Pages ativado (Settings → Pages)
- [ ] Pasta `/docs` selecionada
- [ ] `config.js` com URL correta do Render
- [ ] Site acessível via GitHub Pages URL
- [ ] Console sem erros
- [ ] Produtos carregando da API
- [ ] Login funcionando
- [ ] Imagens do Cloudinary carregando

---

## 🎉 Resumo Final

### O Que Vai Para Onde:

| Arquivo/Pasta | Destino | URL |
|---------------|---------|-----|
| `/docs/` | GitHub Pages | `carvmatheus.github.io/fresh-store` |
| `/backend/` | Render.com | `dahorta-backend.onrender.com` |

### Como Atualizar:

**Frontend:**
```bash
cd ~/Documents/Repositories/fresh-store
# Editar arquivos em /docs
git add docs/
git commit -m "Update: Frontend"
git push origin main
# GitHub Pages atualiza automaticamente em 1-2 min
```

**Backend:**
```bash
cd ~/Documents/Repositories/dahorta-backend
# Editar arquivos
git add .
git commit -m "Update: Backend"
git push origin main
# Render detecta e redeploya automaticamente em 3-5 min
```

---

**✅ Frontend no GitHub Pages (Grátis)**  
**✅ Backend no Render.com (Grátis)**  
**✅ PostgreSQL no Render (Grátis)**  
**✅ Cloudinary (Grátis até 25GB)**  

**🚀 Stack 100% Gratuita e Profissional!**

