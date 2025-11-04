# 🔍 DEBUG DO FLUXO - Da Horta

## 📊 FLUXO ATUAL (que DEVERIA funcionar):

```
1. Frontend → GET /api/products
2. Backend → SELECT * FROM products WHERE is_active = true
3. PostgreSQL → Retorna produtos com image_url
4. Backend → Formata JSON com URLs do Cloudinary
5. Frontend → Renderiza grade de produtos
```

---

## ❌ PROBLEMA ATUAL:

**Nenhum produto está aparecendo no frontend**

Isso significa que em algum ponto do fluxo está falhando.

---

## 🧪 TESTE PASSO A PASSO:

### **PASSO 1: Verificar se produtos existem no banco**

```bash
curl https://dahorta-backend.onrender.com/api/init/status
```

**Esperado:** `"products_count": 12` ou maior

**Se for 0:** Produtos não foram salvos no banco!

---

### **PASSO 2: Verificar se a rota /products funciona**

```bash
curl https://dahorta-backend.onrender.com/api/products
```

**Esperado:** Array JSON com produtos

**Se vazio []:** Banco está vazio ou filtro is_active está bloqueando

---

### **PASSO 3: Verificar se frontend está fazendo requisição**

Console do navegador (F12):

```javascript
fetch('https://dahorta-backend.onrender.com/api/products')
  .then(r => r.json())
  .then(data => console.log('Produtos:', data.length, data))
  .catch(e => console.error('Erro:', e));
```

**Esperado:** Array com produtos

---

## 🔧 SOLUÇÕES POSSÍVEIS:

### **Solução 1: Banco está vazio - Adicionar produtos**

```
https://dahorta-backend.onrender.com/api/init/seed-products
```

Isso adiciona 12 produtos de exemplo.

---

### **Solução 2: Produtos existem mas is_active = false**

SQL direto (se tiver acesso):

```sql
UPDATE products SET is_active = true;
```

Ou via endpoint:

```
https://dahorta-backend.onrender.com/api/init/activate-all-products
```

(Vou criar este endpoint)

---

### **Solução 3: Produtos foram deletados acidentalmente**

Recriar todos:

1. Deletar produtos antigos: `/api/init/clear-products`
2. Adicionar novos: `/api/init/seed-products`
3. Atualizar imagens: `/api/init/update-images`

---

## 📋 CHECKLIST DE DEBUG:

Execute cada URL e me diga o resultado:

- [ ] `/api/init/status` → Quantos produtos?
- [ ] `/api/products` → Retorna array vazio ou com produtos?
- [ ] `/api/init/check-images` → Lista produtos e URLs?
- [ ] Console do navegador → Fetch funciona?

---

## 🚀 AÇÃO IMEDIATA:

Execute estas URLs **NA ORDEM**:

1. **Status:** https://dahorta-backend.onrender.com/api/init/status
2. **Produtos:** https://dahorta-backend.onrender.com/api/products
3. **Imagens:** https://dahorta-backend.onrender.com/api/init/check-images

**Me mande o resultado de CADA UMA dessas URLs!**

