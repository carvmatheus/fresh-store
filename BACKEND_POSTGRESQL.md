# 🐘 Backend PostgreSQL - Guia Completo

## ✅ Mudanças Realizadas

O backend foi configurado para usar **PostgreSQL + Cloudinary** ao invés de MongoDB.

---

## 🔧 Arquivos Alterados

### Backend (`dahorta-backend`)

1. **`Dockerfile`** ✅
   - Mudado de `CMD ["python", "main.py"]` (MongoDB)
   - Para `CMD ["python", "main_sql.py"]` (PostgreSQL)
   - Usa `requirements_sql.txt` ao invés de `requirements.txt`

2. **`create_admin_sql.py`** ✅ NOVO
   - Script para criar usuário admin no PostgreSQL
   - Execute no Render Shell: `python create_admin_sql.py`

### Frontend (`fresh-store/docs`)

1. **`app.js`** ✅
   - Campo `image_url` ao invés de `image`
   - Campo `min_order` ao invés de `minOrder`

2. **`admin.js`** ✅
   - Formulário envia `image_url` e `min_order`
   - Leitura de dados usa campos do PostgreSQL

---

## 🚀 Como Fazer Deploy no Render

### 1. **Fazer Push das Mudanças**

```bash
# Backend
cd /Users/carvmatheus/Documents/Repositories/dahorta-backend
git add Dockerfile create_admin_sql.py
git commit -m "Fix: Configurar backend para PostgreSQL"
git push origin main

# Frontend
cd /Users/carvmatheus/Documents/Repositories/fresh-store
git add docs/app.js docs/admin.js BACKEND_POSTGRESQL.md
git commit -m "Fix: Ajustar frontend para PostgreSQL"
git push origin main
```

### 2. **Aguardar Deploy no Render**

O Render detecta mudanças automaticamente e faz o deploy:
- ⏱️ Tempo estimado: 3-5 minutos
- 🔍 Acompanhe em: https://dashboard.render.com/logs

### 3. **Criar Usuário Admin no PostgreSQL**

Após o deploy concluir:

1. Acesse https://dashboard.render.com
2. Entre no serviço `dahorta-backend`
3. Clique em **"Shell"** (ícone de terminal)
4. Execute:
   ```bash
   python create_admin_sql.py
   ```

5. Aguarde a confirmação:
   ```
   ✅ Usuário admin criado
   
   ========================================
   👤 CREDENCIAIS DE ACESSO:
   ========================================
      Usuário: admin
      Senha: admin123
      Email: admin@dahorta.com
      Role: admin
   ========================================
   ```

---

## 🔐 Como Fazer Login

1. **Acesse:** https://carvmatheus.github.io/fresh-store/login.html

2. **Digite as credenciais:**
   - Usuário: `admin`
   - Senha: `admin123`

3. **Clique:** "Entrar como Admin"

4. **✅ Sucesso!** Você será redirecionado para o painel admin

---

## 🧪 Testar se Está Funcionando

### 1. Verificar API

Abra: https://dahorta-backend.onrender.com/

Deve retornar:
```json
{
  "message": "Da Horta API v2.0",
  "database": "PostgreSQL",
  "storage": "Cloudinary",
  "docs": "/docs"
}
```

### 2. Verificar Produtos

Abra: https://dahorta-backend.onrender.com/api/products

Deve retornar lista de produtos com:
```json
[
  {
    "id": "uuid-aqui",
    "name": "Produto",
    "image_url": "https://...",  // ← PostgreSQL
    "min_order": 1,               // ← PostgreSQL
    ...
  }
]
```

### 3. Testar Login

```bash
curl -X POST https://dahorta-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Deve retornar:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "role": "admin",
    ...
  }
}
```

---

## 📊 Estrutura do PostgreSQL

### Tabelas

1. **`users`**
   - `id` (UUID)
   - `email` (String, unique)
   - `username` (String, unique)
   - `name` (String)
   - `role` (String: "admin" ou "cliente")
   - `company` (String, opcional)
   - `hashed_password` (String)
   - `is_active` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

2. **`products`**
   - `id` (UUID)
   - `name` (String)
   - `category` (String)
   - `price` (Decimal)
   - `unit` (String)
   - `min_order` (Integer) ← PostgreSQL usa min_order
   - `stock` (Integer)
   - `image_url` (Text) ← PostgreSQL usa image_url
   - `cloudinary_public_id` (String)
   - `description` (Text)
   - `is_active` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

3. **`orders`**
   - `id` (UUID)
   - `user_id` (UUID, FK)
   - `order_number` (String, unique)
   - `items` (JSONB)
   - `total` (Decimal)
   - `status` (String)
   - `delivery_address` (Text)
   - `delivery_date` (Date)
   - `notes` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

---

## 🔍 Variáveis de Ambiente (Render)

Certifique-se de que estas variáveis estão configuradas no Render:

```bash
# PostgreSQL (Render fornece automaticamente)
DATABASE_URL=postgresql://user:pass@host/database

# Cloudinary (você precisa criar conta em cloudinary.com)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# JWT
SECRET_KEY=sua-chave-secreta-aleatoria-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## 🐛 Troubleshooting

### ❌ Erro: "relation 'users' does not exist"

**Causa:** Tabelas não foram criadas no PostgreSQL

**Solução:** Execute o script de criação de admin (ele cria as tabelas):
```bash
python create_admin_sql.py
```

---

### ❌ Erro: "Could not connect to database"

**Causa:** URL do PostgreSQL incorreta

**Solução:** Verifique a variável `DATABASE_URL` no Render:
1. Dashboard → Environment
2. Copie a URL do PostgreSQL interno do Render
3. Formato: `postgresql://user:pass@host/database`

---

### ❌ Erro: "403 Forbidden" ao editar produtos

**Causa:** Usuário admin não existe ou não está logado

**Solução:**
1. Execute `python create_admin_sql.py` no Render Shell
2. Faça login com `admin` / `admin123`
3. Verifique o token no localStorage (F12 → Application → Local Storage)

---

### ❌ Imagens não aparecem

**Causa:** Cloudinary não configurado

**Solução:** Configure as variáveis do Cloudinary no Render:
1. Crie conta gratuita em https://cloudinary.com
2. Copie Cloud Name, API Key e API Secret
3. Adicione no Render → Environment

---

## ✅ Checklist Final

- [ ] Dockerfile atualizado para `main_sql.py`
- [ ] Git push feito no backend
- [ ] Deploy concluído no Render
- [ ] Variáveis de ambiente configuradas (DATABASE_URL, Cloudinary)
- [ ] Script `create_admin_sql.py` executado
- [ ] Admin criado com sucesso
- [ ] Login funciona com `admin/admin123`
- [ ] Frontend ajustado para `image_url` e `min_order`
- [ ] Git push feito no frontend
- [ ] Produtos aparecem corretamente
- [ ] Edição de produtos funciona sem erro 403

---

## 📞 Próximos Passos

**AGORA VOCÊ PRECISA:**

1. ✅ **Fazer git push** das mudanças
2. ⏱️ **Aguardar deploy** do Render (3-5 min)
3. 🔧 **Executar** `python create_admin_sql.py` no Shell do Render
4. 🔐 **Fazer login** com admin/admin123
5. ✨ **Testar** edição de produtos

**Está tudo pronto! Quer que eu faça o git push agora?**

