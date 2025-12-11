// Cart Page JavaScript
let cart = [];
let deliveryEstimate = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  renderCart();
  autoOpenCheckoutIfNeeded();
  setupMasks();
});

// Carregar carrinho do localStorage
function loadCartFromStorage() {
  const saved = localStorage.getItem('freshStoreCart');
  if (saved) {
    cart = JSON.parse(saved);
  }
}

// Salvar carrinho
function saveCartToStorage() {
  localStorage.setItem('freshStoreCart', JSON.stringify(cart));
}

// Renderizar carrinho
function renderCart() {
  const emptyPage = document.getElementById('emptyCartPage');
  const cartContent = document.getElementById('cartPageContent');
  const badge = document.getElementById('cartBadge');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalItems;
  
  if (cart.length === 0) {
    emptyPage.style.display = 'flex';
    cartContent.style.display = 'none';
    return;
  }
  
  emptyPage.style.display = 'none';
  cartContent.style.display = 'block';
  
  renderCartItems();
  updateSummary();
}

function autoOpenCheckoutIfNeeded() {
  const url = new URL(window.location.href);
  const shouldOpen = url.hash === '#checkout' || url.searchParams.get('checkout') === '1';

  if (shouldOpen) {
    if (cart.length === 0) {
      const emptyPage = document.getElementById('emptyCartPage');
      const cartContent = document.getElementById('cartPageContent');
      if (emptyPage && cartContent) {
        emptyPage.style.display = 'flex';
        cartContent.style.display = 'none';
      }
      alert('Adicione produtos ao carrinho antes de ir para o checkout.');
      return;
    }

    proceedToCheckout();
  }
}

// Renderizar itens do carrinho
function renderCartItems() {
  const container = document.getElementById('cartItemsList');
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item-card">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="cart-item-price">R$ ${item.price.toFixed(2)} / ${item.unit}</p>
        <p class="cart-item-category">${item.category}</p>
      </div>
      <div class="cart-item-controls">
        <div class="quantity-control">
          <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        </div>
        <p class="item-total">R$ ${(item.price * item.quantity).toFixed(2)}</p>
        <button class="btn-remove" onclick="removeItem('${item.id}')">Remover</button>
      </div>
    </div>
  `).join('');
}

// Rastrear itens com remoção pendente
const pendingRemovalCart = {};

// Atualizar quantidade
function updateQuantity(productId, delta) {
  const normalizedId = String(productId);
  const item = cart.find(i => String(i.id) === normalizedId);
  if (!item) return;
  
  const minOrder = item.minOrder || 1;
  const newQty = item.quantity + delta;
  
  // Verificar se está tentando diminuir abaixo do mínimo
  if (newQty < minOrder) {
    // Se já foi alertado, remove o item
    if (pendingRemovalCart[normalizedId]) {
      delete pendingRemovalCart[normalizedId];
      removeItemDirect(normalizedId);
      return;
    }
    
    // Primeiro alerta - marcar como pendente
    pendingRemovalCart[normalizedId] = true;
    alert(`Quantidade mínima: ${minOrder} ${item.unit}. Clique − novamente para remover.`);
    
    // Limpar o pendingRemoval após 3 segundos
    setTimeout(() => {
      delete pendingRemovalCart[normalizedId];
    }, 3000);
    return;
  }
  
  if (newQty > item.stock) {
    alert('Estoque insuficiente');
    return;
  }
  
  // Limpar pending se existir
  delete pendingRemovalCart[normalizedId];
  
  item.quantity = newQty;
  saveCartToStorage();
  renderCart();
}

// Remover item (com confirmação)
function removeItem(productId) {
  if (confirm('Deseja remover este item do carrinho?')) {
    removeItemDirect(productId);
  }
}

// Remover item direto (sem confirmação)
function removeItemDirect(productId) {
  const normalizedId = String(productId);
  cart = cart.filter(item => String(item.id) !== normalizedId);
  saveCartToStorage();
  renderCart();
}

// Atualizar resumo
function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  document.getElementById('summarySubtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById('summaryTotal').textContent = `R$ ${subtotal.toFixed(2)}`;
}

// Ir para checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Adicione produtos ao carrinho primeiro');
    return;
  }
  
  document.getElementById('cartPageContent').style.display = 'none';
  document.getElementById('checkoutSection').style.display = 'block';
  window.scrollTo(0, 0);
  
  renderCheckoutItems();
}

// Voltar para carrinho
function backToCart() {
  document.getElementById('cartPageContent').style.display = 'block';
  document.getElementById('checkoutSection').style.display = 'none';
  window.scrollTo(0, 0);
}

// Renderizar itens no checkout
function renderCheckoutItems() {
  const container = document.getElementById('finalCartItems');
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  container.innerHTML = cart.map(item => `
    <div class="summary-item">
      <span>${item.name} (${item.quantity}x ${item.unit})</span>
      <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  
  document.getElementById('finalSubtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
  updateFinalTotal();
}

// Atualizar total final
function updateFinalTotal() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryEstimate ? deliveryEstimate.deliveryFee : 0;
  const total = subtotal + deliveryFee;
  
  document.getElementById('finalTotal').textContent = `R$ ${total.toFixed(2)}`;
}

// Máscaras de input
function setupMasks() {
  // CNPJ
  const cnpjInput = document.getElementById('cnpj');
  if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 14) {
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      }
      e.target.value = value;
    });
  }
  
  // CEP
  const cepInput = document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 8) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      }
      e.target.value = value;
    });
  }
  
  // Telefone
  const phoneInput = document.getElementById('contactPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
      e.target.value = value;
    });
  }
}

// Calcular entrega
function calculateDelivery() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    alert('Por favor, insira um CEP válido (8 dígitos)');
    return;
  }
  
  // Simula cálculo baseado no CEP
  const lastDigits = parseInt(cep.slice(-3));
  const distance = Math.floor((lastDigits / 1000) * 50) + 5;
  
  const hours = Math.floor(distance / 20);
  const minutes = Math.floor(((distance % 20) / 20) * 60);
  const estimatedTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`;
  
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
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (subtotal < minOrderValue) {
    alert(`Valor mínimo do pedido para esta região: R$ ${minOrderValue.toFixed(2)}`);
    return;
  }
  
  deliveryEstimate = {
    distance,
    estimatedTime,
    deliveryFee,
    minOrderValue
  };
  
  // Mostrar informações
  document.getElementById('deliveryDistance').textContent = `${distance} km`;
  document.getElementById('deliveryTime').textContent = estimatedTime;
  document.getElementById('deliveryFee').textContent = deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`;
  document.getElementById('finalDeliveryFee').textContent = `R$ ${deliveryFee.toFixed(2)}`;
  
  document.getElementById('deliveryInfo').classList.remove('hidden');
  
  updateFinalTotal();
}

// Submit do formulário (usando API)
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!deliveryEstimate) {
    alert('Por favor, calcule o frete antes de finalizar o pedido');
    return;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryEstimate.deliveryFee;
  
  // Preparar dados do pedido para API
  const orderData = {
    items: cart.map(item => ({
      product_id: String(item.id),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      image: item.image
    })),
    shipping_address: {
      street: document.getElementById('street').value,
      number: document.getElementById('number').value,
      complement: document.getElementById('complement').value || '',
      neighborhood: document.getElementById('neighborhood').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipcode: document.getElementById('cep').value
    },
    contact_info: {
      phone: document.getElementById('contactPhone').value,
      email: document.getElementById('contactEmail').value,
      name: document.getElementById('contactName').value
    },
    delivery_fee: deliveryEstimate.deliveryFee,
    notes: `Tipo de negócio: ${document.getElementById('businessType').value}\nCNPJ: ${document.getElementById('cnpj').value}\nRazão Social: ${document.getElementById('razaoSocial').value}\nNome Fantasia: ${document.getElementById('nomeFantasia').value}\nPagamento: ${document.getElementById('paymentMethod').value}\nObservações: ${document.getElementById('observations').value || 'Nenhuma'}`,
  };
  
  try {
    // Criar pedido via API
    const order = await api.createOrder(orderData);
    
    // Limpar carrinho
    cart = [];
    saveCartToStorage();
    
    // Exibir sucesso
    showSuccessModal(order.order_number, order.delivery_date);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    alert('Erro ao processar pedido: ' + error.message + '\n\nSe não estiver logado, será necessário fazer login primeiro.');
  }
});

// Mostrar modal de sucesso
function showSuccessModal(orderNumber, deliveryDate) {
  const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('pt-BR');
  document.getElementById('orderNumber').textContent = orderNumber;
  document.getElementById('orderTotal').textContent = `R$ ${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + deliveryEstimate.deliveryFee).toFixed(2)}`;
  document.getElementById('orderDelivery').textContent = `Previsão: ${deliveryDateFormatted}`;
  document.getElementById('successModal').classList.add('show');
}

// Fechar modal de sucesso
function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('show');
  window.location.href = 'index.html';
}

