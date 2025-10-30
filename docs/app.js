// Dados dos produtos
const products = [
  {
    id: 1,
    name: "Alface Americana",
    category: "verduras",
    price: 4.5,
    unit: "unidade",
    minOrder: 5,
    stock: 150,
    image: "images/fresh-lettuce.png",
    description: "Alface fresca e crocante"
  },
  {
    id: 2,
    name: "Tomate Italiano",
    category: "legumes",
    price: 6.9,
    unit: "kg",
    minOrder: 2,
    stock: 200,
    image: "images/italian-tomatoes.jpg",
    description: "Tomate italiano premium"
  },
  {
    id: 3,
    name: "Cebola Roxa",
    category: "legumes",
    price: 5.5,
    unit: "kg",
    minOrder: 3,
    stock: 180,
    image: "images/red-onion.jpg",
    description: "Cebola roxa de qualidade"
  },
  {
    id: 4,
    name: "Rúcula Orgânica",
    category: "verduras",
    price: 8.9,
    unit: "maço",
    minOrder: 3,
    stock: 100,
    image: "images/organic-arugula.jpg",
    description: "Rúcula orgânica fresca"
  },
  {
    id: 5,
    name: "Batata Inglesa",
    category: "legumes",
    price: 4.2,
    unit: "kg",
    minOrder: 5,
    stock: 300,
    image: "images/batata-inglesa.jpg",
    description: "Batata inglesa selecionada"
  },
  {
    id: 6,
    name: "Cenoura",
    category: "legumes",
    price: 3.8,
    unit: "kg",
    minOrder: 5,
    stock: 250,
    image: "images/cenoura-fresca.jpg",
    description: "Cenoura fresca e doce"
  },
  {
    id: 7,
    name: "Banana Prata",
    category: "frutas",
    price: 5.5,
    unit: "kg",
    minOrder: 5,
    stock: 200,
    image: "images/banana-prata.jpg",
    description: "Banana prata madura"
  },
  {
    id: 8,
    name: "Maçã Fuji",
    category: "frutas",
    price: 7.9,
    unit: "kg",
    minOrder: 3,
    stock: 150,
    image: "images/ma---fuji-vermelha.jpg",
    description: "Maçã fuji importada"
  },
  {
    id: 9,
    name: "Manjericão Fresco",
    category: "temperos",
    price: 6.5,
    unit: "maço",
    minOrder: 2,
    stock: 80,
    image: "images/manjeric-o-fresco.jpg",
    description: "Manjericão fresco aromático"
  },
  {
    id: 10,
    name: "Alho Nacional",
    category: "temperos",
    price: 18.9,
    unit: "kg",
    minOrder: 1,
    stock: 120,
    image: "images/alho-branco.jpg",
    description: "Alho nacional de primeira"
  },
  {
    id: 11,
    name: "Arroz Integral",
    category: "graos",
    price: 12.9,
    unit: "kg",
    minOrder: 10,
    stock: 500,
    image: "images/arroz-integral.jpg",
    description: "Arroz integral tipo 1"
  },
  {
    id: 12,
    name: "Feijão Preto",
    category: "graos",
    price: 8.5,
    unit: "kg",
    minOrder: 10,
    stock: 400,
    image: "images/feij-o-preto.jpg",
    description: "Feijão preto selecionado"
  }
];

const categories = [
  { id: "all", name: "Todos os Produtos" },
  { id: "verduras", name: "Verduras" },
  { id: "legumes", name: "Legumes" },
  { id: "frutas", name: "Frutas" },
  { id: "temperos", name: "Temperos" },
  { id: "graos", name: "Grãos e Cereais" }
];

// Estado da aplicação
let cart = [];
let selectedCategory = "all";

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
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

// Carregar produtos
function loadProducts() {
  const container = document.getElementById('productsGrid');
  const filtered = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);
  
  container.innerHTML = filtered.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400?text=${encodeURIComponent(product.name)}'">
      <div class="product-content">
        <div class="product-header">
          <h4 class="product-name">${product.name}</h4>
          <span class="product-badge">${product.category}</span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-meta">
          📦 Estoque: ${product.stock} ${product.unit}
        </div>
        ${product.minOrder > 1 ? `
          <p class="product-min-order">Pedido mínimo: ${product.minOrder} ${product.unit}</p>
        ` : ''}
        <div class="product-footer">
          <div class="product-price-box">
            <span class="product-price">R$ ${product.price.toFixed(2)}</span>
            <span class="product-unit">por ${product.unit}</span>
          </div>
          <button class="btn-add-cart" onclick="addToCart(${product.id})">
            🛒 <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Adicionar ao carrinho
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += product.minOrder || 1;
  } else {
    cart.push({
      ...product,
      quantity: product.minOrder || 1
    });
  }
  
  saveCartToStorage();
  updateCartUI();
  
  // Feedback visual
  const badge = document.getElementById('cartBadge');
  badge.style.transform = 'scale(1.3)';
  setTimeout(() => badge.style.transform = 'scale(1)', 200);
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
  
  badge.textContent = totalItems;
  
  if (cart.length === 0) {
    emptyCart.classList.remove('hidden');
    footer.classList.add('hidden');
    content.innerHTML = emptyCart.outerHTML;
  } else {
    emptyCart.classList.add('hidden');
    footer.classList.remove('hidden');
    
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
    
    document.getElementById('cartTotal').textContent = `R$ ${totalValue.toFixed(2)}`;
  }
}

// Toggle carrinho
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
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
    alert('Por favor, insira um CEP válido (8 dígitos)');
    return;
  }
  
  // Simula cálculo baseado no CEP
  const lastDigits = parseInt(cep.slice(-3));
  const distance = Math.floor((lastDigits / 1000) * 50) + 5; // 5-55 km
  
  // Calcula tempo
  const hours = Math.floor(distance / 20);
  const minutes = Math.floor(((distance % 20) / 20) * 60);
  const estimatedTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`;
  
  // Calcula taxa
  let deliveryFee = 0;
  let minOrderValue = 100;
  
  if (distance <= 10) {
    deliveryFee = 0;
    minOrderValue = 100;
  } else if (distance <= 20) {
    deliveryFee = 15;
    minOrderValue = 150;
  } else if (distance <= 30) {
    deliveryFee = 25;
    minOrderValue = 200;
  } else {
    deliveryFee = 35;
    minOrderValue = 250;
  }
  
  // Mostra resultado
  document.getElementById('distance').textContent = `${distance} km`;
  document.getElementById('time').textContent = estimatedTime;
  document.getElementById('fee').textContent = deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`;
  document.getElementById('minOrder').textContent = `R$ ${minOrderValue.toFixed(2)}`;
  
  document.getElementById('deliveryResult').classList.remove('hidden');
  
  if (deliveryFee === 0) {
    document.getElementById('freeShipping').classList.remove('hidden');
  } else {
    document.getElementById('freeShipping').classList.add('hidden');
  }
}

