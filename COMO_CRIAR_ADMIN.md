# 🔐 Como Criar Usuário Admin no Backend

## ⚠️ Problema: "Not authenticated" ao editar produtos

Você está recebendo erro `403 Forbidden` porque precisa estar **logado com um usuário administrador válido** no backend MongoDB.

---

## 🎯 Solução: Criar Usuário Admin no MongoDB

### **Opção 1: Via Render.com (Produção)** ⭐ RECOMENDADO

1. **Acesse o Render.com**
   - Faça login em https://render.com
   - Vá para o dashboard do seu serviço `dahorta-backend`

2. **Abra o Shell do Render**
   - No menu do serviço, clique em **"Shell"** (terminal icon)
   - Aguarde o shell carregar

3. **Execute o script para criar admin**
   ```bash
   python create_admin.py
   ```

4. **Aguarde a confirmação**
   ```
   ✅ Usuário admin criado com ID: ...
   
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

### **Opção 2: Via Código Local (Desenvolvimento)**

1. **Certifique-se de que o backend está rodando**
   ```bash
   cd /Users/carvmatheus/Documents/Repositories/dahorta-backend
   ```

2. **Execute o script localmente**
   ```bash
   python create_admin.py
   ```

3. **Alternativamente, rode o init_db.py completo**
   ```bash
   python init_db.py
   ```
   ⚠️ **ATENÇÃO**: Este script **apaga todos os dados** e recria o banco do zero!

---

## 🚀 Como Fazer Login como Admin

1. **Acesse a página de login**
   - URL: https://carvmatheus.github.io/fresh-store/login.html

2. **Use as credenciais do admin**
   - **Usuário:** `admin`
   - **Senha:** `admin123`

3. **Clique em "Entrar como Admin"** ou digite manualmente

4. **Você será redirecionado para o painel admin**
   - Agora você pode criar, editar e deletar produtos!

---

## 🔍 Verificar se Funcionou

### 1. **Verificar Token JWT**

Abra o console do navegador (F12) e execute:

```javascript
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', localStorage.getItem('currentUser'));
```

Você deve ver:
- ✅ `auth_token`: uma string longa (JWT)
- ✅ `currentUser`: objeto JSON com role = "admin"

### 2. **Testar Edição de Produto**

- Vá para o painel admin
- Clique em editar qualquer produto
- Faça uma alteração
- Clique em "Salvar Produto"
- ✅ Deve funcionar sem erro "403 Forbidden"

---

## 🐛 Troubleshooting

### ❌ Problema: "Script create_admin.py não encontrado"

**Solução:** Faça push do arquivo para o GitHub

```bash
cd /Users/carvmatheus/Documents/Repositories/dahorta-backend
git add create_admin.py
git commit -m "Add script to create admin user"
git push origin main
```

Aguarde o Render fazer o deploy (2-3 minutos) e tente novamente.

---

### ❌ Problema: "Usuário admin já existe"

**Solução:** O admin já foi criado! Apenas faça login:

1. Vá para https://carvmatheus.github.io/fresh-store/login.html
2. Use: `admin` / `admin123`
3. Clique em "Entrar como Admin"

---

### ❌ Problema: "MongoDB connection refused"

**Solução:** Verifique as variáveis de ambiente no Render

1. Acesse o dashboard do Render
2. Vá em **Environment**
3. Verifique se `MONGODB_URL` está configurada
4. A URL deve ser do MongoDB Atlas (não localhost)

Exemplo:
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/da_horta_db
```

---

### ❌ Problema: Ainda recebo "403 Forbidden" após login

**Solução:** Limpe o cache e faça login novamente

```javascript
// Execute no console do navegador (F12)
localStorage.clear();
window.location.reload();
```

Depois faça login novamente com `admin` / `admin123`

---

## 📝 Credenciais Padrão

### Admin:
- **Usuário:** admin
- **Senha:** admin123
- **Email:** admin@dahorta.com
- **Role:** admin

### Cliente (para testes):
- **Usuário:** cliente
- **Senha:** cliente123
- **Email:** cliente@restaurante.com
- **Role:** cliente

---

## ✅ Checklist Final

- [ ] Script `create_admin.py` executado no Render
- [ ] Admin criado com sucesso
- [ ] Login feito com credenciais `admin/admin123`
- [ ] Token JWT armazenado no localStorage
- [ ] Consegue editar produtos sem erro 403

---

## 🆘 Ainda com problemas?

Se ainda estiver com problemas, verifique os logs do Render:

1. Acesse o dashboard do Render
2. Clique em **Logs**
3. Procure por erros relacionados a MongoDB ou autenticação
4. Compartilhe os logs para análise


