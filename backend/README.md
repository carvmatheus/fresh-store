# Backend - Da Horta Distribuidora API

Backend em Python/FastAPI + MongoDB para o marketplace B2B de produtos frescos.

## 🛠 Tecnologias

- **Python 3.11+**
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono para MongoDB
- **JWT** - Autenticação via tokens
- **Pydantic** - Validação de dados
- **Uvicorn** - Servidor ASGI

## 📦 Instalação

### 1. Instalar MongoDB

#### macOS (Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### Windows:
Baixe o instalador oficial: https://www.mongodb.com/try/download/community

### 2. Criar ambiente virtual

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Edite `.env` e configure suas variáveis (opcional, as padrões já funcionam localmente).

### 5. Inicializar banco de dados

```bash
python init_db.py
```

Isso criará:
- ✅ Usuários admin e cliente
- ✅ 12 produtos de exemplo
- ✅ Índices do banco de dados

## 🚀 Rodar o servidor

```bash
# Modo desenvolvimento (com reload)
python main.py

# Ou usando uvicorn diretamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Servidor rodando em: **http://localhost:8000**

Documentação interativa: **http://localhost:8000/docs**

## 📚 Estrutura do Projeto

```
backend/
├── main.py              # Aplicação principal
├── config.py            # Configurações
├── database.py          # Conexão MongoDB
├── init_db.py           # Script de inicialização
├── requirements.txt     # Dependências
├── models/              # Modelos de dados
│   ├── user.py
│   ├── product.py
│   └── order.py
└── routes/              # Rotas da API
    ├── auth.py          # Autenticação
    ├── products.py      # Produtos (CRUD)
    ├── orders.py        # Pedidos
    └── users.py         # Usuários
```

## 🔐 Autenticação

### Registrar novo usuário
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "name": "Nome Completo",
  "password": "senha123",
  "role": "cliente",
  "company": "Nome da Empresa"
}
```

### Login
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

Retorna:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "admin@dahorta.com",
    "username": "admin",
    "name": "Administrador",
    "role": "admin"
  }
}
```

### Usar token

Adicione o header em todas as requisições autenticadas:
```
Authorization: Bearer {seu_token_aqui}
```

## 📡 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/{id}` - Obter produto
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/{id}` - Atualizar produto (admin)
- `DELETE /api/products/{id}` - Deletar produto (admin)
- `GET /api/products/categories/list` - Listar categorias

### Pedidos
- `GET /api/orders` - Listar meus pedidos
- `GET /api/orders/all` - Listar todos (admin)
- `GET /api/orders/{id}` - Obter pedido
- `POST /api/orders` - Criar pedido
- `PATCH /api/orders/{id}/status` - Atualizar status (admin)

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/{id}` - Obter usuário (admin)
- `DELETE /api/users/{id}` - Desativar usuário (admin)

## 🔥 Exemplos de Uso

### Listar produtos
```bash
curl http://localhost:8000/api/products
```

### Buscar produtos
```bash
# Por categoria
curl http://localhost:8000/api/products?category=verduras

# Por busca
curl http://localhost:8000/api/products?search=tomate
```

### Criar pedido
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "...",
        "name": "Tomate",
        "quantity": 5,
        "unit": "kg",
        "price": 8.9
      }
    ],
    "shipping_address": {
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipcode": "01234-567"
    },
    "contact_info": {
      "phone": "11999999999",
      "email": "contato@empresa.com",
      "name": "João Silva"
    },
    "delivery_fee": 15.00
  }'
```

## 🧪 Testar API

### Swagger UI (Recomendado)
Acesse: http://localhost:8000/docs

Interface interativa para testar todos os endpoints!

### ReDoc
Acesse: http://localhost:8000/redoc

Documentação alternativa da API.

## 👥 Credenciais Padrão

Após rodar `init_db.py`:

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

## 🐛 Troubleshooting

### MongoDB não conecta
```bash
# Verificar se está rodando
mongo --eval 'db.runCommand({ connectionStatus: 1 })'

# Iniciar serviço
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### Porta 8000 em uso
```bash
# Usar outra porta
uvicorn main:app --reload --port 8001
```

## 📝 Notas

- O banco MongoDB roda localmente na porta padrão `27017`
- As imagens são armazenadas como Base64 no banco
- JWT expira em 7 dias (configurável em `config.py`)
- Soft deletes são usados (is_active=False)

