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
        promoPrice: p.promo_price ? parseFloat(p.promo_price) : null, // Preço promocional
        unit: p.unit,
        minOrder: p.min_order || 1, // PostgreSQL usa min_order
        stock: p.stock,
        image: p.image_url || 'https://via.placeholder.com/400', // PostgreSQL usa image_url
        description: p.description || '',
        isPromo: p.is_promo === true, // Produto em promoção
        displayOrder: p.display_order || 0, // Ordem de exibição
        isActive: p.is_active !== false
      };
      
      console.log(`✓ Normalizado: ${normalizedProduct.name} - imagem: ${normalizedProduct.image}${normalizedProduct.isPromo ? ` - PROMO: R$${normalizedProduct.promoPrice}` : ''}`);
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
  { id: "all", name: "Todos", icon: "todos" },
  { id: "ofertas", name: "Ofertas", icon: "ofertas" },
  { id: "vegetais", name: "Vegetais", icon: "vegetais" },
  { id: "frutas", name: "Frutas", icon: "frutas" },
  { id: "verduras", name: "Verduras", icon: "verduras" },
  { id: "exoticos", name: "Exóticos", icon: "exoticos" },
  { id: "granjeiro", name: "Granjeiro", icon: "granjeiro" },
  { id: "processados", name: "Processados", icon: "processados" },
  { id: "outros", name: "Outros", icon: "graos" }
];

// Caminho dos ícones SVG das categorias
const ICONS_PATH = 'images/icons/';

// Traduzir categoria para nome legível
function getCategoryName(categoryId) {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.name : categoryId;
}

// Estado da aplicação
let cart = [];
let selectedCategory = 'all'; // 'all' = mostra todos os produtos
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
  initCarousel(); // Inicializar carrossel de promoções
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
  
  // Filtrar apenas produtos marcados como promoção e ordenar por display_order
  const promoted = products
    .filter(p => p.isPromo === true)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  
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
    // Usar preço promocional real ou calcular desconto fictício
    const originalPrice = product.price.toFixed(2);
    const promoPrice = product.promoPrice ? product.promoPrice.toFixed(2) : (product.price * 0.9).toFixed(2);
    const discountPercent = product.promoPrice 
      ? Math.round((1 - product.promoPrice / product.price) * 100) 
      : 10;
    
    return `
    <div class="promo-card" onclick="addToCart('${product.id}', event)" style="cursor: pointer;" title="Clique para adicionar ao carrinho">
      <div class="promo-badge-tag">🔥 Oferta</div>
      <img src="${product.image}" alt="${product.name}" class="promo-image" onerror="this.src='https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}'">
      <div class="promo-content">
        <div class="promo-header">
          <h3 class="promo-name">${product.name}</h3>
          <span class="promo-category">${getCategoryName(product.category)}</span>
        </div>
        <p class="promo-description">${product.description}</p>
        <div class="promo-pricing">
          <div class="promo-original-price">De: <s>R$ ${originalPrice}/${product.unit}</s></div>
          <div class="promo-current-price">
            <span class="promo-label">Por:</span>
            <span class="promo-value">R$ ${promoPrice}</span>
            <span class="promo-unit">/${product.unit}</span>
          </div>
        </div>
        <button class="promo-btn" onclick="event.stopPropagation(); addToCart('${product.id}', event)">
          🛒 Adicionar
        </button>
      </div>
    </div>
  `}).join('');
}

// Carregar categorias
function loadCategories() {
  const container = document.getElementById('categories');
  if (!container) return;
  
  container.innerHTML = categories.map(cat => `
    <div class="category-item ${cat.id === selectedCategory || (selectedCategory === null && cat.id === 'all') ? 'active' : ''}" onclick="filterCategory('${cat.id}')">
      <div class="category-icon">
        <img src="${ICONS_PATH}${cat.icon}.svg" alt="${cat.name}" class="category-svg-icon">
      </div>
      <span class="category-name">${cat.name}</span>
    </div>
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
  
  let filtered;
  
  // Filtrar por categoria
  if (!selectedCategory || selectedCategory === 'all') {
    filtered = products;
  } else if (selectedCategory === 'ofertas') {
    // Ofertas = produtos em promoção
    filtered = products.filter(p => p.isPromo === true);
  } else {
    // Filtrar por categoria (comparar com a categoria do produto)
    filtered = products.filter(p => 
      p.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  
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
  
  container.innerHTML = filtered.map(product => {
    // Verificar se tem preço promocional
    const hasPromo = product.isPromo && product.promoPrice;
    const displayPrice = hasPromo ? product.promoPrice : product.price;
    const discountPercent = hasPromo ? Math.round((1 - product.promoPrice / product.price) * 100) : 0;
    
    return `
    <div class="product-card ${hasPromo ? 'has-promo' : ''}" data-product-id="${product.id}" style="cursor: pointer;" title="Clique para adicionar ao carrinho">
      ${hasPromo ? `<div class="product-promo-badge">🔥 Oferta</div>` : ''}
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
            <div class="price-original-line">${hasPromo ? `De: <s>${product.price.toFixed(2)}/${product.unit}</s>` : ''}</div>
            <div class="price-current ${hasPromo ? 'promo-price' : ''}">
            <span class="price-label">R$</span>
              <span class="price-value">${displayPrice.toFixed(2)}</span>
            <span class="price-unit">/${product.unit}</span>
            </div>
          </div>
          <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.id}', event)">
            🛒 <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  `}).join('');
  
  // Adicionar event listeners aos cards após renderizar
  container.querySelectorAll('.product-card').forEach(card => {
    const productId = card.getAttribute('data-product-id');
    if (productId) {
      card.addEventListener('click', function(e) {
        // Não adicionar se clicou no botão (já tem stopPropagation)
        if (e.target.closest('.btn-add-cart')) {
          return;
        }
        addToCart(productId, e);
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

// Adicionar ao carrinho com animação fly-to-cart e feedback tátil
function addToCart(productId, event) {
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
  
  // Efeito ripple no elemento clicado
  if (event && event.target) {
    createRipple(event);
  }
  
  // Animação fly-to-cart
  flyToCart(event, product.image);
  
  const existingItem = cart.find(item => String(item.id) === normalizedId);
  
  if (existingItem) {
    existingItem.quantity += product.minOrder || 1;
    console.log('➕ Quantidade aumentada:', existingItem.quantity);
  } else {
    const cartItem = {
      ...product,
      id: normalizedId,
      quantity: product.minOrder || 1
    };
    cart.push(cartItem);
    console.log('➕ Produto adicionado ao carrinho:', cartItem);
  }
  
  saveCartToStorage();
  updateCartUI();
  
  console.log('🛒 Carrinho atual:', cart.length, 'itens');
  
  // Feedback visual completo
  feedbackAddToCart(product.name);
}

// Toast notification de sucesso
function showToast(message, icon = '✓') {
  // Remover toast anterior se existir
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  
  // Mostrar com animação
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Remover após 2.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Feedback completo ao adicionar ao carrinho
function feedbackAddToCart(productName) {
  // 1. Toast notification
  showToast(`${productName} adicionado!`, '🛒');
  
  // 2. Shake no botão do carrinho
  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.classList.add('cart-shake');
    setTimeout(() => cartBtn.classList.remove('cart-shake'), 500);
  }
  
  // 3. Pulse no badge
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.classList.add('success-pulse');
    badge.style.transform = 'scale(1.5)';
    badge.style.background = '#ef4444';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
      badge.style.background = '';
      badge.classList.remove('success-pulse');
    }, 400);
  }
  
  // 4. Vibração (se suportado)
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50]);
  }
}

// Efeito ripple nos cliques
function createRipple(event) {
  const button = event.currentTarget || event.target.closest('button, .promo-card, .product-card');
  if (!button) return;
  
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (event.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (event.clientY - rect.top - size/2) + 'px';
  
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// Animação fly-to-cart
function flyToCart(event, imageUrl) {
  const cartBtn = document.querySelector('.cart-btn');
  if (!cartBtn) return;
  
  // Pegar posição do clique ou do elemento
  let startX, startY;
  if (event && event.clientX) {
    startX = event.clientX;
    startY = event.clientY;
  } else if (event && event.target) {
    const rect = event.target.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else {
    return; // Não conseguiu pegar posição
  }
  
  // Posição do carrinho
  const cartRect = cartBtn.getBoundingClientRect();
  const endX = cartRect.left + cartRect.width / 2;
  const endY = cartRect.top + cartRect.height / 2;
  
  // Criar elemento que vai voar
  const flyingItem = document.createElement('div');
  flyingItem.className = 'flying-item';
  flyingItem.innerHTML = imageUrl 
    ? `<img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : '🛒';
  
  flyingItem.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transform: translate(-50%, -50%) scale(1);
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    overflow: hidden;
  `;
  
  document.body.appendChild(flyingItem);
  
  // Animar para o carrinho
  requestAnimationFrame(() => {
    flyingItem.style.left = `${endX}px`;
    flyingItem.style.top = `${endY}px`;
    flyingItem.style.transform = 'translate(-50%, -50%) scale(0.2)';
    flyingItem.style.opacity = '0.5';
  });
  
  // Remover após animação
  setTimeout(() => {
    flyingItem.remove();
  }, 600);
}

// ========== CARROSSEL DE PROMOÇÕES ==========
let carouselInterval = null;
let carouselPaused = false;

function initCarousel() {
  const carousel = document.getElementById('promotedCarousel');
  if (!carousel) {
    console.log('⚠️ Carrossel não encontrado');
    return;
  }
  
  console.log('🎠 Carrossel inicializado');
  
  // Auto-scroll a cada 3 segundos
  carouselInterval = setInterval(() => {
    if (!carouselPaused) {
      moveCarousel(1, true); // true = automático (volta ao início quando chega no final)
    }
  }, 3000);
  
  // Pausar quando mouse estiver sobre o carrossel
  carousel.addEventListener('mouseenter', () => {
    carouselPaused = true;
    console.log('⏸️ Carrossel pausado');
  });
  carousel.addEventListener('mouseleave', () => {
    carouselPaused = false;
    console.log('▶️ Carrossel retomado');
  });
  
  // Pausar quando tocar (mobile)
  carousel.addEventListener('touchstart', () => carouselPaused = true, { passive: true });
  carousel.addEventListener('touchend', () => {
    setTimeout(() => carouselPaused = false, 2000);
  }, { passive: true });
}

// Controle de animação do carrossel
let isCarouselAnimating = false;

// Função global para controlar o carrossel (chamada pelos botões HTML)
function moveCarousel(direction, isAuto = false) {
  const carousel = document.getElementById('promotedCarousel');
  if (!carousel || isCarouselAnimating) {
    return;
  }
  
  // Pegar largura de um card (incluindo gap)
  const cards = carousel.querySelectorAll('.promo-card');
  if (cards.length === 0) {
    return;
  }
  
  const cardWidth = cards[0].offsetWidth + 24; // largura + gap
  // No mobile (< 768px) avança 2 cards, senão 3
  const isMobile = window.innerWidth < 768;
  const itemsToScroll = isMobile ? 2 : 3;
  const moveAmount = cardWidth * itemsToScroll;
  const currentScroll = carousel.scrollLeft;
  const maxScroll = carousel.scrollWidth - carousel.clientWidth;
  
  let newScroll;
  
  if (direction > 0) {
    // Avançar para direita
    newScroll = currentScroll + moveAmount;
    
    // Se o próximo scroll ultrapassa o máximo, vai direto pro final
    if (newScroll > maxScroll) {
      // Se já está no final ou quase, volta ao início
      if (currentScroll >= maxScroll - 10) {
        newScroll = 0;
      } else {
        // Vai até o final para mostrar o último elemento
        newScroll = maxScroll;
      }
    }
  } else {
    // Voltar para esquerda
    newScroll = currentScroll - moveAmount;
    if (newScroll < 0) {
      newScroll = 0; // Para no início
    }
  }
  
  // Animação suave customizada (1.2 segundos - bem lenta)
  smoothScrollTo(carousel, newScroll, 1200);
}

// Animação de scroll suave customizada
function smoothScrollTo(element, targetPosition, duration) {
  isCarouselAnimating = true;
  const startPosition = element.scrollLeft;
  const distance = targetPosition - startPosition;
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function (ease-in-out cubic) - mais suave
    const easeInOut = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    element.scrollLeft = startPosition + (distance * easeInOut);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      isCarouselAnimating = false;
    }
  }
  
  requestAnimationFrame(animation);
}

// Expor globalmente
window.moveCarousel = moveCarousel;

// Atualizar quantidade
// Rastrear itens com remoção pendente (segundo clique remove)
const pendingRemovalSidebar = {};

function updateQuantity(productId, delta) {
  const normalizedId = String(productId);
  const item = cart.find(i => String(i.id) === normalizedId);
  if (!item) return;
  
  const minOrder = item.minOrder || 1;
  const newQty = item.quantity + delta;
  
  // Verificar se está tentando diminuir abaixo do mínimo
  if (newQty < minOrder) {
    // Se já foi alertado, remove o item
    if (pendingRemovalSidebar[normalizedId]) {
      delete pendingRemovalSidebar[normalizedId];
      removeFromCart(normalizedId);
      return;
    }
    
    // Primeiro alerta - marcar como pendente
    pendingRemovalSidebar[normalizedId] = true;
    showToast(`Mínimo: ${minOrder} ${item.unit}. Clique − de novo para remover.`, '⚠️');
    
    // Limpar o pendingRemoval após 3 segundos
    setTimeout(() => {
      delete pendingRemovalSidebar[normalizedId];
    }, 3000);
    return;
  }
  
  if (newQty > item.stock) {
    showToast('Estoque insuficiente', '❌');
    return;
  }
  
  // Limpar pending se existir
  delete pendingRemovalSidebar[normalizedId];
  
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

// Validar e atualizar quantidade digitada
function validateAndUpdateQuantity(input) {
  const productId = input.dataset.productId;
  const minOrder = parseInt(input.dataset.minOrder) || 1;
  let newQty = parseInt(input.value) || minOrder;
  
  const normalizedId = String(productId);
  const item = cart.find(i => String(i.id) === normalizedId);
  
  if (!item) return;
  
  // Validar mínimo
  if (newQty < minOrder) {
    alert(`⚠️ Quantidade mínima para "${item.name}" é ${minOrder} ${item.unit || 'un'}. Ajustando automaticamente.`);
    newQty = minOrder;
    input.value = minOrder;
  }
  
  // Atualizar quantidade
  item.quantity = newQty;
  saveCartToStorage();
  updateCartUI();
}

// Expor função globalmente
window.validateAndUpdateQuantity = validateAndUpdateQuantity;

// Obter preço efetivo (promocional ou normal)
function getEffectivePrice(item) {
  return (item.isPromo && item.promoPrice) ? item.promoPrice : item.price;
}

// Atualizar UI do carrinho
function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const content = document.getElementById('cartContent');
  const footer = document.getElementById('cartFooter');
  const emptyCart = document.getElementById('emptyCart');
  const sidebarCount = document.getElementById('cartSidebarCount');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cart.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0);
  
  // Atualizar badge
  if (badge) {
    badge.textContent = totalItems;
  }
  
  // Atualizar contador no sidebar
  if (sidebarCount) {
    sidebarCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
  }
  
  // Se não estiver na página principal, sai
  if (!content) return;
  
  if (cart.length === 0) {
    if (emptyCart) emptyCart.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    content.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🛒</div>
        <h4>Seu carrinho está vazio</h4>
        <p>Explore nossos produtos e adicione ao carrinho</p>
        <button class="cart-empty-btn" onclick="toggleCart()">Continuar Comprando</button>
      </div>
    `;
  } else {
    if (emptyCart) emptyCart.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');
    
    content.innerHTML = cart.map(item => {
      const effectivePrice = getEffectivePrice(item);
      const hasPromo = item.isPromo && item.promoPrice;
      
      return `
      <div class="cart-item ${hasPromo ? 'has-promo' : ''}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80?text=${encodeURIComponent(item.name)}'">
        <div class="cart-item-details">
          <span class="cart-item-name">${item.name}${hasPromo ? `<span class="cart-item-promo-badge">🔥 Promo</span>` : ''}</span>
          <div class="cart-item-prices">
            ${hasPromo ? `<span class="cart-price-original">R$ ${(item.price * item.quantity).toFixed(2)}</span>` : ''}
            <span class="cart-price-current ${hasPromo ? 'promo' : ''}">R$ ${(effectivePrice * item.quantity).toFixed(2)}</span>
          </div>
          <div class="cart-item-controls">
            <div class="cart-item-quantity">
              <button class="cart-qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
              <input type="number" 
                     class="cart-item-qty-input" 
                     value="${item.quantity}" 
                     min="${item.minOrder || 1}"
                     data-product-id="${item.id}"
                     data-min-order="${item.minOrder || 1}"
                     onchange="validateAndUpdateQuantity(this)"
                     onkeypress="if(event.key==='Enter'){this.blur();}">
              <button class="cart-qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Remover">🗑️</button>
          </div>
        </div>
      </div>
    `}).join('');
    
    // Atualizar totais
    const subtotalElement = document.getElementById('cartSubtotal');
    const totalElement = document.getElementById('cartTotal');
    
    if (subtotalElement) {
      subtotalElement.textContent = `R$ ${totalValue.toFixed(2)}`;
    }
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
