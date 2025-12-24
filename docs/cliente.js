// Cliente.js - Gestão de pedidos do cliente (API Backend)

// Variáveis globais
let apiOrders = [];
let apiHistory = [];

// Carregar pedidos da API
async function loadOrdersFromAPI() {
  try {
    const allOrders = await api.getOrders();
    
    // Separar pedidos ativos do histórico
    apiOrders = allOrders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado');
    apiHistory = allOrders.filter(o => o.status === 'entregue' || o.status === 'cancelado');
    
    console.log('✅ Pedidos carregados:', apiOrders.length, '| Histórico:', apiHistory.length);
  } catch (error) {
    console.error('❌ Erro ao carregar pedidos:', error);
    // Usar dados demo como fallback
    apiOrders = [];
    apiHistory = [];
  }
}

// Dados demo de pedidos (fallback)
const DEMO_ORDERS = [
  {
    id: 'PED-2025-001',
    date: '2025-10-28',
    status: 'em_transito',
    total: 458.50,
    deliveryDate: '2025-10-30',
    items: [
      { name: 'Alface Crespa', quantity: 10, unit: 'un', price: 3.5 },
      { name: 'Tomate Italiano', quantity: 15, unit: 'kg', price: 8.9 },
      { name: 'Cebola Roxa', quantity: 8, unit: 'kg', price: 6.5 }
    ]
  },
  {
    id: 'PED-2025-002',
    date: '2025-10-29',
    status: 'processando',
    total: 325.80,
    deliveryDate: '2025-10-31',
    items: [
      { name: 'Batata Inglesa', quantity: 20, unit: 'kg', price: 4.9 },
      { name: 'Cenoura Fresca', quantity: 10, unit: 'kg', price: 5.5 },
      { name: 'Alho Branco', quantity: 5, unit: 'kg', price: 18.9 }
    ]
  }
];

const DEMO_HISTORY = [
  {
    id: 'PED-2025-003',
    date: '2025-10-15',
    status: 'entregue',
    total: 892.40,
    deliveryDate: '2025-10-17',
    items: [
      { name: 'Feijão Preto', quantity: 30, unit: 'kg', price: 9.5 },
      { name: 'Arroz Integral', quantity: 25, unit: 'kg', price: 12.9 },
      { name: 'Manjericão Fresco', quantity: 15, unit: 'maço', price: 6.5 }
    ]
  },
  {
    id: 'PED-2025-004',
    date: '2025-10-08',
    status: 'entregue',
    total: 567.30,
    deliveryDate: '2025-10-10',
    items: [
      { name: 'Maçã Fuji', quantity: 20, unit: 'kg', price: 7.9 },
      { name: 'Banana Prata', quantity: 18, unit: 'kg', price: 5.2 },
      { name: 'Limão Tahiti', quantity: 12, unit: 'kg', price: 4.8 }
    ]
  },
  {
    id: 'PED-2025-005',
    date: '2025-09-25',
    status: 'entregue',
    total: 1245.60,
    deliveryDate: '2025-09-27',
    items: [
      { name: 'Tomate Italiano', quantity: 40, unit: 'kg', price: 8.9 },
      { name: 'Cebola Roxa', quantity: 25, unit: 'kg', price: 6.5 },
      { name: 'Batata Inglesa', quantity: 50, unit: 'kg', price: 4.9 }
    ]
  }
];

// Status tradução
const STATUS_LABELS = {
  'processando': { text: 'Processando', class: 'status-processing', icon: '⏳' },
  'em_transito': { text: 'Em Trânsito', class: 'status-transit', icon: '🚚' },
  'entregue': { text: 'Entregue', class: 'status-delivered', icon: '✅' },
  'cancelado': { text: 'Cancelado', class: 'status-cancelled', icon: '❌' }
};

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
  loadClienteInfo();
  
  // Carregar pedidos da API
  await loadOrdersFromAPI();
  
  loadOrders();
  loadHistory();
});

// Carregar informações do cliente
function loadClienteInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('clienteName').textContent = user.name;
    document.getElementById('clienteCompany').textContent = user.company;
    document.getElementById('clienteEmail').textContent = user.email;
  }
}

// Carregar pedidos ativos
function loadOrders() {
  const ordersList = document.getElementById('ordersList');
  const orders = apiOrders.length > 0 ? apiOrders : DEMO_ORDERS;
  
  if (orders.length === 0) {
    ordersList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📦</span>
        <h3>Nenhum pedido ativo</h3>
        <p>Você não possui pedidos em andamento no momento.</p>
        <a href="index.html" class="btn-primary">Fazer Novo Pedido</a>
      </div>
    `;
    return;
  }
  
  ordersList.innerHTML = orders.map(order => renderOrder(order)).join('');
}

// Carregar histórico
function loadHistory() {
  const historyList = document.getElementById('historyList');
  const history = apiHistory.length > 0 ? apiHistory : DEMO_HISTORY;
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <h3>Sem histórico</h3>
        <p>Você ainda não possui pedidos finalizados.</p>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = history.map(order => renderOrder(order)).join('');
}

// Renderizar pedido
function renderOrder(order) {
  const statusInfo = STATUS_LABELS[order.status];
  const formattedDate = formatDate(order.date || order.created_at);
  const formattedDelivery = formatDate(order.deliveryDate || order.delivery_date);
  
  return `
    <div class="order-card">
      <div class="order-header">
        <div class="order-id-section">
          <h3>Pedido ${order.order_number || order.id}</h3>
          <span class="order-date">Realizado em ${formattedDate}</span>
        </div>
        <div class="order-status ${statusInfo.class}">
          <span>${statusInfo.icon}</span>
          <span>${statusInfo.text}</span>
        </div>
      </div>
      
      <div class="order-body">
        <div class="order-info-row">
          <div class="order-info-item">
            <span class="order-label">Previsão de Entrega:</span>
            <span class="order-value">${formattedDelivery}</span>
          </div>
          <div class="order-info-item">
            <span class="order-label">Total:</span>
            <span class="order-value order-total">R$ ${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="order-items">
          <h4>Itens do Pedido:</h4>
          <ul class="items-list">
            ${order.items.map(item => `
              <li>
                <span class="item-name">${item.name}</span>
                <span class="item-details">${item.quantity} ${item.unit} × R$ ${item.price.toFixed(2)}</span>
                <span class="item-subtotal">R$ ${(item.quantity * item.price).toFixed(2)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        ${order.status === 'entregue' ? `
          <div class="order-actions">
            <button class="btn-secondary" onclick="reorder('${order.id}')">
              🔄 Pedir Novamente
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Switch de tabs
function switchTab(tab) {
  // Atualizar botões
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab${capitalizeFirst(tab)}`).classList.add('active');
  
  // Atualizar conteúdo
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`content${capitalizeFirst(tab)}`).classList.add('active');
}

// Refazer pedido
function reorder(orderId) {
  const order = [...DEMO_ORDERS, ...DEMO_HISTORY].find(o => o.id === orderId);
  if (!order) return;
  
  // Limpar carrinho da sessão atual
  sessionStorage.removeItem('freshStoreCart');
  
  // Adicionar itens ao carrinho (simulado - precisaria dos IDs dos produtos reais)
  alert(`Funcionalidade de "Pedir Novamente" será implementada em breve!\n\nPedido: ${orderId}`);
  
  // Em produção real, você adicionaria os itens ao carrinho e redirecionaria
  // window.location.href = 'carrinho.html';
}

// Helpers
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

