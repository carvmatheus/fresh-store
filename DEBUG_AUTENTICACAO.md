# 🐛 DEBUG - Erro de Autenticação

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1️⃣ **Verificar se o Backend está no ar**

Abra: https://dahorta-backend.onrender.com/

**Deve mostrar:**
```json
{
  "message": "Da Horta API v2.0",
  "database": "PostgreSQL",
  "storage": "Cloudinary"
}
```

❌ **Se não abrir:** O deploy ainda não terminou ou falhou
✅ **Se abrir:** Backend está funcionando

---

### 2️⃣ **Verificar se as tabelas foram criadas**

**No Shell do Render:**
```bash
python -c "from database_sql import test_connection; test_connection()"
```

**Deve mostrar:**
```
✅ PostgreSQL conectado
```

---

### 3️⃣ **Verificar se admin existe no banco**

**No Shell do Render:**
```bash
python -c "
from database_sql import get_db
from models_sql import User

db = next(get_db())
admin = db.query(User).filter(User.username == 'admin').first()

if admin:
    print('✅ Admin existe')
    print(f'Username: {admin.username}')
    print(f'Email: {admin.email}')
    print(f'Role: {admin.role}')
    print(f'Active: {admin.is_active}')
else:
    print('❌ Admin não existe!')
    print('Execute: python create_admin_sql.py')
"
```

---

### 4️⃣ **Criar admin (se não existir)**

**No Shell do Render:**
```bash
python create_admin_sql.py
```

---

### 5️⃣ **Testar login via API diretamente**

Abra o console do navegador (F12) e execute:

```javascript
// Testar login
fetch('https://dahorta-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Resposta do login:', data);
  
  if (data.access_token) {
    console.log('✅ Token recebido:', data.access_token);
    console.log('✅ Usuário:', data.user);
    
    // Salvar token
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    console.log('✅ Token salvo no localStorage');
  } else {
    console.error('❌ Erro:', data);
  }
})
.catch(error => {
  console.error('❌ Erro na requisição:', error);
});
```

---

### 6️⃣ **Verificar o token no localStorage**

Console do navegador (F12):

```javascript
// Ver token
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', JSON.parse(localStorage.getItem('currentUser')));

// Se tiver token, testar se é válido
const token = localStorage.getItem('auth_token');
if (token) {
  fetch('https://dahorta-backend.onrender.com/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Token válido! Usuário:', data);
  })
  .catch(error => {
    console.error('❌ Token inválido:', error);
  });
}
```

---

### 7️⃣ **Testar edição de produto**

Console do navegador (F12):

```javascript
const token = localStorage.getItem('auth_token');
const productId = '6903ea4d62a98e2fe061bc74'; // Substitua pelo ID real

fetch(`https://dahorta-backend.onrender.com/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stock: 999
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Produto atualizado:', data);
})
.catch(error => {
  console.error('❌ Erro ao atualizar:', error);
});
```

---

## 🔧 SOLUÇÕES PARA ERROS COMUNS

### ❌ Erro: "Could not validate credentials"

**Causa:** Token JWT inválido ou expirado

**Solução:**
```javascript
// Limpar tudo e fazer login novamente
localStorage.clear();
window.location.href = 'login.html';
```

---

### ❌ Erro: "Not authenticated"

**Causa:** Não está enviando o token no header

**Solução:** Verificar se o token está no localStorage:
```javascript
console.log(localStorage.getItem('auth_token'));
```

Se estiver vazio, faça login novamente.

---

### ❌ Erro: "403 Forbidden"

**Causa:** Usuário não é admin

**Solução:** Verificar role:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role:', user.role);
```

Deve ser `"admin"`. Se não for, o usuário não tem permissão.

---

### ❌ Erro: "User not found" ao fazer login

**Causa:** Admin não foi criado no banco

**Solução:** Execute no Shell do Render:
```bash
python create_admin_sql.py
```

---

### ❌ Erro: "Incorrect password"

**Causa:** Senha está errada

**Solução:** A senha correta é `admin123` (tudo minúsculo)

Se não funcionar, recrie o admin:
```bash
# No Shell do Render
python -c "
from database_sql import get_db
from models_sql import User

db = next(get_db())
db.query(User).filter(User.username == 'admin').delete()
db.commit()
print('Admin deletado')
"

python create_admin_sql.py
```

---

## 🔍 VERIFICAR LOGS DO RENDER

1. Acesse: https://dashboard.render.com
2. Entre no serviço `dahorta-backend`
3. Clique em **"Logs"**
4. Procure por:
   - `✅ PostgreSQL conectado`
   - Erros relacionados a autenticação
   - `401 Unauthorized` ou `403 Forbidden`

---

## 🧪 SCRIPT COMPLETO DE TESTE

Cole no console do navegador (F12):

```javascript
// SCRIPT DE DIAGNÓSTICO COMPLETO
console.clear();
console.log('🔍 INICIANDO DIAGNÓSTICO...\n');

// 1. Verificar backend
console.log('1️⃣ Verificando backend...');
fetch('https://dahorta-backend.onrender.com/')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend:', data);
  })
  .catch(() => console.error('❌ Backend offline'));

// 2. Verificar localStorage
console.log('\n2️⃣ Verificando localStorage...');
const token = localStorage.getItem('auth_token');
const user = localStorage.getItem('currentUser');

if (token) {
  console.log('✅ Token existe:', token.substring(0, 50) + '...');
} else {
  console.log('❌ Token não existe');
}

if (user) {
  const userData = JSON.parse(user);
  console.log('✅ Usuário:', userData.username);
  console.log('   Role:', userData.role);
} else {
  console.log('❌ Usuário não existe');
}

// 3. Testar login
console.log('\n3️⃣ Testando login...');
fetch('https://dahorta-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  if (data.access_token) {
    console.log('✅ Login funcionou!');
    console.log('   Token:', data.access_token.substring(0, 50) + '...');
    console.log('   User:', data.user.username, '- Role:', data.user.role);
    
    // Salvar
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    console.log('✅ Dados salvos no localStorage');
    
    // Testar token
    console.log('\n4️⃣ Testando token...');
    return fetch('https://dahorta-backend.onrender.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
  } else {
    console.error('❌ Login falhou:', data);
    throw new Error('Login falhou');
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Token válido! Usuário:', data.username);
  console.log('\n✅✅✅ AUTENTICAÇÃO FUNCIONANDO! ✅✅✅');
  console.log('\nAgora tente editar um produto no painel admin.');
})
.catch(error => {
  console.error('❌ Erro:', error);
  console.log('\n📞 PROBLEMAS ENCONTRADOS:');
  console.log('1. Admin não existe? Execute: python create_admin_sql.py');
  console.log('2. Senha errada? Use: admin123');
  console.log('3. Backend offline? Verifique Render logs');
});
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute cada item e marque ✅ ou ❌:

- [ ] Backend abre? (https://dahorta-backend.onrender.com/)
- [ ] Script `create_admin_sql.py` foi executado?
- [ ] Admin existe no banco? (verificar com query acima)
- [ ] Login via console funciona?
- [ ] Token é salvo no localStorage?
- [ ] Token é válido? (testar com `/api/auth/me`)
- [ ] Usuário tem role = "admin"?

---

## 🆘 SE NADA FUNCIONAR

**Execute estes comandos no Shell do Render:**

```bash
# 1. Deletar admin antigo (se existir)
python -c "
from database_sql import get_db
from models_sql import User

db = next(get_db())
admin = db.query(User).filter(User.username == 'admin').first()
if admin:
    db.delete(admin)
    db.commit()
    print('✅ Admin antigo deletado')
else:
    print('⚠️ Admin não existia')
"

# 2. Criar admin novo
python create_admin_sql.py

# 3. Verificar
python -c "
from database_sql import get_db
from models_sql import User

db = next(get_db())
admin = db.query(User).filter(User.username == 'admin').first()
print(f'Username: {admin.username}')
print(f'Role: {admin.role}')
print(f'Active: {admin.is_active}')
"
```

Depois:
1. Limpe o localStorage: `localStorage.clear()`
2. Recarregue a página: `location.reload()`
3. Faça login novamente: admin/admin123

---

## 💬 ME ENVIE ESTAS INFORMAÇÕES:

Execute no console (F12) e me envie o resultado:

```javascript
console.log('Backend:', await fetch('https://dahorta-backend.onrender.com/').then(r => r.json()));
console.log('Token:', localStorage.getItem('auth_token') ? 'Existe' : 'Não existe');
console.log('User:', localStorage.getItem('currentUser'));
```

E também:
- **Print dos logs do Render** (últimas 50 linhas)
- **Print do erro** que aparece ao tentar editar produto
- **O que acontece** quando você clica em "Salvar Produto"?

