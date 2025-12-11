// ==================== SISTEMA DINÂMICO DE PRODUTOS (API) ====================
// Todos os produtos vêm da API backend

// Carregar produtos da API
async function loadProductsFromAPI() {
  try {
    console.log('📡 Carregando produtos da API...', API_CONFIG.BASE_URL);
    console.log('📡 URL completa:', API_CONFIG.BASE_URL + '/products');
    
    const productsData = await api.getProducts();
    
    console.log('✅ Produtos carregados da API:', productsData ? productsData.length : 0);
    console.log('📦 Dados brutos recebidos:', productsData);
    
    // Verificar se recebeu dados válidos
    if (!productsData || !Array.isArray(productsData)) {
      console.error('❌ Dados inválidos recebidos da API:', productsData);
      return [];
    }
    
    if (productsData.length === 0) {
      console.warn('⚠️ API retornou array vazio - nenhum produto cadastrado');
      return [];
    }
    
    console.log('📦 Primeiro produto RAW:', productsData[0]);
    
    // Normalizar dados: converter campos do PostgreSQL para formato esperado
    const normalized = productsData.map(p => {
      const normalizedProduct = {
        id: String(p.id), // Garantir que ID é string
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        unit: p.unit,
        minOrder: p.min_order || 1, // PostgreSQL usa min_order
        stock: p.stock,
        image: p.image_url || 'https://via.placeholder.com/400', // PostgreSQL usa image_url
        description: p.description || '',
        isPromo: p.is_promo === true, // Produto em promoção
        isActive: p.is_active !== false
      };
      
      console.log(`✓ Normalizado: ${normalizedProduct.name} - imagem: ${normalizedProduct.image}`);
      return normalizedProduct;
    });
    
    console.log('✅ Total de produtos normalizados:', normalized.length);
    console.log('📦 Primeiro produto NORMALIZADO:', normalized[0]);
    
    return normalized;
  } catch (error) {
    console.error('❌ ERRO ao carregar produtos da API:', error);
    console.error('❌ Tipo do erro:', error.name);
    console.error('❌ Mensagem:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ URL tentada:', API_CONFIG.BASE_URL + '/products');
    
    // Mostrar mensagem de erro na tela
    showErrorMessage('Erro ao carregar produtos. Verifique sua conexão e tente novamente.');
    
    return [];
  }
}

// Mostrar mensagem de erro
function showErrorMessage(message) {
  const container = document.getElementById('productsGrid');
  if (container) {
    container.innerHTML = `
      <div class="empty-products-state" style="grid-column: 1/-1;">
        <span class="empty-products-icon" style="font-size: 48px;">⚠️</span>
        <h3 style="color: #da3633;">Erro ao Carregar Produtos</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn-primary" style="margin-top: 16px;">
          🔄 Tentar Novamente
        </button>
      </div>
    `;
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
  console.log('🚀 Iniciando aplicação Da Horta...');
  console.log('🌐 Ambiente:', window.location.hostname);
  console.log('🔗 API URL:', API_CONFIG.BASE_URL);
  
  // Mostrar loading
  const container = document.getElementById('productsGrid');
  if (container) {
    container.innerHTML = `
      <div class="empty-products-state" style="grid-column: 1/-1;">
        <span class="empty-products-icon" style="font-size: 48px;">⏳</span>
        <h3>Carregando produtos...</h3>
        <p>Aguarde enquanto buscamos os produtos disponíveis.</p>
      </div>
    `;
  }
  
  // Carregar produtos da API
  console.log('📡 Iniciando carregamento de produtos...');
  products = await loadProductsFromAPI();
  console.log('✅ Carregamento concluído. Total:', products.length);
  
  // Carregar componentes
  loadCategories();
  loadPromotedProducts();
  loadProducts();
  loadCartFromStorage();
  updateCartUI();
  setupCEPMask();
  
  console.log('✅ Aplicação inicializada com sucesso!');
});

// Carregar produtos em destaque (apenas os marcados como promoção)
function loadPromotedProducts() {
  const container = document.getElementById('promotedGrid');
  if (!container) return;
  
  // Filtrar apenas produtos marcados como promoção
  const promoted = products.filter(p => p.isPromo === true);
  
  // Se não houver produtos em promoção, esconder a seção
  if (promoted.length === 0) {
    const section = container.closest('.promoted-section');
    if (section) section.style.display = 'none';
    return;
  }
  
  // Mostrar a seção caso tenha produtos
  const section = container.closest('.promoted-section');
  if (section) section.style.display = 'block';
  
  // Renderizar produtos em destaque com visual especial de promoção
  container.innerHTML = promoted.map(product => {
    // Calcular preço "original" fictício (30% maior) para mostrar desconto
    const originalPrice = (product.price * 1.3).toFixed(2);
    
    return `
    <div class="promo-card" onclick="addToCart('${product.id}')" style="cursor: pointer;" title="Clique para adicionar ao carrinho">
      <div class="promo-badge-tag">🔥 OFERTA</div>
      <img src="${product.image}" alt="${product.name}" class="promo-image" onerror="this.src='https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}'">
      <div class="promo-content">
        <div class="promo-header">
          <h3 class="promo-name">${product.name}</h3>
          <span class="promo-category">${getCategoryName(product.category)}</span>
        </div>
        <p class="promo-description">${product.description}</p>
        <div class="promo-pricing">
          <span class="promo-original-price">De: <s>R$ ${originalPrice}/${product.unit}</s></span>
          <div class="promo-current-price">
            <span class="promo-label">Por:</span>
            <span class="promo-value">R$ ${product.price.toFixed(2)}</span>
            <span class="promo-unit">/${product.unit}</span>
          </div>
        </div>
        <button class="promo-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
          🛒 Adicionar
        </button>
      </div>
    </div>
  `}).join('');
}

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
    <div class="product-card" data-product-id="${product.id}" style="cursor: pointer;" title="Clique para adicionar ao carrinho">
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
          <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.id}')">
            🛒 <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Adicionar event listeners aos cards após renderizar
  container.querySelectorAll('.product-card').forEach(card => {
    const productId = card.getAttribute('data-product-id');
    if (productId) {
      card.addEventListener('click', function(e) {
        // Não adicionar se clicou no botão (já tem stopPropagation)
        if (e.target.closest('.btn-add-cart')) {
          return;
        }
        addToCart(productId);
      });
    }
  });
}

// Renderizar produtos (alias para compatibilidade)
function renderProducts(productsList = null) {
  if (productsList) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = productsList.map(product => `
      <div class="product-card" data-product-id="${product.id}" style="cursor: pointer;" title="Clique para adicionar ao carrinho">
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
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.id}')">
              🛒 Adicionar
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Adicionar event listeners aos cards após renderizar
    container.querySelectorAll('.product-card').forEach(card => {
      const productId = card.getAttribute('data-product-id');
      if (productId) {
        card.addEventListener('click', function(e) {
          // Não adicionar se clicou no botão (já tem stopPropagation)
          if (e.target.closest('.btn-add-cart')) {
            return;
          }
          addToCart(productId);
        });
      }
    });
  }
}

// Adicionar ao carrinho
function addToCart(productId) {
  console.log('🛒 Tentando adicionar produto:', productId);
  
  // Normalizar productId para string
  const normalizedId = String(productId);
  
  const product = products.find(p => String(p.id) === normalizedId);
  if (!product) {
    console.error('❌ Produto não encontrado:', normalizedId);
    console.log('Produtos disponíveis:', products.map(p => ({ id: p.id, name: p.name })));
    alert('Produto não encontrado!');
    return;
  }
  
  console.log('✅ Produto encontrado:', product.name);
  
  const existingItem = cart.find(item => String(item.id) === normalizedId);
  
  if (existingItem) {
    existingItem.quantity += product.minOrder || 1;
    console.log('➕ Quantidade aumentada:', existingItem.quantity);
  } else {
    const cartItem = {
      ...product,
      id: normalizedId, // Garantir que é string para consistência
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
  const normalizedId = String(productId);
  const item = cart.find(i => String(i.id) === normalizedId);
  if (!item) return;
  
  const newQty = item.quantity + delta;
  
  if (newQty < (item.minOrder || 1)) {
    alert(`Quantidade mínima: ${item.minOrder || 1}`);
    return;
  }
  
  if (newQty > item.stock) {
    alert('Estoque insuficiente');
    return;
  }
  
  if (newQty === 0) {
    removeFromCart(normalizedId);
  } else {
    item.quantity = newQty;
    saveCartToStorage();
    updateCartUI();
  }
}

// Remover do carrinho
function removeFromCart(productId) {
  const normalizedId = String(productId);
  cart = cart.filter(item => String(item.id) !== normalizedId);
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
            <button class="btn-remove" onclick="removeFromCart('${item.id}')">Remover</button>
          </div>
          <p class="cart-item-details">R$ ${item.price.toFixed(2)} / ${item.unit}</p>
          <div class="cart-item-actions">
            <div class="qty-controls">
              <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
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

// Ir para home
function goToHome() {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();
  
  // Se já estiver na index.html, recarregar a página
  if (currentFile === 'index.html' || currentFile === '' || currentFile === 'docs/') {
    window.location.reload();
  } else {
    // Redirecionar para index.html
    window.location.href = 'index.html';
  }
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
  const cepInput = document.getElementById('cep');
  const cep = cepInput.value.replace(/\D/g, '');
  const errorDiv = document.getElementById('deliveryError');
  const resultDiv = document.getElementById('deliveryResult');
  const btnCalculate = document.getElementById('btnCalculate');
  
  // Esconder erros anteriores
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
  if (resultDiv) {
    resultDiv.classList.add('hidden');
  }
  
  // Validar CEP
  if (cep.length !== 8) {
    if (errorDiv) {
      const errorMessage = document.getElementById('errorMessage');
      if (errorMessage) {
        errorMessage.textContent = 'Por favor, digite um CEP válido (8 dígitos)';
      }
      errorDiv.classList.remove('hidden');
    } else {
      alert('Por favor, digite um CEP válido');
    }
    return;
  }
  
  // Desabilitar botão durante cálculo
  if (btnCalculate) {
    btnCalculate.disabled = true;
    btnCalculate.textContent = 'Calculando...';
  }
  
  // Simular delay de cálculo (opcional)
  setTimeout(() => {
    // Simulação baseada no CEP
    const cepNum = parseInt(cep.substring(0, 5));
    const baseCep = 12000;
    const distance = Math.abs(cepNum - baseCep) / 100;
    
    // Calcular taxa de entrega
    let deliveryFee = 0;
    let estimatedTime = '30-45 min';
    
    if (distance <= 10) {
      deliveryFee = 0;
      estimatedTime = '30-45 min';
    } else if (distance <= 20) {
      deliveryFee = 15;
      estimatedTime = '45-60 min';
    } else if (distance <= 30) {
      deliveryFee = 25;
      estimatedTime = '60-90 min';
    } else {
      deliveryFee = 35;
      estimatedTime = '90-120 min';
    }
    
    // Calcular prazo de entrega
    let deliveryDays = 1;
    if (distance > 50) deliveryDays = 2;
    if (distance > 100) deliveryDays = 3;
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    // Valor mínimo do pedido
    const minOrderValue = distance <= 20 ? 100 : 150;
    
    // Atualizar resultados
    const distanceEl = document.getElementById('distance');
    const timeEl = document.getElementById('time');
    const feeEl = document.getElementById('fee');
    const minOrderEl = document.getElementById('minOrder');
    const freeShippingEl = document.getElementById('freeShipping');
    
    if (distanceEl) distanceEl.textContent = `${distance.toFixed(1)} km`;
    if (timeEl) timeEl.textContent = estimatedTime;
    if (feeEl) {
      feeEl.textContent = deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`;
    }
    if (minOrderEl) minOrderEl.textContent = `R$ ${minOrderValue.toFixed(2)}`;
    
    // Mostrar/ocultar frete grátis
    if (freeShippingEl) {
      if (deliveryFee === 0) {
        freeShippingEl.classList.remove('hidden');
      } else {
        freeShippingEl.classList.add('hidden');
      }
    }
    
    // Mostrar resultado
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
    }
    
    // Reabilitar botão
    if (btnCalculate) {
      btnCalculate.disabled = false;
      btnCalculate.textContent = 'Calcular Frete';
    }
  }, 500); // Simular delay de 500ms
}
