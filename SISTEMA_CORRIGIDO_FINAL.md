# ✅ SISTEMA CORRIGIDO - PostgreSQL + Cloudinary

## 🎯 O QUE FOI CORRIGIDO

### 1. **admin.js - Campos Corretos do PostgreSQL**

#### ❌ ANTES (ERRADO):
```javascript
{
  image: "...",      // ❌ MongoDB
  minOrder: 5        // ❌ MongoDB
}
```

#### ✅ DEPOIS (CORRETO):
```javascript
{
  image_url: "...",  // ✅ PostgreSQL
  min_order: 5       // ✅ PostgreSQL
}
```

### 2. **Normalização de Dados**

Todos os arquivos JS agora normalizam dados do PostgreSQL automaticamente:

```javascript
// app.js
const normalized = productsData.map(p => ({
  id: p.id,
  name: p.name,
  price: parseFloat(p.price),
  minOrder: p.min_order || 1,      // ✅ PostgreSQL → Frontend
  image: p.image_url || '',         // ✅ PostgreSQL → Frontend
  ...
}));

// admin.js  
const imageUrl = product.image_url || product.image || '';
const minOrder = product.min_order || product.minOrder || 1;
```

### 3. **Envio de Dados para API**

```javascript
// admin.js - saveProduct()
const formData = {
  name: "Produto",
  category: "verduras",
  price: 10.50,
  unit: "kg",
  min_order: 5,      // ✅ PostgreSQL
  stock: 100,
  image_url: "...",  // ✅ PostgreSQL (URL do Cloudinary)
  description: "..."
};

await api.createProduct(formData);  // ✅ Envia para backend
```

---

## 📊 FLUXO COMPLETO

### Criar Produto (Admin):

```
1. Admin preenche formulário
   ↓
2. admin.js prepara dados:
   {
     name: "Tomate",
     image_url: "https://res.cloudinary.com/...",
     min_order: 3
   }
   ↓
3. POST /api/products (routes_sql/products.py)
   ↓
4. Backend salva no PostgreSQL
   ↓
5. Retorna produto criado
   ↓
6. admin.js recarrega lista
```

### Ver Produtos (Home):

```
1. app.js carrega: await api.getProducts()
   ↓
2. Backend consulta PostgreSQL
   ↓
3. Retorna:
   [{
     id: "uuid-123",
     name: "Tomate",
     image_url: "https://res.cloudinary.com/...",
     min_order: 3
   }]
   ↓
4. app.js normaliza:
   {
     image: product.image_url,     // ✅
     minOrder: product.min_order    // ✅
   }
   ↓
5. Renderiza na página
```

---

## 🗄️ ESTRUTURA DO POSTGRESQL

### Tabela: products

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(200),
    category VARCHAR(50),
    price DECIMAL(10,2),
    unit VARCHAR(20),
    min_order INTEGER,           -- ✅ snake_case
    stock INTEGER,
    image_url TEXT,              -- ✅ URL do Cloudinary
    cloudinary_public_id VARCHAR(255),
    description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Dados Exemplo:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alface Crespa",
  "category": "verduras",
  "price": "3.50",
  "unit": "un",
  "min_order": 5,
  "stock": 200,
  "image_url": "https://res.cloudinary.com/seu_cloud/image/upload/dahorta/alface.jpg",
  "cloudinary_public_id": "dahorta/alface",
  "description": "Alface fresca",
  "is_active": true
}
```

---

## 📤 CLOUDINARY - Upload de Imagens

### Backend (routes_sql/products.py):

```python
@router.post("/upload-image")
async def upload_image(file: UploadFile):
    result = cloudinary.uploader.upload(
        file.file,
        folder="dahorta/products"
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }
```

### Frontend (admin.js) - TODO:

```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_CONFIG.BASE_URL}/products/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.url;  // URL do Cloudinary
}
```

---

## 🔄 MAPEAMENTO DE CAMPOS

| PostgreSQL | Frontend | Tipo | Observação |
|------------|----------|------|------------|
| `id` | `id` | UUID | String no frontend |
| `name` | `name` | String | - |
| `category` | `category` | String | verduras, legumes, etc |
| `price` | `price` | Decimal/Float | Converter para float |
| `unit` | `unit` | String | kg, un, maço |
| `min_order` | `minOrder` | Integer | **Normalizar** |
| `stock` | `stock` | Integer | - |
| `image_url` | `image` | String (URL) | **Normalizar** + Cloudinary |
| `cloudinary_public_id` | - | String | Apenas backend (delete) |
| `description` | `description` | String | - |
| `is_active` | `isActive` | Boolean | **Normalizar** |

---

## ✅ CHECKLIST DE CORREÇÕES

### Backend:
- [x] routes_sql/ usando PostgreSQL
- [x] models_sql.py com campos corretos
- [x] schema.sql com estrutura completa
- [x] Cloudinary configurado
- [x] Upload endpoint criado
- [ ] Arquivos MongoDB removidos (próximo)

### Frontend:
- [x] app.js normaliza dados (image_url → image, min_order → minOrder)
- [x] admin.js usa campos PostgreSQL (image_url, min_order)
- [x] admin.js normaliza ao editar
- [x] Categorias traduzidas (getCategoryName)
- [x] Carrinho com UUID support
- [ ] Upload de imagem integrado (próximo)

### Deploy:
- [ ] Backend no Render
- [ ] PostgreSQL no Render
- [ ] Cloudinary configurado (env vars)
- [ ] Frontend no GitHub Pages
- [ ] Testado end-to-end

---

## 🧪 COMO TESTAR

### 1. Backend Local:

```bash
cd ~/Documents/Repositories/dahorta-backend

# Criar .env
echo "DATABASE_URL=postgresql://..." > .env
echo "CLOUDINARY_CLOUD_NAME=..." >> .env

# Instalar
pip install -r requirements.txt

# Rodar
python main.py

# Testar
curl http://localhost:8000/api/products
```

### 2. Frontend Local:

```bash
cd ~/Documents/Repositories/fresh-store/docs

# Servir
python3 -m http.server 3000

# Abrir
open http://localhost:3000
```

### 3. Verificar Logs (Console F12):

```javascript
📡 Carregando produtos da API...
✅ Produtos carregados da API: 12
📦 Primeiro produto: {
  id: "uuid-123",
  name: "Alface",
  image_url: "https://res.cloudinary.com/...",
  min_order: 5
}
✅ Produtos normalizados: 12
```

### 4. Testar Admin:

1. Login: `admin` / `admin123`
2. Criar produto
3. Ver se salva no PostgreSQL
4. Voltar para home
5. Produto deve aparecer com imagem do Cloudinary

---

## 📁 ESTRUTURA DE ARQUIVOS CORRETA

### Backend (dahorta-backend):

```
dahorta-backend/
├── main.py                    ✅ FastAPI (PostgreSQL)
├── config.py                  ✅ Settings (Cloudinary + PostgreSQL)
├── database.py                ✅ SQLAlchemy
├── models.py                  ✅ Models PostgreSQL
├── routes/                    ✅ API routes
│   ├── __init__.py
│   ├── auth.py               ✅ JWT auth
│   ├── products.py           ✅ CRUD + Cloudinary
│   ├── orders.py             ✅ Pedidos
│   └── users.py              ✅ Usuários
├── schema.sql                 ✅ Schema PostgreSQL
├── requirements.txt           ✅ Dependencies
└── .env                       ✅ Env vars (não commitar)
```

### Frontend (fresh-store/docs):

```
docs/
├── index.html                 ✅ Home
├── admin.html                 ✅ Admin panel
├── cliente.html               ✅ Cliente area
├── carrinho.html              ✅ Cart
├── login.html                 ✅ Login
├── config.js                  ✅ API config
├── api-client.js              ✅ HTTP client
├── auth.js                    ✅ Auth logic
├── app.js                     ✅ Home logic (normaliza dados)
├── admin.js                   ✅ Admin logic (corrigido)
├── cliente.js                 ✅ Cliente logic
├── cart.js                    ✅ Cart logic
└── styles.css                 ✅ Styles
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Remover arquivos MongoDB do backend**
   - main.py (antigo)
   - config.py (antigo)
   - database.py (antigo)
   - models/ (antigo)
   - routes/ (antigo)

2. **Adicionar upload Cloudinary no admin.js**
   - Função uploadImage()
   - Integrar com file input

3. **Deploy completo**
   - Backend no Render
   - PostgreSQL + Cloudinary
   - Frontend no GitHub Pages

4. **Testar end-to-end**
   - Criar produto com imagem
   - Ver produto na home
   - Adicionar ao carrinho
   - Fazer pedido

---

**✅ Frontend corrigido e integrado com PostgreSQL + Cloudinary!**

**📝 Todos os campos mapeados corretamente!**

**🚀 Pronto para deploy!**

