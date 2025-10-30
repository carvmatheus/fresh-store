# 🔗 Integração Frontend ↔ Backend

Guia completo de como o frontend se comunica com o backend.

---

## 📋 Checklist de Integração

- [x] Backend configurado com Docker
- [x] Backend no repositório `dahorta-backend`
- [x] Frontend com scripts de API
- [ ] Backend deployado no Render
- [ ] MongoDB Atlas configurado
- [ ] MongoDB inicializado com dados
- [ ] Frontend atualizado com URL do Render
- [ ] Testes de integração

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  USUÁRIO (Navegador)                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────┐
│            FRONTEND (GitHub Pages)                   │
│  https://carvmatheus.github.io/fresh-store          │
│                                                       │
│  • index.html, admin.html, cliente.html             │
│  • config.js → Define URL do backend                │
│  • api-client.js → Cliente HTTP                     │
│  • app.js, admin.js, cliente.js → Lógica           │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ API REST (JSON)
                       │ JWT Authentication
                       │
┌──────────────────────▼──────────────────────────────┐
│           BACKEND (Render.com + Docker)              │
│  https://dahorta-backend.onrender.com               │
│                                                       │
│  • FastAPI (Python)                                  │
│  • JWT Auth                                          │
│  • CRUD de Produtos, Pedidos, Usuários             │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ MongoDB Driver
                       │
┌──────────────────────▼──────────────────────────────┐
│           BANCO DE DADOS (MongoDB Atlas)             │
│  mongodb+srv://...mongodb.net/da_horta_db           │
│                                                       │
│  Collections:                                        │
│  • users → Usuários (admin, clientes)               │
│  • products → Produtos do catálogo                  │
│  • orders → Pedidos realizados                      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos (Frontend)

```
docs/
├── config.js              ← Configuração da API (URL do backend)
├── api-client.js          ← Cliente HTTP (fetch + JWT)
├── auth.js                ← Lógica de autenticação
├── app.js                 ← Lógica da página principal
├── admin.js               ← Lógica do painel admin
├── cliente.js             ← Lógica da área do cliente
├── cart.js                ← Lógica do carrinho
├── index.html             ← Página principal
├── admin.html             ← Painel administrativo
├── cliente.html           ← Área do cliente
├── carrinho.html          ← Página do carrinho
└── login.html             ← Página de login
```

### Importação dos Scripts (Ordem Importante!)

Todos os arquivos HTML devem importar os scripts nesta ordem:

```html
<!-- API Scripts -->
<script src="config.js"></script>         <!-- 1. Configuração -->
<script src="api-client.js"></script>     <!-- 2. Cliente HTTP -->
<script src="auth.js"></script>           <!-- 3. Autenticação -->
<script src="app.js"></script>            <!-- 4. Lógica específica -->
```

---

## 🔧 Arquivo: `config.js`

Define a URL base do backend:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://dahorta-backend.onrender.com/api',
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};
```

**Atualizar após deploy:**
1. Deploy backend no Render
2. Copiar URL do backend
3. Atualizar `BASE_URL` em `config.js`
4. Commit e push

---

## 🌐 Arquivo: `api-client.js`

Cliente HTTP que faz todas as requisições:

### Estrutura

```javascript
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    async request(endpoint, options) {
        // Adiciona JWT token aos headers
        // Faz fetch
        // Trata erros
        // Retorna JSON
    }

    // Métodos da API
    async login(username, password) { ... }
    async getProducts() { ... }
    async createProduct(data) { ... }
    async updateProduct(id, data) { ... }
    async deleteProduct(id) { ... }
    async getOrders() { ... }
    async createOrder(data) { ... }
}

// Instância global
const api = new ApiClient(API_CONFIG.BASE_URL);
```

### Uso nos Scripts

```javascript
// Em app.js
const products = await api.getProducts();

// Em admin.js
await api.createProduct(productData);

// Em cliente.js
const orders = await api.getOrders();

// Em cart.js
const order = await api.createOrder(orderData);
```

---

## 🔑 Autenticação (JWT)

### Fluxo de Login

1. **Usuário digita credenciais** (login.html)
2. **Frontend envia** POST `/api/auth/login`
3. **Backend valida** credenciais no MongoDB
4. **Backend retorna** JWT token + dados do usuário
5. **Frontend salva** token no localStorage
6. **Frontend redireciona** para área apropriada

### Armazenamento

```javascript
// Login bem-sucedido
localStorage.setItem('auth_token', data.access_token);
localStorage.setItem('currentUser', JSON.stringify(data.user));

// Requisições subsequentes
headers: {
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
}

// Logout
localStorage.removeItem('auth_token');
localStorage.removeItem('currentUser');
```

---

## 🔄 Endpoints da API

### Autenticação

```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "access_token": "eyJ...", "user": {...} }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { "id": "...", "username": "admin", ... }
```

### Produtos

```
GET /api/products
Query: ?category=vegetables&search=tomate&skip=0&limit=50
Response: [{ "id": "...", "name": "Tomate", ... }]

POST /api/products (Admin only)
Body: { "name": "Novo Produto", "price": 10.0, ... }
Response: { "id": "...", "name": "Novo Produto", ... }

PUT /api/products/{id} (Admin only)
Body: { "price": 12.0, "stock": 100 }
Response: { "id": "...", "price": 12.0, ... }

DELETE /api/products/{id} (Admin only)
Response: 204 No Content
```

### Pedidos

```
GET /api/orders
Headers: Authorization: Bearer <token>
Response: [{ "order_number": "DH-2025-0001", ... }]

POST /api/orders
Body: {
  "items": [...],
  "shipping_address": {...},
  "contact_info": {...},
  "delivery_fee": 15.0
}
Response: { "order_number": "DH-2025-0001", ... }

PATCH /api/orders/{id}/status (Admin only)
Body: { "status": "em_preparacao" }
Response: { "id": "...", "status": "em_preparacao", ... }
```

---

## 🚀 Passo a Passo: Configurar Integração

### 1. Deploy Backend no Render

```bash
# Backend já está no repositório dahorta-backend
# No Render Dashboard:
1. New → Web Service
2. Connect repository: dahorta-backend
3. Environment: Docker
4. Add env variables (MONGODB_URL, SECRET_KEY, etc.)
5. Create Web Service
6. Aguardar deploy (5-10 min)
7. Copiar URL: https://dahorta-backend.onrender.com
```

### 2. Inicializar MongoDB

```bash
# No Render Shell ou MongoDB Compass
python init_db.py

# Ou executar mongodb-init.js no MongoDB Playground
```

### 3. Atualizar Frontend

**Editar `docs/config.js`:**

```javascript
const API_CONFIG = {
    BASE_URL: 'https://dahorta-backend.onrender.com/api',
    // ...
};
```

**Commit e Push:**

```bash
cd ~/Documents/Repositories/fresh-store
git add docs/config.js
git commit -m "Update: Backend URL para Render"
git push origin main
```

### 4. Ativar GitHub Pages

```
GitHub → Repositório fresh-store → Settings → Pages
Source: Deploy from a branch
Branch: main
Folder: /docs
Save
```

Aguardar 2-5 minutos.

### 5. Testar Integração

**Abrir frontend:**
```
https://carvmatheus.github.io/fresh-store
```

**Verificar console (F12):**
```
✅ API Client inicializado: https://dahorta-backend.onrender.com/api
✅ X produtos carregados
```

**Testar login:**
- Username: `admin`
- Password: `admin123`

---

## 🧪 Como Testar

### 1. Health Check do Backend

```bash
curl https://dahorta-backend.onrender.com/health
# Esperado: {"status":"healthy"}
```

### 2. API Docs

Abrir no navegador:
```
https://dahorta-backend.onrender.com/docs
```

### 3. Login via API

```bash
curl -X POST https://dahorta-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. Listar Produtos

```bash
curl https://dahorta-backend.onrender.com/api/products
```

### 5. Frontend Console

Abrir frontend e verificar console (F12):

```javascript
// Deve mostrar:
✅ API Client inicializado: https://dahorta-backend.onrender.com/api
✅ 16 produtos carregados
```

---

## 🐛 Troubleshooting

### Erro: CORS blocked

**Problema:** Backend não permite requisições do frontend

**Solução:** Backend já tem CORS configurado para permitir qualquer origem:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Erro: 401 Unauthorized

**Problema:** Token JWT inválido ou expirado

**Solução:**
1. Fazer logout
2. Fazer login novamente
3. Verificar se token está sendo enviado

```javascript
// No console
console.log(localStorage.getItem('auth_token'));
```

### Erro: 404 Not Found

**Problema:** Endpoint incorreto ou backend offline

**Verificar:**
1. URL do backend está correta em `config.js`
2. Backend está online (verificar Render Dashboard)
3. Endpoint existe (verificar `/docs`)

### Erro: Timeout

**Problema:** Backend no Render demorou mais de 30s (cold start)

**Solução:** Render free tier "dorme" após 15min de inatividade. Primeira requisição demora ~30-60s.

```javascript
// config.js já tem timeout de 30s
TIMEOUT: 30000
```

### Produtos não aparecem

**Verificar:**
1. MongoDB foi inicializado (`init_db.py`)
2. Backend retorna produtos (`/api/products`)
3. Console do navegador (F12) mostra erros

```javascript
// No console
api.getProducts().then(console.log);
```

---

## 📊 Fluxos Completos

### Fluxo: Listar Produtos (Página Principal)

```
1. Usuário acessa index.html
2. app.js carrega
3. app.js chama api.getProducts()
4. api-client.js faz GET /api/products
5. Backend consulta MongoDB
6. Backend retorna JSON com produtos
7. app.js renderiza produtos na página
```

### Fluxo: Adicionar Produto (Admin)

```
1. Admin acessa admin.html (já logado)
2. admin.js carrega produtos via api.getProducts()
3. Admin clica "Novo Produto"
4. Admin preenche formulário
5. Admin clica "Salvar"
6. admin.js chama api.createProduct(data)
7. api-client.js faz POST /api/products com JWT
8. Backend valida JWT (verifica se é admin)
9. Backend salva no MongoDB
10. Backend retorna produto criado
11. admin.js atualiza tabela
```

### Fluxo: Fazer Pedido

```
1. Cliente adiciona produtos ao carrinho (localStorage)
2. Cliente clica "Ver Carrinho"
3. Cliente preenche dados de entrega
4. Cliente clica "Finalizar Pedido"
5. cart.js chama api.createOrder(orderData)
6. api-client.js faz POST /api/orders com JWT
7. Backend valida JWT
8. Backend salva pedido no MongoDB
9. Backend gera número do pedido
10. Backend retorna pedido criado
11. cart.js mostra modal de sucesso
12. cart.js limpa carrinho
```

---

## 🔒 Segurança

### Variáveis Sensíveis

**NUNCA commitar:**
- ❌ MONGODB_URL com credenciais reais
- ❌ SECRET_KEY real
- ❌ Tokens de acesso

**SEMPRE usar:**
- ✅ Variáveis de ambiente no Render
- ✅ .env local (não commitado)
- ✅ Placeholders na documentação

### JWT Token

- Token expira em 7 dias (10080 minutos)
- Token armazenado em localStorage
- Token enviado em todas as requisições autenticadas
- Backend valida token em rotas protegidas

### Roles

- `admin`: Pode criar/editar/deletar produtos, ver todos os pedidos
- `client`: Pode criar pedidos, ver apenas seus pedidos

---

## 📚 Referências

- **Frontend:** `/Users/carvmatheus/Documents/Repositories/fresh-store/docs/`
- **Backend:** `/Users/carvmatheus/Documents/Repositories/dahorta-backend/`
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Render:** https://dashboard.render.com
- **GitHub Pages:** https://carvmatheus.github.io/fresh-store

---

## ✅ Status Atual

- [x] Scripts de API criados
- [x] Scripts importados em todos os HTML
- [x] config.js configurado
- [x] api-client.js implementado
- [x] auth.js com JWT
- [x] app.js, admin.js, cliente.js, cart.js integrados
- [ ] **PENDENTE: Deploy backend no Render**
- [ ] **PENDENTE: Inicializar MongoDB**
- [ ] **PENDENTE: Testar integração completa**

---

**🎯 Próximo Passo:** Deploy do backend no Render usando Docker! 🐳

