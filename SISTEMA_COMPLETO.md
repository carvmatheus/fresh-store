# 🎉 Sistema Completo - Da Horta Distribuidora

## ✅ O que foi criado

### 🔙 Backend (Python/FastAPI + MongoDB)

#### Estrutura:
```
backend/
├── main.py              - Aplicação principal FastAPI
├── config.py            - Configurações (MongoDB, JWT, etc)
├── database.py          - Conexão assíncrona com MongoDB
├── init_db.py           - Script para popular banco inicial
├── requirements.txt     - Dependências Python
├── models/              - Modelos Pydantic
│   ├── user.py         - Modelo de usuário
│   ├── product.py      - Modelo de produto
│   └── order.py        - Modelo de pedido
└── routes/              - Rotas da API
    ├── auth.py         - Autenticação (login, register, JWT)
    ├── products.py     - CRUD de produtos
    ├── orders.py       - Gestão de pedidos
    └── users.py        - Gestão de usuários (admin)
```

#### Recursos:
- ✅ Autenticação JWT com tokens de 7 dias
- ✅ CRUD completo de produtos (admin)
- ✅ Sistema de pedidos com cálculo automático
- ✅ Upload de imagens em Base64
- ✅ Soft delete (produtos e usuários)
- ✅ Validação de dados com Pydantic
- ✅ CORS configurado
- ✅ Documentação Swagger automática
- ✅ Índices MongoDB para performance

#### Bancos MongoDB:
```
da_horta_db
├── users          - Usuários (clientes e admins)
├── products       - Catálogo de produtos
└── orders         - Pedidos dos clientes
```

### 🎨 Frontend (HTML/CSS/JS)

#### Arquivos atualizados:
```
docs/
├── config.js          - Configuração da API (BASE_URL)
├── api-client.js      - Cliente HTTP com todos os métodos
├── index.html         - Catálogo (carrega produtos via API)
├── admin.html         - Painel admin (CRUD de produtos)
├── cliente.html       - Área do cliente (pedidos)
├── carrinho.html      - Checkout (cria pedidos)
├── login.html         - Login (autentica na API)
├── app.js             - Carrega produtos da API
├── admin.js           - CRUD de produtos via API
├── cliente.js         - Lista pedidos via API
├── cart.js            - Cria pedidos via API
└── auth.js            - Login/logout via API
```

#### Fluxo de Dados:
1. **Produtos**: API → `app.js` → Renderiza no DOM
2. **Login**: Formulário → `auth.js` → API → JWT → localStorage
3. **Admin**: Formulário → `admin.js` → API → Recarrega lista
4. **Pedidos**: Carrinho → `cart.js` → API → Confirmação

---

## 🚀 Como Usar

### 1. Iniciar Sistema

#### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # Ou criar venv se não existir
python main.py
```

**Backend:** http://localhost:8000  
**Docs:** http://localhost:8000/docs

#### Terminal 2 - Frontend:
```bash
cd docs
python3 -m http.server 8080
```

**Frontend:** http://localhost:8080

### 2. Primeiro Acesso

1. Abrir http://localhost:8080
2. Clicar em "Entrar" (canto superior esquerdo)
3. Usar credenciais:
   - **Admin**: `admin` / `admin123`
   - **Cliente**: `cliente` / `cliente123`

### 3. Testar Funcionalidades

#### Como Cliente:
1. ✅ Navegar produtos no catálogo
2. ✅ Usar filtros de categoria
3. ✅ Buscar produtos
4. ✅ Adicionar ao carrinho
5. ✅ Simular frete (CEP)
6. ✅ Finalizar pedido
7. ✅ Ver pedidos na área do cliente

#### Como Admin:
1. ✅ Acessar painel admin
2. ✅ Criar novo produto
3. ✅ Upload de imagem
4. ✅ Editar produto existente
5. ✅ Deletar produto
6. ✅ Buscar/filtrar produtos

---

## 📡 Endpoints da API

### 🔐 Autenticação
```
POST   /api/auth/register       - Registrar usuário
POST   /api/auth/login          - Login (retorna JWT)
GET    /api/auth/me             - Dados do usuário logado
```

### 📦 Produtos
```
GET    /api/products            - Listar produtos
GET    /api/products/{id}       - Obter produto
POST   /api/products            - Criar produto (admin)
PUT    /api/products/{id}       - Atualizar produto (admin)
DELETE /api/products/{id}       - Deletar produto (admin)
GET    /api/products/categories/list - Listar categorias
```

### 🛒 Pedidos
```
GET    /api/orders              - Meus pedidos
GET    /api/orders/all          - Todos (admin)
GET    /api/orders/{id}         - Detalhes do pedido
POST   /api/orders              - Criar pedido
PATCH  /api/orders/{id}/status  - Atualizar status (admin)
```

### 👥 Usuários (Admin)
```
GET    /api/users               - Listar usuários
GET    /api/users/{id}          - Obter usuário
DELETE /api/users/{id}          - Desativar usuário
```

---

## 🔧 Configuração

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=da_horta_db
SECRET_KEY=sua-chave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend (config.js)
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    TIMEOUT: 30000
};
```

---

## 🧪 Testar API

### Swagger UI (Recomendado)
http://localhost:8000/docs

Interface interativa completa!

### cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Listar produtos
curl http://localhost:8000/api/products

# Criar produto (com token)
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer {SEU_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "category": "verduras",
    "price": 10.5,
    "unit": "kg",
    "minOrder": 1,
    "stock": 100,
    "image": "data:image/png;base64,...",
    "description": "Descrição do produto"
  }'
```

---

## 📊 Dados Iniciais

Após `python init_db.py`, o banco terá:

### Usuários:
- **admin** / admin123 (role: admin)
- **cliente** / cliente123 (role: cliente)

### Produtos (12):
- Alface Crespa
- Tomate Italiano
- Cebola Roxa
- Batata Inglesa
- Cenoura Fresca
- Feijão Preto
- Arroz Integral
- Maçã Fuji
- Manjericão Fresco
- Alho Branco
- Banana Prata
- Limão Tahiti

---

## 🎯 Próximos Passos

### Deploy em Produção

1. **MongoDB**: Usar MongoDB Atlas (cloud)
2. **Backend**: Deploy em Heroku/Railway/Render
3. **Frontend**: Deploy em Vercel/Netlify
4. **Configurar**: Atualizar URLs em `.env` e `config.js`

### Melhorias Futuras

- [ ] Pagamento online
- [ ] Notificações por email
- [ ] Sistema de avaliações
- [ ] Relatórios e analytics
- [ ] App mobile

---

## 🐛 Troubleshooting

### MongoDB não conecta
```bash
# Verificar status
mongosh --eval 'db.runCommand({ connectionStatus: 1 })'

# Iniciar serviço
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Backend não inicia
```bash
# Verificar porta 8000
lsof -i :8000

# Reinstalar dependências
pip install --force-reinstall -r requirements.txt
```

### Frontend não carrega produtos
1. Verificar se backend está rodando (http://localhost:8000/health)
2. Abrir console do navegador (F12) para ver erros
3. Verificar URL em `config.js`
4. Verificar CORS no backend

### Token expirou
- Fazer login novamente
- Token expira em 7 dias
- Verificar localStorage (`auth_token`)

---

## 📚 Documentação

- [README Principal](README.md)
- [Quick Start](QUICKSTART.md)
- [Guia de Integração](INTEGRACAO_FRONTEND_BACKEND.md)
- [README Backend](backend/README.md)

---

## ✨ Resumo Técnico

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| Frontend | HTML/CSS/JS | Interface do usuário |
| Backend | Python/FastAPI | API REST |
| Banco | MongoDB | Armazenamento NoSQL |
| Auth | JWT | Autenticação stateless |
| HTTP Client | Fetch API | Requisições AJAX |
| Server | Uvicorn | Servidor ASGI |
| Validação | Pydantic | Validação de dados |
| Hash | bcrypt | Hash de senhas |

---

**🎉 Sistema 100% funcional e pronto para uso!**

**⚡ Dinâmico, escalável e profissional!**

---

**Dúvidas?** Consulte a documentação ou abra uma issue no GitHub!

