# 🔗 Integração Frontend ↔ Backend

Guia completo para integrar o frontend (HTML/CSS/JS) com o backend (Python/FastAPI + MongoDB).

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Fluxo de Autenticação](#fluxo-de-autenticação)
4. [Carregar Produtos Dinamicamente](#carregar-produtos-dinamicamente)
5. [Sistema de Pedidos](#sistema-de-pedidos)
6. [Painel Admin](#painel-admin)

---

## 🎯 Visão Geral

### Antes (LocalStorage):
```
Frontend → localStorage → Frontend
```

### Agora (API):
```
Frontend → HTTP Request → Backend → MongoDB → Backend → HTTP Response → Frontend
```

---

## ⚙️ Configuração Inicial

### 1. Iniciar Backend

```bash
# Terminal 1 - Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
python main.py
```

Backend rodando em: **http://localhost:8000**

### 2. Configurar Frontend

Criar arquivo `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    TIMEOUT: 30000 // 30 segundos
};
```

### 3. Criar Cliente HTTP

Criar arquivo `docs/api-client.js`:

```javascript
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro na requisição');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        this.token = data.access_token;
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        this.token = data.access_token;
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
    }

    // Products
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/products?${params}`);
    }

    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    async getCategories() {
        return await this.request('/products/categories/list');
    }

    // Orders
    async getOrders(status = null) {
        const params = status ? `?status=${status}` : '';
        return await this.request(`/orders${params}`);
    }

    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrder(id) {
        return await this.request(`/orders/${id}`);
    }

    // Admin - Users
    async getUsers() {
        return await this.request('/users');
    }
}

// Instância global
const api = new ApiClient(API_CONFIG.BASE_URL);
```

---

## 🔐 Fluxo de Autenticação

### Login (`docs/login.html`)

Substituir o script por:

```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const result = await api.login(username, password);
        
        // Redirecionar baseado no role
        if (result.user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'cliente.html';
        }
    } catch (error) {
        showLoginError(error.message);
    }
});
```

---

## 📦 Carregar Produtos Dinamicamente

### Atualizar `docs/app.js`

Substituir a função `loadProductsFromStorage()`:

```javascript
// Carregar produtos da API
async function loadProductsFromAPI() {
    try {
        const productsData = await api.getProducts();
        console.log('✅ Produtos carregados da API:', productsData.length);
        return productsData;
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        return [];
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Carregar produtos da API
    products = await loadProductsFromAPI();
    
    loadCategories();
    loadProducts();
    loadCartFromStorage();
    updateCartUI();
    setupCEPMask();
});
```

### Atualizar HTML

Adicionar antes de `app.js`:

```html
<script src="config.js"></script>
<script src="api-client.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
```

---

## 🛒 Sistema de Pedidos

### Criar Pedido (`docs/cart.js`)

```javascript
async function finalizarPedido(e) {
    e.preventDefault();
    
    const orderData = {
        items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            image: item.image
        })),
        shipping_address: {
            street: document.getElementById('address').value,
            number: document.getElementById('number').value,
            complement: document.getElementById('complement').value,
            neighborhood: document.getElementById('neighborhood').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipcode: document.getElementById('zipcode').value
        },
        contact_info: {
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            name: document.getElementById('contactName').value
        },
        delivery_fee: deliveryFee,
        notes: document.getElementById('notes').value
    };
    
    try {
        const order = await api.createOrder(orderData);
        
        // Limpar carrinho
        cart = [];
        saveCartToStorage();
        
        // Mostrar sucesso
        showOrderSuccess(order);
    } catch (error) {
        alert('Erro ao criar pedido: ' + error.message);
    }
}
```

---

## ⚙️ Painel Admin

### Carregar Produtos (`docs/admin.js`)

```javascript
// Carregar produtos da API
async function loadProductsFromAPI() {
    try {
        allProducts = await api.getProducts();
        products = [...allProducts];
        console.log('✅ Produtos carregados:', products.length);
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        allProducts = [];
        products = [];
    }
}

// Criar produto
async function saveProduct() {
    const formData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        unit: document.getElementById('productUnit').value,
        minOrder: parseInt(document.getElementById('productMinOrder').value),
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value
    };
    
    try {
        if (currentEditId) {
            // Atualizar
            await api.updateProduct(currentEditId, formData);
            alert('Produto atualizado com sucesso!');
        } else {
            // Criar
            await api.createProduct(formData);
            alert('Produto criado com sucesso!');
        }
        
        // Recarregar lista
        await loadProductsFromAPI();
        loadProductsTable();
        closeProductModal();
    } catch (error) {
        alert('Erro ao salvar produto: ' + error.message);
    }
}

// Deletar produto
async function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    try {
        await api.deleteProduct(id);
        alert('Produto excluído com sucesso!');
        
        // Recarregar lista
        await loadProductsFromAPI();
        loadProductsTable();
    } catch (error) {
        alert('Erro ao excluir produto: ' + error.message);
    }
}
```

---

## 🔄 Atualização Completa

### Checklist de Migração

- [ ] Backend rodando (`http://localhost:8000`)
- [ ] MongoDB instalado e rodando
- [ ] `init_db.py` executado (dados iniciais)
- [ ] `config.js` criado no frontend
- [ ] `api-client.js` criado no frontend
- [ ] `app.js` atualizado para usar API
- [ ] `admin.js` atualizado para usar API
- [ ] `login.html` atualizado para usar API
- [ ] `cliente.js` atualizado para usar API
- [ ] Scripts incluídos em ordem correta no HTML

---

## 🧪 Testar Integração

### 1. Testar Backend
```bash
curl http://localhost:8000/health
# Resposta: {"status":"healthy"}
```

### 2. Testar Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Testar Produtos
```bash
curl http://localhost:8000/api/products
```

### 4. Abrir Frontend
```bash
cd docs
python3 -m http.server 8080
```

Acesse: http://localhost:8080

---

## 🚀 Deploy em Produção

### Backend
- Usar variáveis de ambiente
- Configurar CORS corretamente
- Usar MongoDB Atlas (cloud)
- Deploy em: Heroku, Railway, Render, AWS

### Frontend
- Atualizar `API_CONFIG.BASE_URL` para URL de produção
- Deploy em: Vercel, Netlify, GitHub Pages

---

## 📚 Recursos

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **MongoDB Compass**: Interface gráfica para MongoDB

---

## ❓ Troubleshooting

### CORS Error
- Verificar se backend está rodando
- Verificar URL em `config.js`
- Backend já está configurado para aceitar CORS

### Token Inválido
- Token expira em 7 dias
- Fazer login novamente
- Verificar localStorage (`auth_token`)

### Produtos não carregam
- Verificar console do navegador (F12)
- Verificar se backend está rodando
- Verificar se `init_db.py` foi executado

---

✅ **Sistema totalmente dinâmico e escalável!**

