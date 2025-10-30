# 🛠 Comandos Úteis - Da Horta Distribuidora

Guia rápido de comandos para desenvolvimento e manutenção.

## 🚀 Inicialização

### Backend
```bash
# Ativar ambiente virtual
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Inicializar banco de dados
python init_db.py

# Iniciar servidor
python main.py

# Ou com reload automático
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Servidor Python simples
cd docs
python3 -m http.server 8080

# Ou usando Node (se tiver)
npx serve docs -p 8080
```

## 💾 MongoDB

### Comandos básicos
```bash
# Conectar ao MongoDB
mongosh

# Ou mongo (versões antigas)
mongo

# Verificar conexão
mongosh --eval 'db.runCommand({ connectionStatus: 1 })'

# Ver bancos de dados
show dbs

# Usar banco da aplicação
use da_horta_db

# Ver coleções
show collections

# Ver usuários
db.users.find().pretty()

# Ver produtos
db.products.find().pretty()

# Ver pedidos
db.orders.find().pretty()

# Contar documentos
db.products.countDocuments()
db.users.countDocuments()
db.orders.countDocuments()

# Limpar coleção
db.products.deleteMany({})

# Apagar banco inteiro (CUIDADO!)
db.dropDatabase()
```

### Backup e Restore
```bash
# Backup completo
mongodump --db da_horta_db --out ./backup

# Restore
mongorestore --db da_horta_db ./backup/da_horta_db

# Backup específico
mongodump --db da_horta_db --collection products --out ./backup

# Restore específico
mongorestore --db da_horta_db --collection products ./backup/da_horta_db/products.bson
```

## 🔍 Depuração

### Ver logs do backend
```bash
# Com reload automático (modo debug)
cd backend
uvicorn main:app --reload --log-level debug
```

### Testar endpoints
```bash
# Health check
curl http://localhost:8000/health

# Listar produtos
curl http://localhost:8000/api/products

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Ver usuário atual (com token)
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Console do navegador
```javascript
// Ver produtos
api.getProducts().then(console.log)

// Fazer login
api.login('admin', 'admin123').then(console.log)

// Ver token
localStorage.getItem('auth_token')

// Ver usuário
localStorage.getItem('currentUser')

// Limpar dados
localStorage.clear()
```

## 🧪 Desenvolvimento

### Resetar banco de dados
```bash
cd backend
source venv/bin/activate
python init_db.py  # Apaga tudo e cria novamente
```

### Adicionar novos produtos
```python
# Editar backend/init_db.py e adicionar em products[]
{
    "name": "Novo Produto",
    "category": "categoria",
    "price": 10.0,
    "unit": "kg",
    "minOrder": 1,
    "stock": 100,
    "image": "images/novo-produto.jpg",
    "description": "Descrição",
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
    "is_active": True
}

# Depois rodar:
python init_db.py
```

### Testar localmente
```bash
# Terminal 1
cd backend && source venv/bin/activate && python main.py

# Terminal 2
cd docs && python3 -m http.server 8080

# Acessar
open http://localhost:8080
```

## 📦 Dependências

### Atualizar dependências Python
```bash
cd backend
source venv/bin/activate

# Ver dependências instaladas
pip list

# Ver dependências desatualizadas
pip list --outdated

# Atualizar pacote específico
pip install --upgrade fastapi

# Gerar requirements.txt atualizado
pip freeze > requirements.txt
```

### Instalar novos pacotes
```bash
pip install nome-do-pacote
pip freeze > requirements.txt  # Salvar no requirements
```

## 🧹 Limpeza

### Limpar cache Python
```bash
cd backend
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name '*.pyc' -delete
```

### Limpar localStorage (frontend)
```javascript
// Console do navegador
localStorage.clear()
sessionStorage.clear()
```

## 🔐 Segurança

### Gerar nova SECRET_KEY
```python
# Python
import secrets
print(secrets.token_urlsafe(32))
```

### Ver usuários no banco
```javascript
// MongoDB shell
use da_horta_db
db.users.find({}, {username: 1, email: 1, role: 1})
```

## 📊 Monitoramento

### Ver número de registros
```javascript
// MongoDB shell
db.products.countDocuments()
db.orders.countDocuments()
db.users.countDocuments()
```

### Ver últimos pedidos
```javascript
// MongoDB shell
db.orders.find().sort({created_at: -1}).limit(5).pretty()
```

### Ver produtos com estoque baixo
```javascript
// MongoDB shell
db.products.find({stock: {$lt: 50}}).pretty()
```

## 🚀 Deploy

### Preparar para produção
```bash
# Backend
cd backend
pip freeze > requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com dados de produção
```

### Deploy Backend (Heroku exemplo)
```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create fresh-store-api

# Adicionar MongoDB Atlas
heroku addons:create mongolab

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

## 🔧 Troubleshooting

### Porta em uso
```bash
# Ver processo usando porta 8000
lsof -i :8000

# Matar processo
kill -9 PID

# Ou usar outra porta
uvicorn main:app --port 8001
```

### MongoDB não inicia
```bash
# macOS
brew services restart mongodb-community

# Linux
sudo systemctl restart mongod

# Ver status
brew services list  # macOS
systemctl status mongod  # Linux
```

### Ambiente virtual corrompido
```bash
# Deletar e recriar
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

**💡 Dica:** Adicione estes comandos aos seus favoritos!

---

**🛠 Desenvolvido com ❤️ para facilitar sua vida!**

