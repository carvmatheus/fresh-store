/**
 * DA HORTA - Admin Dashboard
 * Gestão completa: produtos, campanhas, usuários, pedidos
 */

// ========== AUTH CHECK ==========
(function() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('currentUser');
    
    if (!token || !user) {
        window.location.replace('login.html');
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            window.location.replace('index.html');
            return;
        }
    } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        window.location.replace('login.html');
    }
})();

// ========== STATE ==========
let products = [];
let campaigns = [];
let users = [];
let orders = [];
let metrics = null;
let currentSection = 'dashboard';
let currentEditId = null;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando Admin Dashboard...');
    
    setupNavigation();
    setupMobileMenu();
    setupModals();
    
    // Load admin name
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('adminName').textContent = user.name || user.username || 'Admin';
    } catch (e) {}
    
    // Initial load
    await loadDashboardData();
    
    console.log('✅ Dashboard inicializado');
});

// ========== NAVIGATION ==========
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    currentSection = sectionName;
    
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionName);
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section${capitalize(sectionName)}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Produtos',
        campaigns: 'Campanhas',
        orders: 'Pedidos',
        users: 'Clientes',
        approvals: 'Aprovações'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || sectionName;
    
    // Load section data
    loadSectionData(sectionName);
    
    // Close mobile menu
    document.getElementById('adminSidebar').classList.remove('open');
}

async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'products':
            await loadProducts();
            break;
        case 'campaigns':
            await loadCampaigns();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'approvals':
            await loadApprovals();
            break;
    }
}

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    
    mobileBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// ========== DASHBOARD ==========
async function loadDashboardData() {
    try {
        // Load metrics
        const metricsData = await api.getUserMetrics();
        metrics = metricsData;
        
        // Update KPIs
        document.getElementById('totalUsers').textContent = metrics.active_users || 0;
        document.getElementById('newUsersWeek').textContent = `+${metrics.new_users_week || 0} esta semana`;
        document.getElementById('pendingApprovals').textContent = metrics.pending_approval || 0;
        document.getElementById('pendingBadge').textContent = metrics.pending_approval || 0;
        
        // Load orders for count
        const ordersData = await api.getAllOrders();
        orders = ordersData || [];
        document.getElementById('totalOrders').textContent = orders.length;
        const pending = orders.filter(o => o.status === 'pendente').length;
        document.getElementById('pendingOrders').textContent = `${pending} pendentes`;
        
        // Load campaigns
        const campaignsData = await api.getCampaigns(true);
        const activeCampaigns = campaignsData?.length || 0;
        document.getElementById('activeCampaigns').textContent = activeCampaigns;
        
        // Render charts
        renderCategoryChart(metrics.users_by_business_type || {});
        renderTopCustomers(metrics.top_customers || []);
        
        // Render recent activity
        renderRecentOrders(orders.slice(0, 5));
        renderRecentUsers(await loadRecentUsers());
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function renderCategoryChart(data) {
    const container = document.getElementById('categoryChart');
    if (!container) return;
    
    const categories = Object.entries(data);
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum dado disponível</p></div>';
        return;
    }
    
    const max = Math.max(...categories.map(([_, count]) => count));
    
    container.innerHTML = categories.map(([category, count]) => {
        const percent = max > 0 ? (count / max) * 100 : 0;
        const catClass = category.toLowerCase().replace(/\s+/g, '') || 'outros';
        
        return `
            <div class="category-bar-item">
                <span class="category-bar-label">${category}</span>
                <div class="category-bar-track">
                    <div class="category-bar-fill ${catClass}" style="width: ${percent}%">
                        ${count}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTopCustomers(customers) {
    const container = document.getElementById('topCustomers');
    if (!container) return;
    
    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum cliente com compras</p></div>';
        return;
    }
    
    container.innerHTML = customers.map((customer, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        
        return `
            <div class="top-customer-item">
                <span class="customer-rank ${rankClass}">${index + 1}</span>
                <div class="customer-info">
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-company">${customer.company || 'Sem empresa'}</div>
                </div>
                <span class="customer-spent">${formatCurrency(customer.total_spent)}</span>
            </div>
        `;
    }).join('');
}

function renderRecentOrders(recentOrders) {
    const container = document.getElementById('recentOrders');
    if (!container) return;
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum pedido recente</p></div>';
        return;
    }
    
    container.innerHTML = recentOrders.map(order => `
        <div class="activity-item">
            <div class="activity-icon">📦</div>
            <div class="activity-content">
                <div class="activity-title">${order.order_number}</div>
                <div class="activity-meta">${formatCurrency(order.total)} • ${getStatusLabel(order.status)}</div>
            </div>
            <span class="activity-time">${formatRelativeTime(order.created_at)}</span>
        </div>
    `).join('');
}

async function loadRecentUsers() {
    try {
        const usersData = await api.getUsers();
        return (usersData || []).slice(0, 5);
    } catch (error) {
        return [];
    }
}

function renderRecentUsers(recentUsers) {
    const container = document.getElementById('recentUsers');
    if (!container) return;
    
    if (recentUsers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum cadastro recente</p></div>';
        return;
    }
    
    container.innerHTML = recentUsers.map(user => `
        <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
                <div class="activity-title">${user.name}</div>
                <div class="activity-meta">${user.company || user.email}</div>
            </div>
            <span class="activity-time">${formatRelativeTime(user.created_at)}</span>
        </div>
    `).join('');
}

// ========== PRODUCTS ==========
async function loadProducts() {
    try {
        products = await api.getProducts();
        renderProducts();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📦</span><p class="empty-state-text">Nenhum produto cadastrado</p></div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const isPromo = product.is_promo && product.promo_price;
        const displayPrice = isPromo ? product.promo_price : product.price;
        
        return `
            <div class="product-card-admin ${isPromo ? 'is-promo' : ''}">
                <img src="${product.image_url || 'https://via.placeholder.com/300?text=' + encodeURIComponent(product.name)}" 
                     alt="${product.name}" 
                     class="product-image-admin"
                     onerror="this.src='https://via.placeholder.com/300?text=Produto'">
                <div class="product-info-admin">
                    <h4 class="product-name-admin">${product.name}</h4>
                    <div class="product-category-admin">${getCategoryLabel(product.category)}</div>
                    <div class="product-price-row">
                        <span class="product-price-admin">${formatCurrency(displayPrice)}</span>
                        ${isPromo ? `<span class="product-price-original">${formatCurrency(product.price)}</span>` : ''}
                    </div>
                    <div class="product-stock-admin">Estoque: ${product.stock} ${product.unit}</div>
                </div>
                <div class="product-actions-admin">
                    <button class="btn-secondary btn-sm" onclick="editProduct('${product.id}')">✏️ Editar</button>
                    <button class="btn-danger btn-sm" onclick="deleteProduct('${product.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterProducts() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('productCategoryFilter')?.value || '';
    
    const container = document.getElementById('productsGrid');
    
    const filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search) || 
                           (p.description || '').toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });
    
    // Re-render with filtered
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum produto encontrado</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(product => {
        const isPromo = product.is_promo && product.promo_price;
        const displayPrice = isPromo ? product.promo_price : product.price;
        
        return `
            <div class="product-card-admin ${isPromo ? 'is-promo' : ''}">
                <img src="${product.image_url || 'https://via.placeholder.com/300?text=' + encodeURIComponent(product.name)}" 
                     alt="${product.name}" 
                     class="product-image-admin"
                     onerror="this.src='https://via.placeholder.com/300?text=Produto'">
                <div class="product-info-admin">
                    <h4 class="product-name-admin">${product.name}</h4>
                    <div class="product-category-admin">${getCategoryLabel(product.category)}</div>
                    <div class="product-price-row">
                        <span class="product-price-admin">${formatCurrency(displayPrice)}</span>
                        ${isPromo ? `<span class="product-price-original">${formatCurrency(product.price)}</span>` : ''}
                    </div>
                    <div class="product-stock-admin">Estoque: ${product.stock} ${product.unit}</div>
                </div>
                <div class="product-actions-admin">
                    <button class="btn-secondary btn-sm" onclick="editProduct('${product.id}')">✏️ Editar</button>
                    <button class="btn-danger btn-sm" onclick="deleteProduct('${product.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== CAMPAIGNS ==========
async function loadCampaigns() {
    try {
        const activeOnly = document.getElementById('activeOnlyFilter')?.checked || false;
        campaigns = await api.getCampaigns(activeOnly);
        renderCampaigns();
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        campaigns = [];
        renderCampaigns();
    }
}

function renderCampaigns() {
    const container = document.getElementById('campaignsList');
    if (!container) return;
    
    if (campaigns.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🎯</span><p class="empty-state-text">Nenhuma campanha cadastrada</p><button class="btn-primary" onclick="openCampaignModal()">➕ Criar Campanha</button></div>';
        return;
    }
    
    const now = new Date();
    
    container.innerHTML = campaigns.map(campaign => {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        
        let status = 'inactive';
        let statusLabel = 'Inativa';
        
        if (campaign.is_active) {
            if (now < startDate) {
                status = 'scheduled';
                statusLabel = 'Agendada';
            } else if (now >= startDate && now <= endDate) {
                status = 'active';
                statusLabel = 'Ativa';
            } else {
                status = 'inactive';
                statusLabel = 'Expirada';
            }
        }
        
        const discountDisplay = campaign.discount_type === 'percentage' 
            ? `-${campaign.discount_value}%` 
            : `-R$ ${campaign.discount_value.toFixed(2)}`;
        
        return `
            <div class="campaign-card ${status === 'inactive' ? 'inactive' : ''}">
                <div class="campaign-info">
                    <div class="campaign-name">
                        ${campaign.name}
                        <span class="campaign-badge ${status}">${statusLabel}</span>
                    </div>
                    <div class="campaign-meta">
                        ${campaign.category ? `Categoria: ${getCategoryLabel(campaign.category)}` : 'Todas as categorias'}
                    </div>
                    <div class="campaign-dates">
                        ${formatDate(startDate)} → ${formatDate(endDate)}
                    </div>
                </div>
                <div class="campaign-discount">${discountDisplay}</div>
                <div class="campaign-actions">
                    <button class="btn-secondary btn-sm" onclick="applyCampaign('${campaign.id}')" ${status !== 'active' ? 'disabled' : ''}>
                        ⚡ Aplicar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="removeCampaign('${campaign.id}')">
                        ↩️ Remover
                    </button>
                    <button class="btn-icon edit" onclick="editCampaign('${campaign.id}')">✏️</button>
                    <button class="btn-icon delete" onclick="deleteCampaign('${campaign.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterCampaigns() {
    loadCampaigns();
}

async function applyCampaign(campaignId) {
    if (!confirm('Aplicar esta campanha aos produtos? Isso atualizará os preços promocionais.')) return;
    
    try {
        const result = await api.applyCampaign(campaignId);
        alert(`✅ ${result.message}`);
        await loadProducts();
    } catch (error) {
        alert('❌ Erro ao aplicar campanha: ' + error.message);
    }
}

async function removeCampaign(campaignId) {
    if (!confirm('Remover promoções desta campanha? Os preços voltarão ao normal.')) return;
    
    try {
        const result = await api.removeCampaign(campaignId);
        alert(`✅ ${result.message}`);
        await loadProducts();
    } catch (error) {
        alert('❌ Erro ao remover campanha: ' + error.message);
    }
}

async function deleteCampaign(campaignId) {
    if (!confirm('Excluir esta campanha permanentemente?')) return;
    
    try {
        await api.deleteCampaign(campaignId);
        alert('✅ Campanha excluída!');
        await loadCampaigns();
    } catch (error) {
        alert('❌ Erro ao excluir campanha: ' + error.message);
    }
}

// ========== ORDERS ==========
async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter')?.value || '';
        orders = await api.getAllOrders(status || null);
        renderOrders();
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        orders = [];
        renderOrders();
    }
}

function renderOrders() {
    const container = document.getElementById('ordersListContainer');
    const summary = document.getElementById('ordersSummary');
    
    if (!container) return;
    
    // Summary
    if (summary) {
        const pending = orders.filter(o => o.status === 'pendente').length;
        const confirmed = orders.filter(o => o.status === 'confirmado').length;
        const preparing = orders.filter(o => o.status === 'em_preparacao').length;
        
        summary.innerHTML = `
            <span>Total: <strong>${orders.length}</strong></span>
            <span>Pendentes: <strong>${pending}</strong></span>
            <span>Confirmados: <strong>${confirmed}</strong></span>
            <span>Em Preparação: <strong>${preparing}</strong></span>
        `;
    }
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📋</span><p class="empty-state-text">Nenhum pedido encontrado</p></div>';
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const items = order.items || [];
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div class="order-card-info">
                        <h4>${order.order_number}</h4>
                        <p class="order-meta">${formatDateTime(order.created_at)}</p>
                    </div>
                    <div class="order-card-status">
                        <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
                        <span class="order-total">${formatCurrency(order.total)}</span>
                    </div>
                </div>
                <div class="order-card-body">
                    <p><strong>${totalItems}</strong> itens • ${order.delivery_address || 'Endereço não informado'}</p>
                </div>
                <div class="order-card-footer">
                    <select class="filter-select order-status-select" data-order-id="${order.id}">
                        ${getStatusOptions(order.status)}
                    </select>
                    <button class="btn-primary btn-sm" onclick="updateOrderStatus('${order.id}')">
                        Atualizar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterOrders() {
    loadOrders();
}

function refreshOrders() {
    loadOrders();
}

async function updateOrderStatus(orderId) {
    const select = document.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
    if (!select) return;
    
    const newStatus = select.value;
    
    try {
        await api.updateOrderStatus(orderId, newStatus);
        alert('✅ Status atualizado!');
        await loadOrders();
    } catch (error) {
        alert('❌ Erro ao atualizar: ' + error.message);
    }
}

// ========== USERS ==========
async function loadUsers() {
    try {
        const status = document.getElementById('userStatusFilter')?.value || '';
        const businessType = document.getElementById('userBusinessFilter')?.value || '';
        
        users = await api.getUsers(status, businessType);
        renderUsers();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        users = [];
        renderUsers();
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">👤</div>
                    <div class="user-details">
                        <span class="user-name-cell">${user.name}</span>
                        <span class="user-email-cell">${user.email}</span>
                    </div>
                </div>
            </td>
            <td>
                <div>${user.company || '-'}</div>
                <small style="color: var(--text-muted)">${user.cnpj || ''}</small>
            </td>
            <td>${getBusinessTypeLabel(user.business_type)}</td>
            <td class="date-cell ${!user.last_login ? 'never' : ''}">
                ${user.last_login ? formatDateTime(user.last_login) : 'Nunca'}
            </td>
            <td class="date-cell ${!user.last_purchase ? 'never' : ''}">
                ${user.last_purchase ? formatDateTime(user.last_purchase) : 'Nunca'}
            </td>
            <td class="money-cell">${formatCurrency(user.total_spent || 0)}</td>
            <td><span class="status-badge ${user.approval_status}">${getApprovalLabel(user.approval_status)}</span></td>
            <td>
                <button class="btn-icon" onclick="viewUser('${user.id}')" title="Ver detalhes">👁️</button>
                ${user.approval_status === 'approved' ? 
                    `<button class="btn-icon" onclick="suspendUser('${user.id}')" title="Suspender">⛔</button>` :
                    `<button class="btn-icon" onclick="reactivateUser('${user.id}')" title="Reativar">✅</button>`
                }
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    loadUsers();
}

async function viewUser(userId) {
    try {
        const user = await api.getUser(userId);
        
        const content = document.getElementById('userModalContent');
        content.innerHTML = `
            <div class="user-detail-view">
                <div class="approval-header">
                    <div class="approval-avatar">👤</div>
                    <div class="approval-info">
                        <div class="approval-name">${user.name}</div>
                        <div class="approval-email">${user.email}</div>
                    </div>
                </div>
                <div class="approval-details">
                    <div class="approval-detail"><strong>Empresa:</strong> ${user.company || '-'}</div>
                    <div class="approval-detail"><strong>CNPJ:</strong> ${user.cnpj || '-'}</div>
                    <div class="approval-detail"><strong>Tipo:</strong> ${getBusinessTypeLabel(user.business_type)}</div>
                    <div class="approval-detail"><strong>Cadastro:</strong> ${formatDateTime(user.created_at)}</div>
                    <div class="approval-detail"><strong>Último acesso:</strong> ${user.last_login ? formatDateTime(user.last_login) : 'Nunca'}</div>
                    <div class="approval-detail"><strong>Última compra:</strong> ${user.last_purchase ? formatDateTime(user.last_purchase) : 'Nunca'}</div>
                    <div class="approval-detail"><strong>Total pedidos:</strong> ${user.total_orders || 0}</div>
                    <div class="approval-detail"><strong>Total gasto:</strong> ${formatCurrency(user.total_spent || 0)}</div>
                </div>
            </div>
        `;
        
        openModal('userModal');
    } catch (error) {
        alert('Erro ao carregar usuário: ' + error.message);
    }
}

async function suspendUser(userId) {
    const reason = prompt('Motivo da suspensão:');
    if (reason === null) return;
    
    try {
        await api.manageUserApproval(userId, 'suspend', reason);
        alert('✅ Usuário suspenso');
        await loadUsers();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function reactivateUser(userId) {
    if (!confirm('Reativar este usuário?')) return;
    
    try {
        await api.manageUserApproval(userId, 'reactivate');
        alert('✅ Usuário reativado');
        await loadUsers();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// ========== APPROVALS ==========
async function loadApprovals() {
    try {
        const pending = await api.getPendingUsers();
        const suspended = await api.getSuspendedUsers();
        
        renderPendingApprovals(pending);
        renderSuspendedUsers(suspended);
    } catch (error) {
        console.error('Erro ao carregar aprovações:', error);
    }
}

function renderPendingApprovals(pending) {
    const container = document.getElementById('approvalsGrid');
    if (!container) return;
    
    if (pending.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">✅</span><p class="empty-state-text">Nenhuma aprovação pendente</p></div>';
        return;
    }
    
    container.innerHTML = pending.map(user => `
        <div class="approval-card pending">
            <div class="approval-date">${formatRelativeTime(user.created_at)}</div>
            <div class="approval-header">
                <div class="approval-avatar">👤</div>
                <div class="approval-info">
                    <div class="approval-name">${user.name}</div>
                    <div class="approval-email">${user.email}</div>
                </div>
            </div>
            <div class="approval-details">
                <div class="approval-detail"><strong>Empresa:</strong> ${user.company || '-'}</div>
                <div class="approval-detail"><strong>CNPJ:</strong> ${user.cnpj || '-'}</div>
                <div class="approval-detail"><strong>Tipo:</strong> ${getBusinessTypeLabel(user.business_type)}</div>
            </div>
            <div class="approval-actions">
                <button class="btn-primary" onclick="approveUser('${user.id}')">✅ Aprovar</button>
                <button class="btn-danger" onclick="rejectUser('${user.id}')">❌ Recusar</button>
            </div>
        </div>
    `).join('');
}

function renderSuspendedUsers(suspended) {
    const container = document.getElementById('suspendedGrid');
    if (!container) return;
    
    if (suspended.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum usuário suspenso</p></div>';
        return;
    }
    
    container.innerHTML = suspended.map(user => `
        <div class="approval-card suspended">
            <div class="approval-header">
                <div class="approval-avatar">⛔</div>
                <div class="approval-info">
                    <div class="approval-name">${user.name}</div>
                    <div class="approval-email">${user.email}</div>
                </div>
            </div>
            ${user.suspension_reason ? `<div class="suspension-reason">Motivo: ${user.suspension_reason}</div>` : ''}
            <div class="approval-actions">
                <button class="btn-primary" onclick="reactivateUser('${user.id}')">🔓 Reativar</button>
            </div>
        </div>
    `).join('');
}

async function approveUser(userId) {
    if (!confirm('Aprovar este cadastro?')) return;
    
    try {
        await api.manageUserApproval(userId, 'approve');
        alert('✅ Usuário aprovado!');
        await loadApprovals();
        await loadDashboardData();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function rejectUser(userId) {
    const reason = prompt('Motivo da recusa:');
    if (reason === null) return;
    
    try {
        await api.manageUserApproval(userId, 'suspend', reason || 'Cadastro recusado');
        alert('✅ Cadastro recusado');
        await loadApprovals();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// ========== MODALS ==========
function setupModals() {
    // Product form
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
    
    // Campaign form
    document.getElementById('campaignForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCampaign();
    });
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
    document.getElementById('modalOverlay')?.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
    document.getElementById('modalOverlay')?.classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    document.getElementById('modalOverlay')?.classList.remove('show');
}

// Product Modal
function openProductModal() {
    currentEditId = null;
    document.getElementById('productModalTitle').textContent = 'Novo Produto';
    document.getElementById('productForm').reset();
    document.getElementById('productImageUrl').value = '';
    resetImagePreview();
    openModal('productModal');
}

function closeProductModal() {
    closeModal('productModal');
    currentEditId = null;
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId || String(p.id) === productId);
    if (!product) return;
    
    currentEditId = productId;
    document.getElementById('productModalTitle').textContent = 'Editar Produto';
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productMinOrder').value = product.min_order || 1;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productPromoPrice').value = product.promo_price || '';
    document.getElementById('productIsPromo').checked = product.is_promo || false;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImageUrl').value = product.image_url || '';
    
    // Show image preview
    if (product.image_url) {
        const preview = document.getElementById('productImagePreview');
        preview.innerHTML = `<img src="${product.image_url}" alt="Preview">`;
    }
    
    openModal('productModal');
}

async function saveProduct() {
    const formData = new FormData();
    
    formData.append('name', document.getElementById('productName').value);
    formData.append('category', document.getElementById('productCategory').value);
    formData.append('price', parseFloat(document.getElementById('productPrice').value));
    formData.append('unit', document.getElementById('productUnit').value);
    formData.append('min_order', parseInt(document.getElementById('productMinOrder').value) || 1);
    formData.append('stock', parseInt(document.getElementById('productStock').value));
    formData.append('description', document.getElementById('productDescription').value || '');
    formData.append('is_promo', document.getElementById('productIsPromo').checked);
    
    const promoPrice = document.getElementById('productPromoPrice').value;
    if (promoPrice) {
        formData.append('promo_price', parseFloat(promoPrice));
    }
    
    const imageFile = document.getElementById('productImageFile')?.files[0];
    const imageUrl = document.getElementById('productImageUrl').value;
    
    if (imageFile) {
        formData.append('image_file', imageFile);
    } else if (imageUrl) {
        formData.append('image_url', imageUrl);
    }
    
    try {
        if (currentEditId) {
            await api.updateProduct(currentEditId, formData);
            alert('✅ Produto atualizado!');
        } else {
            await api.createProduct(formData);
            alert('✅ Produto criado!');
        }
        
        closeProductModal();
        await loadProducts();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Excluir este produto permanentemente?')) return;
    
    try {
        await api.deleteProduct(productId);
        alert('✅ Produto excluído!');
        await loadProducts();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

function handleProductImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Selecione apenas imagens!');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('productImagePreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

function resetImagePreview() {
    const preview = document.getElementById('productImagePreview');
    if (preview) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <span class="preview-icon">🖼️</span>
                <p>Clique para selecionar</p>
            </div>
        `;
    }
}

// Campaign Modal
function openCampaignModal() {
    currentEditId = null;
    document.getElementById('campaignModalTitle').textContent = 'Nova Campanha';
    document.getElementById('campaignForm').reset();
    
    // Set default dates
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.getElementById('campaignStartDate').value = formatDateTimeLocal(now);
    document.getElementById('campaignEndDate').value = formatDateTimeLocal(endDate);
    
    openModal('campaignModal');
}

function closeCampaignModal() {
    closeModal('campaignModal');
    currentEditId = null;
}

function editCampaign(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId || String(c.id) === campaignId);
    if (!campaign) return;
    
    currentEditId = campaignId;
    document.getElementById('campaignModalTitle').textContent = 'Editar Campanha';
    
    document.getElementById('campaignId').value = campaign.id;
    document.getElementById('campaignName').value = campaign.name;
    document.getElementById('campaignDescription').value = campaign.description || '';
    document.getElementById('campaignDiscountType').value = campaign.discount_type;
    document.getElementById('campaignDiscountValue').value = campaign.discount_value;
    document.getElementById('campaignStartDate').value = formatDateTimeLocal(new Date(campaign.start_date));
    document.getElementById('campaignEndDate').value = formatDateTimeLocal(new Date(campaign.end_date));
    document.getElementById('campaignCategory').value = campaign.category || '';
    
    updateDiscountLabel();
    openModal('campaignModal');
}

async function saveCampaign() {
    const data = {
        name: document.getElementById('campaignName').value,
        description: document.getElementById('campaignDescription').value || null,
        discount_type: document.getElementById('campaignDiscountType').value,
        discount_value: parseFloat(document.getElementById('campaignDiscountValue').value),
        start_date: new Date(document.getElementById('campaignStartDate').value).toISOString(),
        end_date: new Date(document.getElementById('campaignEndDate').value).toISOString(),
        category: document.getElementById('campaignCategory').value || null
    };
    
    try {
        if (currentEditId) {
            await api.updateCampaign(currentEditId, data);
            alert('✅ Campanha atualizada!');
        } else {
            await api.createCampaign(data);
            alert('✅ Campanha criada!');
        }
        
        closeCampaignModal();
        await loadCampaigns();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

function updateDiscountLabel() {
    const type = document.getElementById('campaignDiscountType').value;
    const label = document.getElementById('discountValueLabel');
    if (label) {
        label.textContent = type === 'percentage' ? 'Valor do Desconto (%)' : 'Valor do Desconto (R$)';
    }
}

function closeUserModal() {
    closeModal('userModal');
}

// ========== UTILITIES ==========
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCurrency(value) {
    const num = typeof value === 'number' ? value : parseFloat(value || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(date) {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
}

function formatRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return formatDate(date);
}

function getCategoryLabel(category) {
    const labels = {
        'verduras': 'Verduras',
        'legumes': 'Legumes',
        'frutas': 'Frutas',
        'graos': 'Grãos',
        'temperos': 'Temperos'
    };
    return labels[category] || category || '-';
}

function getStatusLabel(status) {
    const labels = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'em_preparacao': 'Em Preparação',
        'em_transporte': 'Em Transporte',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado',
        'reembolsado': 'Reembolsado'
    };
    return labels[status] || status;
}

function getStatusOptions(currentStatus) {
    const options = [
        { value: 'pendente', label: 'Pendente' },
        { value: 'confirmado', label: 'Confirmado' },
        { value: 'em_preparacao', label: 'Em Preparação' },
        { value: 'em_transporte', label: 'Em Transporte' },
        { value: 'concluido', label: 'Concluído' },
        { value: 'cancelado', label: 'Cancelado' },
        { value: 'reembolsado', label: 'Reembolsado' }
    ];
    
    return options.map(opt => 
        `<option value="${opt.value}" ${opt.value === currentStatus ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
}

function getBusinessTypeLabel(type) {
    const labels = {
        'hotel': '🏨 Hotel',
        'mercado': '🏪 Mercado',
        'restaurante': '🍽️ Restaurante',
        'outros': '📦 Outros'
    };
    return labels[type] || type || '-';
}

function getApprovalLabel(status) {
    const labels = {
        'pending': 'Pendente',
        'approved': 'Ativo',
        'suspended': 'Suspenso'
    };
    return labels[status] || status;
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ========== API EXTENSIONS ==========
// Add missing API methods
if (typeof api !== 'undefined') {
    api.getUserMetrics = async function() {
        return this.request('/users/metrics', { method: 'GET' });
    };
    
    api.getUsers = async function(status = '', businessType = '') {
        let url = '/users/';
        const params = [];
        if (status) params.push(`status=${status}`);
        if (businessType) params.push(`business_type=${businessType}`);
        if (params.length) url += '?' + params.join('&');
        return this.request(url, { method: 'GET' });
    };
    
    api.getUser = async function(userId) {
        return this.request(`/users/${userId}`, { method: 'GET' });
    };
    
    api.getPendingUsers = async function() {
        return this.request('/users/pending', { method: 'GET' });
    };
    
    api.getSuspendedUsers = async function() {
        return this.request('/users/suspended', { method: 'GET' });
    };
    
    api.manageUserApproval = async function(userId, action, reason = null) {
        return this.request(`/users/${userId}/approval`, {
            method: 'POST',
            body: JSON.stringify({ action, reason })
        });
    };
    
    api.getCampaigns = async function(activeOnly = false) {
        const url = activeOnly ? '/campaigns/?active_only=true' : '/campaigns/';
        return this.request(url, { method: 'GET' });
    };
    
    api.createCampaign = async function(data) {
        return this.request('/campaigns/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    };
    
    api.updateCampaign = async function(campaignId, data) {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    };
    
    api.deleteCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}`, { method: 'DELETE' });
    };
    
    api.applyCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}/apply`, { method: 'POST' });
    };
    
    api.removeCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}/remove`, { method: 'POST' });
    };
}

