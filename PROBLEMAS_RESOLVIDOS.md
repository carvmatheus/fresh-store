# ✅ Problemas Resolvidos - Da Horta Distribuidora

## 🐛 Bugs Corrigidos

### 1. ❌ Imagens não apareciam
**Problema:** Backend usa MongoDB com campo `image`, mas frontend buscava `image_url` (PostgreSQL)

**Solução:** ✅ Corrigido em `app.js`, `cart.js` e `admin.js`
- Agora prioriza `image` (MongoDB) sobre `image_url` (PostgreSQL)
- Suporta ambos os formatos para compatibilidade futura

**Arquivos alterados:**
- `/docs/app.js` (linha 21)
- `/docs/admin.js` (linha 58, 133)
- `/docs/cart.js` (linha 53)

---

### 2. ❌ Carrinho não funcionava
**Problema:** IDs não eram normalizados para String, causando falhas de comparação

**Solução:** ✅ Todos os IDs agora são normalizados para String
- `addToCart()` - linha 208
- `updateQuantity()` - linha 250
- `removeFromCart()` - linha 277

**Funções corrigidas:**
- `addToCart(productId)` - normaliza ID antes de buscar
- `updateQuantity(productId, delta)` - normaliza ID antes de comparar
- `removeFromCart(productId)` - normaliza ID antes de filtrar

**Arquivos alterados:**
- `/docs/app.js` (linhas 204-246, 248-273, 275-281, 314-333)
- `/docs/cart.js` (linhas 51-69, 72-93, 95-103)

---

### 3. ❌ Campo minOrder inconsistente
**Problema:** MongoDB usa `minOrder`, PostgreSQL usa `min_order`

**Solução:** ✅ Código agora suporta ambos os formatos
```javascript
minOrder: p.minOrder || p.min_order || 1
```

**Arquivos alterados:**
- `/docs/app.js` (linha 19)
- `/docs/admin.js` (linha 59, 134, 183)

---

### 4. ❌ Erro "403 Forbidden" ao editar produtos
**Problema:** Usuário não estava autenticado como admin no backend

**Solução:** ✅ Adicionada verificação de autenticação na página admin
- Nova função `checkAdminAuth()` verifica token JWT e role
- Redireciona para login se não estiver autenticado
- Script `create_admin.py` criado para facilitar criação de usuário admin

**Arquivos criados:**
- `/dahorta-backend/create_admin.py` - Script para criar admin no MongoDB
- `/docs/COMO_CRIAR_ADMIN.md` - Guia completo de autenticação

**Arquivos alterados:**
- `/docs/admin.js` (linhas 8-27) - Verificação de autenticação

---

## 📦 Alterações por Arquivo

### `/docs/app.js`
```javascript
// ✅ Normalização de dados do backend
const normalized = productsData.map(p => ({
  id: String(p.id), // ← Garantir que ID é string
  minOrder: p.minOrder || p.min_order || 1, // ← Suportar ambos formatos
  image: p.image || p.image_url || 'placeholder', // ← Priorizar MongoDB
  // ... outros campos
}));

// ✅ Funções do carrinho corrigidas
function addToCart(productId) {
  const normalizedId = String(productId); // ← Normalizar ID
  const product = products.find(p => String(p.id) === normalizedId);
  // ...
}
```

### `/docs/cart.js`
```javascript
// ✅ Botões HTML com strings
<button onclick="updateQuantity('${item.id}', -1)">-</button>
<button onclick="removeItem('${item.id}')">Remover</button>

// ✅ Funções com normalização de ID
function updateQuantity(productId, delta) {
  const normalizedId = String(productId);
  const item = cart.find(i => String(i.id) === normalizedId);
  // ...
}
```

### `/docs/admin.js`
```javascript
// ✅ Verificação de autenticação
function checkAdminAuth() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('currentUser');
  
  if (!token || !user) {
    alert('Você precisa estar logado como administrador!');
    window.location.href = 'login.html';
    return false;
  }
  // ...
}

// ✅ Dados enviados no formato MongoDB
const formData = {
  minOrder: parseInt(value), // ← MongoDB usa minOrder
  image: imageValue,         // ← MongoDB usa image
  // ...
};
```

---

## 🎯 O que o Usuário Precisa Fazer Agora

### 1. **Criar Usuário Admin no Backend** (URGENTE!)

Você precisa executar o script no **Render.com** para criar o usuário admin:

**Passo a passo:**

1. Acesse https://render.com
2. Vá para o serviço `dahorta-backend`
3. Clique em **"Shell"** (terminal icon)
4. Execute:
   ```bash
   python create_admin.py
   ```
5. Aguarde a mensagem de sucesso com as credenciais

**Credenciais criadas:**
- **Usuário:** `admin`
- **Senha:** `admin123`
- **Email:** `admin@dahorta.com`
- **Role:** `admin`

---

### 2. **Fazer Login como Admin**

1. Vá para https://carvmatheus.github.io/fresh-store/login.html
2. Digite:
   - **Usuário:** `admin`
   - **Senha:** `admin123`
3. Clique em **"Entrar como Admin"**
4. Você será redirecionado para o painel admin

---

### 3. **Testar Edição de Produtos**

1. No painel admin, clique em **"Editar"** em qualquer produto
2. Faça uma alteração (ex: mudar o estoque)
3. Clique em **"Salvar Produto"**
4. ✅ Deve funcionar sem erro "403 Forbidden"

---

### 4. **Fazer Push das Mudanças** (Opcional)

Se quiser fazer commit das alterações:

```bash
cd /Users/carvmatheus/Documents/Repositories/fresh-store

# Adicionar arquivos alterados
git add docs/app.js docs/cart.js docs/admin.js
git add COMO_CRIAR_ADMIN.md PROBLEMAS_RESOLVIDOS.md

# Commit
git commit -m "Fix: Corrigir imagens, carrinho e autenticação admin"

# Push para GitHub
git push origin main
```

```bash
cd /Users/carvmatheus/Documents/Repositories/dahorta-backend

# Adicionar script de criação de admin
git add create_admin.py

# Commit
git commit -m "Add: Script para criar usuário admin"

# Push para GitHub
git push origin main
```

---

## 🧪 Como Verificar se Está Funcionando

### ✅ Checklist de Testes

- [ ] **Imagens aparecem** nos cards de produtos
- [ ] **Carrinho funciona** (adicionar, remover, alterar quantidade)
- [ ] **Admin criado** no MongoDB (via `create_admin.py`)
- [ ] **Login como admin** funciona sem erros
- [ ] **Editar produtos** funciona sem "403 Forbidden"
- [ ] **Token JWT** aparece no localStorage (F12 → Application → Local Storage)

### 🔍 Verificar Token JWT

Abra o console do navegador (F12) e execute:

```javascript
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', JSON.parse(localStorage.getItem('currentUser')));
```

Você deve ver:
```javascript
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // ← JWT válido
User: {
  id: "...",
  username: "admin",
  role: "admin",  // ← Importante!
  name: "Administrador Da Horta",
  // ...
}
```

---

## 📊 Status Atual

| Problema | Status | Arquivo | Linha |
|----------|--------|---------|-------|
| Imagens não aparecem | ✅ Resolvido | `app.js` | 21 |
| Carrinho não funciona | ✅ Resolvido | `app.js` | 204-333 |
| Campo minOrder | ✅ Resolvido | `app.js` | 19 |
| Erro 403 Forbidden | ⚠️ Pendente | `admin.js` | 8-27 |
| Admin não existe | ⚠️ Pendente | Backend | - |

**⚠️ AÇÃO NECESSÁRIA:** Executar `python create_admin.py` no Render.com

---

## 🆘 Problemas?

Leia o guia completo em: `COMO_CRIAR_ADMIN.md`

Se ainda tiver problemas, verifique:
1. Logs do Render (https://dashboard.render.com)
2. Console do navegador (F12)
3. Network tab (para ver requisições HTTP)


