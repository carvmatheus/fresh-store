// ==================== SISTEMA DINÂMICO DE PRODUTOS (API) ====================
// Todos os produtos vêm da API backend

// Carregar produtos da API
async function loadProductsFromAPI() {
  try {
    console.log('📡 Carregando produtos da API...', API_CONFIG.BASE_URL);
    const productsData = await api.getProducts();
    console.log('✅ Produtos carregados da API:', productsData.length);
    console.log('📦 Primeiro produto:', productsData[0]);
    
    // Normalizar dados: converter campos do PostgreSQL para formato esperado
    const normalized = productsData.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      unit: p.unit,
      minOrder: p.min_order || 1,
      stock: p.stock,
      image: p.image_url || p.image || 'https://via.placeholder.com/400',
      description: p.description || '',
      isActive: p.is_active !== false
    }));
    
    console.log('✅ Produtos normalizados:', normalized.length);
    return normalized;
  } catch (error) {
    console.error('❌ Erro ao carregar produtos da API:', error);
    console.error('URL tentada:', API_CONFIG.BASE_URL + '/products');
    
    // Fallback: tentar localStorage (compatibilidade temporária)
    const adminProducts = localStorage.getItem('adminProducts');
    if (adminProducts) {
      console.log('⚠️ Usando produtos do localStorage (fallback)');
      return JSON.parse(adminProducts);
    }
    return [];
  }
}

// Produtos dinâmicos (carregados da API)
let products = [];

const categories = [
  { id: "all", name: "Todos os Produtos" },
  { id: "verduras", name: "Verduras" },
  { id: "legumes", name: "Legumes" },
  { id: "frutas", name: "Frutas" },
  { id: "temperos", name: "Temperos" },
  { id: "graos", name: "Grãos e Cereais" }
];

// Traduzir categoria para nome legível
function getCategoryName(categoryId) {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.name : categoryId;
}

// Estado da aplicação
let cart = [];
let selectedCategory = "all";
let searchQuery = '';

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

// Carregar categorias
function loadCategories() {
  const container = document.getElementById('categories');
  container.innerHTML = categories.map(cat => `
    <button 
      class="category-btn ${cat.id === selectedCategory ? 'active' : ''}" 
      onclick="filterCategory('${cat.id}')"
    >
      ${cat.name}
    </button>
  `).join('');
}

// Filtrar por categoria
function filterCategory(categoryId) {
  selectedCategory = categoryId;
  loadCategories();
  loadProducts();
}

// Buscar produtos
function handleSearch(query) {
  searchQuery = query.toLowerCase().trim();
  loadProducts();
}

// Carregar produtos
function loadProducts() {
  const container = document.getElementById('productsGrid');
  
  // Verificar se há produtos
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-products-state">
        <span class="empty-products-icon">📦</span>
        <h3>Nenhum produto cadastrado</h3>
        <p>Acesse o painel de administração para adicionar produtos ao catálogo.</p>
        <a href="login.html" class="btn-primary">Ir para Login</a>
      </div>
    `;
    return;
  }
  
  let filtered = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);
  
  // Aplicar busca se houver
  if (searchQuery) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery)
    );
  }
  
  // Se não houver resultados após filtrar
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-products-state">
        <span class="empty-products-icon">🔍</span>
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar os filtros ou busca.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}'">
      <div class="product-content">
        <div class="product-header">
          <h4 class="product-name">${product.name}</h4>
          <span class="product-badge">${getCategoryName(product.category)}</span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-meta">
          📦 Estoque: ${product.stock} ${product.unit}
        </div>
        ${product.minOrder > 1 ? `
          <div class="product-min">
            Pedido mínimo: ${product.minOrder} ${product.unit}
          </div>
        ` : ''}
        <div class="product-footer">
          <div class="product-price">
            <span class="price-label">R$</span>
            <span class="price-value">${product.price.toFixed(2)}</span>
            <span class="price-unit">/${product.unit}</span>
          </div>
          <button class="btn-add-cart" onclick="addToCart('${product.id}')">
            🛒 <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Renderizar produtos (alias para compatibilidade)
function renderProducts(productsList = null) {
  if (productsList) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = productsList.map(product => `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}'">
        <div class="product-content">
          <div class="product-header">
            <h4 class="product-name">${product.name}</h4>
            <span class="product-badge">${getCategoryName(product.category)}</span>
          </div>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <div class="product-price">
              <span>R$ ${product.price.toFixed(2)}/${product.unit}</span>
            </div>
            <button class="btn-add-cart" onclick="addToCart('${product.id}')">
              🛒 Adicionar
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Adicionar ao carrinho
function addToCart(productId) {
  console.log('🛒 Tentando adicionar produto:', productId);
  
  const product = products.find(p => p.id === productId || p.id === String(productId));
  if (!product) {
    console.error('❌ Produto não encontrado:', productId);
    console.log('Produtos disponíveis:', products.map(p => p.id));
    alert('Produto não encontrado!');
    return;
  }
  
  console.log('✅ Produto encontrado:', product.name);
  
  const existingItem = cart.find(item => item.id === productId || item.id === String(productId));
  
  if (existingItem) {
    existingItem.quantity += product.minOrder || 1;
    console.log('➕ Quantidade aumentada:', existingItem.quantity);
  } else {
    const cartItem = {
      ...product,
      id: String(product.id), // Garantir que é string para consistência
      quantity: product.minOrder || 1
    };
    cart.push(cartItem);
    console.log('➕ Produto adicionado ao carrinho:', cartItem);
  }
  
  saveCartToStorage();
  updateCartUI();
  
  console.log('🛒 Carrinho atual:', cart.length, 'itens');
  
  // Feedback visual
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.style.transform = 'scale(1.3)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
  }
}

// Atualizar quantidade
function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  const newQty = item.quantity + delta;
  
  if (newQty < item.minOrder) {
    alert(`Quantidade mínima: ${item.minOrder}`);
    return;
  }
  
  if (newQty > item.stock) {
    alert('Estoque insuficiente');
    return;
  }
  
  if (newQty === 0) {
    removeFromCart(productId);
  } else {
    item.quantity = newQty;
    saveCartToStorage();
    updateCartUI();
  }
}

// Remover do carrinho
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
}

// Atualizar UI do carrinho
function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const content = document.getElementById('cartContent');
  const footer = document.getElementById('cartFooter');
  const emptyCart = document.getElementById('emptyCart');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (badge) {
    badge.textContent = totalItems;
  }
  
  // Se não estiver na página principal, sai
  if (!content) return;
  
  if (cart.length === 0) {
    if (emptyCart) emptyCart.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    content.innerHTML = `
      <div class="empty-cart">
        <span class="empty-icon">🛒</span>
        <p>Seu carrinho está vazio</p>
        <p class="empty-text">Adicione produtos para começar seu pedido</p>
      </div>
    `;
  } else {
    if (emptyCart) emptyCart.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');
    
    content.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80?text=${encodeURIComponent(item.name)}'">
        <div class="cart-item-content">
          <div class="cart-item-header">
            <h4 class="cart-item-name">${item.name}</h4>
            <button class="btn-remove" onclick="removeFromCart(${item.id})">Remover</button>
          </div>
          <p class="cart-item-details">R$ ${item.price.toFixed(2)} / ${item.unit}</p>
          <div class="cart-item-actions">
            <div class="qty-controls">
              <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <span class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    const totalElement = document.getElementById('cartTotal');
    if (totalElement) {
      totalElement.textContent = `R$ ${totalValue.toFixed(2)}`;
    }
  }
}

// Toggle carrinho lateral
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  
  // Fechar menu se estiver aberto
  if (menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
  }
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  }
}

// Toggle menu hamburguer
function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  
  // Fechar carrinho se estiver aberto
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
  
  if (menu && overlay) {
    menu.classList.toggle('open');
    overlay.classList.toggle('show');
  }
}

// Fechar overlays ao clicar fora
function closeOverlays() {
  const sidebar = document.getElementById('cartSidebar');
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  
  if (sidebar) sidebar.classList.remove('open');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

// LocalStorage
function saveCartToStorage() {
  localStorage.setItem('freshStoreCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('freshStoreCart');
  if (saved) {
    cart = JSON.parse(saved);
  }
}

// Simulador de entrega
function setupCEPMask() {
  const input = document.getElementById('cep');
  if (!input) return;
  
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5, 8);
    }
    e.target.value = value;
  });
}

function calculateDelivery() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    alert('Por favor, digite um CEP válido');
    return;
  }
  
  // Simulação baseada no CEP
  const distance = Math.abs(parseInt(cep.substring(0, 5)) - 12000) / 100;
  const baseFee = 15;
  const deliveryFee = baseFee + (distance * 2);
  
  let deliveryDays = 1;
  if (distance > 50) deliveryDays = 2;
  if (distance > 100) deliveryDays = 3;
  
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  
  const result = document.getElementById('deliveryResult');
  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="result-item">
      <span class="result-label">Taxa de Entrega:</span>
      <span class="result-value">R$ ${deliveryFee.toFixed(2)}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Prazo:</span>
      <span class="result-value">${deliveryDays} ${deliveryDays === 1 ? 'dia útil' : 'dias úteis'}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Previsão:</span>
      <span class="result-value">${deliveryDate.toLocaleDateString('pt-BR')}</span>
    </div>
  `;
}
