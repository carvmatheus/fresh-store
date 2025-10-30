# 🥬 Da Horta Distribuidora - Marketplace B2B

Sistema completo de marketplace para fornecimento de produtos frescos para restaurantes, hotéis e mercados.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                           │
│  (HTML/CSS/JavaScript + API Client)                 │
│  - index.html (Catálogo de produtos)                │
│  - login.html (Autenticação)                        │
│  - admin.html (Painel administrativo)               │
│  - cliente.html (Área do cliente)                   │
│  - carrinho.html (Checkout)                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │ (JSON + JWT)
                   │
┌──────────────────▼──────────────────────────────────┐
│                   BACKEND                            │
│  (Python + FastAPI)                                 │
│  - Autenticação JWT                                 │
│  - CRUD de Produtos                                 │
│  - Gestão de Pedidos                                │
│  - Gestão de Usuários                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Motor (async driver)
                   │
┌──────────────────▼──────────────────────────────────┐
│                  MONGODB                             │
│  (NoSQL Database)                                   │
│  - Coleção: users                                   │
│  - Coleção: products                                │
│  - Coleção: orders                                  │
└─────────────────────────────────────────────────────┘
```

## 🛠 Tecnologias

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono para MongoDB
- **JWT (python-jose)** - Autenticação via tokens
- **Pydantic** - Validação de dados
- **Passlib + bcrypt** - Hash de senhas
- **Uvicorn** - Servidor ASGI

### Frontend
- **HTML5** + **CSS3**
- **JavaScript (ES6+)**
- **Fetch API** - Requisições HTTP
- **LocalStorage** - Armazenamento de carrinho
- **Responsivo** - Mobile-first design

## 🐳 Instalação com Docker (Recomendado!)

**Forma mais fácil - Um único comando:**

```bash
# Instalar Docker: https://docs.docker.com/get-docker/

# Clonar e iniciar
git clone https://github.com/seu-usuario/fresh-store.git
cd fresh-store
./docker-start.sh
```

✅ **Pronto!** Acesse http://localhost

---

## 📦 Instalação Manual (Alternativa)

### 1. Clonar repositório

```bash
git clone https://github.com/seu-usuario/fresh-store.git
cd fresh-store
```

### 2. Instalar MongoDB

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

#### Windows:
Baixe em: https://www.mongodb.com/try/download/community

### 3. Configurar Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # Inicializar banco com dados de exemplo
python main.py     # Iniciar servidor
```

Backend rodando em: **http://localhost:8000**

### 4. Configurar Frontend

```bash
cd docs
python3 -m http.server 8080
```

Frontend rodando em: **http://localhost:8080**

## 🚀 Uso

### Credenciais de Teste

Após executar `python init_db.py`:

**Administrador:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

### Fluxo de Uso

1. **Acessar catálogo**: http://localhost:8080
2. **Fazer login**: Clicar em "Entrar" no header
3. **Adicionar produtos ao carrinho**
4. **Simular frete** com CEP
5. **Finalizar pedido**
6. **Acompanhar pedidos** na área do cliente

### Admin

1. Login com credenciais admin
2. Gerenciar produtos (CRUD completo)
3. Upload de imagens (Base64)
4. Controle de estoque, preços, categorias

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Dados do usuário logado

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/{id}` - Obter produto
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/{id}` - Atualizar produto (admin)
- `DELETE /api/products/{id}` - Deletar produto (admin)
- `GET /api/products/categories/list` - Listar categorias

### Pedidos
- `GET /api/orders` - Meus pedidos
- `GET /api/orders/all` - Todos os pedidos (admin)
- `GET /api/orders/{id}` - Detalhes do pedido
- `POST /api/orders` - Criar pedido
- `PATCH /api/orders/{id}/status` - Atualizar status (admin)

### Usuários (Admin)
- `GET /api/users` - Listar usuários
- `GET /api/users/{id}` - Obter usuário
- `DELETE /api/users/{id}` - Desativar usuário

**Documentação interativa:** http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
fresh-store/
├── backend/                    # Backend Python/FastAPI
│   ├── main.py                # Aplicação principal
│   ├── config.py              # Configurações
│   ├── database.py            # Conexão MongoDB
│   ├── init_db.py             # Script de inicialização
│   ├── requirements.txt       # Dependências Python
│   ├── models/                # Modelos de dados
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   └── routes/                # Rotas da API
│       ├── auth.py
│       ├── products.py
│       ├── orders.py
│       └── users.py
├── docs/                       # Frontend
│   ├── index.html             # Página principal
│   ├── login.html             # Login
│   ├── admin.html             # Painel admin
│   ├── cliente.html           # Área do cliente
│   ├── carrinho.html          # Checkout
│   ├── styles.css             # Estilos
│   ├── config.js              # Configuração da API
│   ├── api-client.js          # Cliente HTTP
│   ├── auth.js                # Autenticação
│   ├── app.js                 # Lógica principal
│   ├── admin.js               # Lógica admin
│   ├── cliente.js             # Lógica cliente
│   ├── cart.js                # Lógica carrinho
│   └── images/                # Imagens dos produtos
├── INTEGRACAO_FRONTEND_BACKEND.md  # Guia de integração
├── COMO_TESTAR_LOCAL.md       # Guia de testes locais
├── START_BACKEND.sh           # Script de inicialização
└── README.md                  # Este arquivo
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Criar arquivo `.env` no diretório `backend/`:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DB_NAME=da_horta_db

# JWT
SECRET_KEY=sua-chave-secreta-super-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Upload
MAX_IMAGE_SIZE=5242880
UPLOAD_DIR=uploads
```

### Configurar URL da API (Frontend)

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',  // Alterar em produção
    TIMEOUT: 30000
};
```

## 🧪 Testes

### Testar Backend

```bash
cd backend
# Verificar MongoDB
mongo --eval 'db.runCommand({ connectionStatus: 1 })'

# Testar endpoint
curl http://localhost:8000/health
```

### Testar Frontend

```bash
cd docs
python3 -m http.server 8080
# Abrir http://localhost:8080
```

### Testar API

Acessar Swagger UI: http://localhost:8000/docs

## 🌐 Deploy

### 🐳 Opção 1: Docker em VPS (Recomendado!)

**DigitalOcean, Linode, AWS - $5/mês**

```bash
# Conectar ao servidor
ssh user@seu-servidor.com

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Clonar e iniciar
git clone seu-repositorio
cd fresh-store
./docker-start.sh
```

✅ **Vantagens:** Controle total, melhor performance

### 🚀 Opção 2: Railway (Mais Fácil!)

```bash
# Instalar CLI
npm i -g @railway/cli

# Deploy
railway login
railway up
```

✅ **Vantagens:** Deploy automático, $5 crédito/mês, MongoDB incluído

### 📄 Opção 3: GitHub Pages + Backend Separado

- **Frontend** no GitHub Pages (grátis)
- **Backend** no Railway/Render/Heroku
- **MongoDB** no Atlas (grátis)

**Veja:** [GITHUB_PAGES.md](GITHUB_PAGES.md)

---

### Serviços Recomendados

| Componente | Serviço | Custo |
|------------|---------|-------|
| **Tudo em um** | Railway | $5/mês |
| **Tudo em um** | VPS + Docker | $5/mês |
| **Frontend** | GitHub Pages | Grátis |
| **Backend** | Railway/Render | $0-5/mês |
| **MongoDB** | MongoDB Atlas | Grátis (512MB) |

## 📚 Documentação

- **[🐳 Docker (Recomendado!)](DOCKER.md)** - Deploy com Docker
- **[🚀 Quick Start](QUICKSTART.md)** - Início rápido
- **[📄 GitHub Pages](GITHUB_PAGES.md)** - Deploy e limitações
- **[🔗 Integração Frontend ↔ Backend](INTEGRACAO_FRONTEND_BACKEND.md)**
- **[🧪 Como Testar Local](COMO_TESTAR_LOCAL.md)**
- **[🛠 Comandos Úteis](COMANDOS_UTEIS.md)**
- **[📖 Sistema Completo](SISTEMA_COMPLETO.md)**
- [Swagger API Docs](http://localhost:8000/docs)

## 🆕 Recursos

### Implementados ✅
- [x] Catálogo de produtos dinâmico
- [x] Sistema de carrinho
- [x] Simulador de frete (Haversine)
- [x] Autenticação JWT
- [x] Painel administrativo
- [x] CRUD completo de produtos
- [x] Upload de imagens (Base64)
- [x] Gestão de pedidos
- [x] Área do cliente
- [x] API REST completa
- [x] Banco de dados MongoDB
- [x] Busca e filtros de produtos

### Roadmap 🚀
- [ ] Pagamento online (Stripe/PagSeguro)
- [ ] Notificações por e-mail
- [ ] Chat de suporte
- [ ] Relatórios e analytics
- [ ] App mobile (React Native)
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Matheus Carvalho**
- GitHub: [@carvmatheus](https://github.com/carvmatheus)

## 🙏 Agradecimentos

- FastAPI pela excelente documentação
- MongoDB pela robustez
- Comunidade open source

---

**🌱 Da Horta Distribuidora - Fornecimento Profissional para Restaurantes**
