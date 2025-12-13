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
    setupGlobalFilters();
    
    // Load admin name
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('adminName').textContent = user.name || user.username || 'Admin';
    } catch (e) {}
    
    // Initial load
    await loadDashboardData();
    
    // Populate comboboxes com dados dos usuários
    await populateComboboxes();
    
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
    // Menu mobile removido - sidebar sempre visível
    // Função mantida para compatibilidade
}

// ========== GLOBAL FILTERS ==========
function setupGlobalFilters() {
    // Debounce para filtros de texto
    let filterTimeout;
    const searchInput = document.getElementById('globalSearchInput');
    const cnpjInput = document.getElementById('globalCnpjFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyGlobalFilters, 300);
        });
    }
    
    if (cnpjInput) {
        cnpjInput.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyGlobalFilters, 300);
        });
    }
}

// Dados para os comboboxes
let comboboxData = {
    responsavel: [],
    empresa: [],
    cnpj: [],
    categoria: ['Hotel', 'Mercado', 'Restaurante', 'Padaria', 'Lanchonete', 'Bar', 'Cafeteria', 'Outros']
};

async function populateComboboxes() {
    // Se não tiver usuários carregados, carregar primeiro
    if (!users.length) {
        try {
            users = await api.getUsers();
        } catch (e) {
            console.error('Erro ao carregar usuários para comboboxes:', e);
        }
    }
    
    // Extrair dados únicos dos usuários
    comboboxData.responsavel = [...new Set(users.filter(u => u.name).map(u => u.name))].sort();
    comboboxData.empresa = [...new Set(users.filter(u => u.company).map(u => u.company))].sort();
    comboboxData.cnpj = [...new Set(users.filter(u => u.cnpj).map(u => u.cnpj))].sort();
    
    console.log('📋 Comboboxes populados:', {
        responsaveis: comboboxData.responsavel.length,
        empresas: comboboxData.empresa.length,
        cnpjs: comboboxData.cnpj.length
    });
    
    // Popular todos os dropdowns
    renderComboboxOptions('responsavel');
    renderComboboxOptions('empresa');
    renderComboboxOptions('cnpj');
    renderComboboxOptions('categoria');
}

function renderComboboxOptions(type, filter = '') {
    const dropdown = document.getElementById(`${type}Dropdown`);
    if (!dropdown) return;
    
    const data = comboboxData[type] || [];
    const filtered = filter 
        ? data.filter(item => item.toLowerCase().includes(filter.toLowerCase()))
        : data;
    
    let html = `<div class="combobox-option combobox-option-clear" onclick="selectComboboxOption('${type}', '')">Todos</div>`;
    html += filtered.map(item => 
        `<div class="combobox-option" onclick="selectComboboxOption('${type}', '${item.replace(/'/g, "\\'")}')">${item}</div>`
    ).join('');
    
    dropdown.innerHTML = html;
}

function toggleCombobox(type) {
    const combobox = document.getElementById(`${type}Combobox`);
    const isOpen = combobox.classList.contains('open');
    
    // Fechar todos os outros comboboxes
    document.querySelectorAll('.combobox').forEach(cb => cb.classList.remove('open'));
    
    // Abrir/fechar o atual
    if (!isOpen) {
        combobox.classList.add('open');
        renderComboboxOptions(type); // Resetar filtro ao abrir
    }
}

function filterComboboxOptions(type) {
    const input = document.getElementById(`filter${capitalize(type)}`);
    const value = input?.value || '';
    renderComboboxOptions(type, value);
    
    // Abrir dropdown enquanto digita
    const combobox = document.getElementById(`${type}Combobox`);
    if (value && !combobox.classList.contains('open')) {
        combobox.classList.add('open');
    }
    
    // Aplicar filtros em tempo real
    applyGlobalFilters();
}

function selectComboboxOption(type, value) {
    const input = document.getElementById(`filter${capitalize(type)}`);
    if (input) {
        input.value = value;
    }
    
    // Fechar dropdown
    const combobox = document.getElementById(`${type}Combobox`);
    combobox.classList.remove('open');
    
    // Aplicar filtros
    applyGlobalFilters();
}

// Fechar comboboxes ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.combobox')) {
        document.querySelectorAll('.combobox').forEach(cb => cb.classList.remove('open'));
    }
});


function applyGlobalFilters() {
    const responsavelFilter = document.getElementById('filterResponsavel')?.value.trim() || '';
    const empresaFilter = document.getElementById('filterEmpresa')?.value.trim() || '';
    const cnpjFilter = document.getElementById('filterCnpj')?.value.trim() || '';
    const categoryFilter = document.getElementById('filterCategoria')?.value.trim().toLowerCase() || '';
    
    const filters = { responsavelFilter, empresaFilter, cnpjFilter, categoryFilter };
    console.log('🔍 Aplicando filtros:', filters);
    
    // Aplicar filtro em TODAS as seções (filtro master)
    filterUsersGlobal(filters);
    filterOrdersGlobal(filters);
    
    // Re-render dashboard se estiver nele
    if (currentSection === 'dashboard') {
        filterDashboardMetrics(filters);
    }
}

function clearGlobalFilters() {
    document.getElementById('filterResponsavel').value = '';
    document.getElementById('filterEmpresa').value = '';
    document.getElementById('filterCnpj').value = '';
    document.getElementById('filterCategoria').value = '';
    
    // Re-render all data
    renderUsers();
    renderOrders();
    if (currentSection === 'dashboard') {
        loadDashboardData();
    }
}

function filterDashboardMetrics(filters) {
    const { responsavelFilter, empresaFilter, cnpjFilter, categoryFilter } = filters;
    
    // Filtrar usuários para métricas
    let filteredUsers = users.filter(user => {
        if (responsavelFilter && !user.name?.toLowerCase().includes(responsavelFilter.toLowerCase())) return false;
        if (empresaFilter && !user.company?.toLowerCase().includes(empresaFilter.toLowerCase())) return false;
        if (cnpjFilter && !user.cnpj?.toLowerCase().includes(cnpjFilter.toLowerCase())) return false;
        if (categoryFilter && user.business_type?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        return true;
    });
    
    // Filtrar pedidos dos usuários filtrados
    const filteredUserIds = filteredUsers.map(u => u.id);
    let filteredOrders = orders.filter(o => filteredUserIds.includes(o.user_id));
    
    // Atualizar métricas no dashboard
    const activeClients = filteredUsers.filter(u => u.approval_status === 'approved').length;
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pendente').length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Atualizar cards de KPI
    document.getElementById('kpiActiveClients').textContent = activeClients;
    document.getElementById('kpiTotalOrders').textContent = totalOrders;
    document.getElementById('kpiPendingOrders').textContent = pendingOrders;
    document.getElementById('kpiRevenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
}

function filterUsersGlobal(filters) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const { responsavelFilter, empresaFilter, cnpjFilter, categoryFilter } = filters;
    
    let filteredUsers = users.filter(user => {
        // Filtro por responsável (nome)
        if (responsavelFilter) {
            const matchesResponsavel = user.name?.toLowerCase().includes(responsavelFilter.toLowerCase());
            if (!matchesResponsavel) return false;
        }
        
        // Filtro por empresa
        if (empresaFilter) {
            const matchesEmpresa = user.company?.toLowerCase().includes(empresaFilter.toLowerCase());
            if (!matchesEmpresa) return false;
        }
        
        // Filtro de CNPJ
        if (cnpjFilter) {
            const matchesCnpj = user.cnpj?.toLowerCase().includes(cnpjFilter.toLowerCase());
            if (!matchesCnpj) return false;
        }
        
        // Filtro de categoria/segmento
        if (categoryFilter && user.business_type?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        
        return true;
    });
    
    // Aplicar filtros da seção também (se existirem)
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const statusFilter = document.getElementById('userStatusFilter')?.value || '';
    
    if (roleFilter) filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
    if (statusFilter) filteredUsers = filteredUsers.filter(u => u.approval_status === statusFilter);
    
    renderFilteredUsers(filteredUsers);
}

function renderFilteredUsers(filteredUsers) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum usuário encontrado com os filtros aplicados</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${getRoleIcon(user.role)}</div>
                    <div class="user-details">
                        <span class="user-name-cell">${user.name}</span>
                        <span class="user-email-cell">${user.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="role-badge ${user.role}">${getRoleLabel(user.role)}</span></td>
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

function filterOrdersGlobal(filters) {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;
    
    const { responsavelFilter, empresaFilter, cnpjFilter, categoryFilter } = filters;
    
    let filteredOrders = [...orders];
    
    // Se há filtros de usuário, filtrar pedidos por usuário
    if (responsavelFilter || empresaFilter || cnpjFilter || categoryFilter) {
        // Primeiro encontrar usuários que correspondem
        const matchingUserIds = users.filter(user => {
            if (responsavelFilter) {
                const matchesResponsavel = user.name?.toLowerCase().includes(responsavelFilter.toLowerCase());
                if (!matchesResponsavel) return false;
            }
            if (empresaFilter) {
                const matchesEmpresa = user.company?.toLowerCase().includes(empresaFilter.toLowerCase());
                if (!matchesEmpresa) return false;
            }
            if (cnpjFilter) {
                const matchesCnpj = user.cnpj?.toLowerCase().includes(cnpjFilter.toLowerCase());
                if (!matchesCnpj) return false;
            }
            if (categoryFilter && user.business_type?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
            return true;
        }).map(u => u.id);
        
        filteredOrders = orders.filter(o => matchingUserIds.includes(o.user_id));
    }
    
    // Aplicar filtro de status
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }
    
    renderFilteredOrders(filteredOrders);
}

function renderFilteredOrders(filteredOrders) {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;
    
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">📦</span>
                <p class="empty-state-text">Nenhum pedido encontrado com os filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredOrders.map(order => {
        const user = users.find(u => u.id === order.user_id) || {};
        return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <span class="order-number">#${order.order_number}</span>
                    <span class="order-date">${formatDateTime(order.created_at)}</span>
                </div>
                <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
            </div>
            <div class="order-body">
                <div class="order-customer">
                    <strong>${user.name || 'Cliente'}</strong>
                    <span>${user.company || ''}</span>
                    <small>${user.cnpj || ''}</small>
                </div>
                <div class="order-items">
                    ${(order.items || []).slice(0, 3).map(item => `
                        <span class="order-item">${item.quantity}x ${item.name}</span>
                    `).join('')}
                    ${(order.items || []).length > 3 ? `<span class="order-item">+${order.items.length - 3} itens</span>` : ''}
                </div>
                <div class="order-total">
                    <span class="total-label">Total</span>
                    <span class="total-value">${formatCurrency(order.total)}</span>
                </div>
            </div>
            <div class="order-actions">
                <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pendente" ${order.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="em_preparacao" ${order.status === 'em_preparacao' ? 'selected' : ''}>Em Preparação</option>
                    <option value="em_transporte" ${order.status === 'em_transporte' ? 'selected' : ''}>Em Transporte</option>
                    <option value="concluido" ${order.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                    <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
    `}).join('');
}

function filterProductsGlobal(searchTerm) {
    if (!searchTerm) {
        renderProducts();
        return;
    }
    
    const filtered = products.filter(p => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredProducts(filtered);
}

function renderFilteredProducts(filtered) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(product => {
        const effectivePrice = product.is_promo && product.promo_price ? product.promo_price : product.price;
        return `
            <tr>
                <td>
                    <img src="${product.image_url || 'https://via.placeholder.com/50'}" class="product-thumb" alt="${product.name}">
                </td>
                <td><strong>${product.name}</strong></td>
                <td><span class="category-badge">${product.category}</span></td>
                <td class="money-cell">
                    ${product.is_promo ? `<s style="color: var(--text-muted); font-size: 12px;">R$ ${product.price?.toFixed(2)}</s><br>` : ''}
                    R$ ${effectivePrice?.toFixed(2)}
                </td>
                <td>${product.stock} ${product.unit}</td>
                <td>
                    ${product.is_promo ? '<span class="promo-badge">🔥 Promo</span>' : '<span style="color: var(--text-muted)">-</span>'}
                </td>
                <td>
                    <button class="btn-icon" onclick="openProductModal('${product.id}')" title="Editar">✏️</button>
                    <button class="btn-icon" onclick="deleteProduct('${product.id}')" title="Excluir">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterCampaignsGlobal(searchTerm) {
    if (!searchTerm) {
        renderCampaigns();
        return;
    }
    
    const filtered = campaigns.filter(c => 
        c.name?.toLowerCase().includes(searchTerm) ||
        c.description?.toLowerCase().includes(searchTerm)
    );
    
    // Renderizar campanhas filtradas
    const container = document.getElementById('campaignsContainer');
    if (container && filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="empty-state-icon">🎯</span>
                <p class="empty-state-text">Nenhuma campanha encontrada</p>
            </div>
        `;
    }
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
        
        // Render TPV chart
        renderTPVChart(orders, 7);
        setupTPVPeriodSelector();
        
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
        container.innerHTML = '<div style="text-align: center; padding: 32px; color: #64748b;">Nenhum dado disponível</div>';
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

// ========== TPV CHART ==========
function renderTPVChart(ordersData, days = 7) {
    const container = document.getElementById('tpvChart');
    const totalEl = document.getElementById('tpvTotal');
    const averageEl = document.getElementById('tpvAverage');
    
    if (!container) return;
    
    // Calcular datas
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    
    // Agrupar pedidos por dia
    const dailyTotals = {};
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyTotals[dateKey] = 0;
    }
    
    // Somar valores dos pedidos
    ordersData.forEach(order => {
        if (!order.created_at) return;
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (dailyTotals.hasOwnProperty(orderDate)) {
            dailyTotals[orderDate] += parseFloat(order.total) || 0;
        }
    });
    
    // Calcular totais
    const values = Object.values(dailyTotals);
    const total = values.reduce((sum, v) => sum + v, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const maxValue = Math.max(...values, 1);
    
    // Atualizar resumo
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (averageEl) averageEl.textContent = formatCurrency(average);
    
    // Renderizar barras
    const entries = Object.entries(dailyTotals);
    container.innerHTML = entries.map(([date, value]) => {
        const height = maxValue > 0 ? (value / maxValue) * 180 : 0;
        const dateObj = new Date(date + 'T12:00:00');
        const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayNum = dateObj.getDate();
        
        return `
            <div class="tpv-bar-container">
                <div class="tpv-bar" style="height: ${Math.max(height, 4)}px">
                    <div class="tpv-bar-tooltip">
                        ${formatCurrency(value)}<br>
                        <small>${dateObj.toLocaleDateString('pt-BR')}</small>
                    </div>
                </div>
                <span class="tpv-date">${dayName}<br>${dayNum}</span>
            </div>
        `;
    }).join('');
}

function setupTPVPeriodSelector() {
    const buttons = document.querySelectorAll('.period-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            buttons.forEach(b => b.classList.remove('active'));
            // Adicionar active ao clicado
            btn.classList.add('active');
            
            // Atualizar gráfico
            const days = parseInt(btn.dataset.period);
            renderTPVChart(orders, days);
        });
    });
}

function renderTopCustomers(customers) {
    const container = document.getElementById('topCustomers');
    if (!container) return;
    
    if (customers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 32px; color: #64748b;">Nenhum cliente com compras ainda</div>';
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
        container.innerHTML = '<div style="text-align: center; padding: 32px; color: #64748b;">Nenhum pedido recente</div>';
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
        container.innerHTML = '<div style="text-align: center; padding: 32px; color: #64748b;">Nenhum cadastro recente</div>';
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
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">📦</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum produto cadastrado</p>
                <button class="btn-primary" onclick="openProductModal()">➕ Novo Produto</button>
            </div>`;
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
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">🔍</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum produto encontrado</p>
            </div>`;
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
    console.log('📡 Recarregando campanhas...');
    try {
        const activeOnly = document.getElementById('activeOnlyFilter')?.checked || false;
        campaigns = await api.getCampaigns(activeOnly);
        console.log('✅ Campanhas carregadas:', campaigns.length, campaigns.map(c => ({ name: c.name, status: c.status })));
        renderCampaigns();
    } catch (error) {
        console.error('❌ Erro ao carregar campanhas:', error);
        campaigns = [];
        renderCampaigns();
    }
}

function renderCampaigns() {
    const container = document.getElementById('campaignsList');
    if (!container) return;
    
    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">🎯</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhuma campanha cadastrada</p>
                <button class="btn-primary" onclick="openCampaignModal()">➕ Criar Campanha</button>
            </div>`;
        return;
    }
    
    const now = new Date();
    
    container.innerHTML = campaigns.map(campaign => {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const nowTime = now.getTime();
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        
        // Verificar status da campanha (do backend)
        const campaignStatus = campaign.status || 'active';
        
        let status = 'inactive';
        let statusLabel = 'Inativa';
        
        // Status baseado no campo status da campanha
        if (campaignStatus === 'paused') {
            status = 'paused';
            statusLabel = 'Pausada';
        } else if (campaignStatus === 'suspended') {
            status = 'suspended';
            statusLabel = 'Suspensa';
        } else if (campaign.is_active) {
            const tolerance = 60 * 1000;
            
            if (nowTime < startTime - tolerance) {
                status = 'scheduled';
                statusLabel = 'Agendada';
            } else if (nowTime <= endTime + tolerance) {
                status = 'active';
                statusLabel = 'Ativa';
            } else {
                status = 'expired';
                statusLabel = 'Expirada';
            }
        }
        
        const discountDisplay = campaign.discount_type === 'percentage' 
            ? `-${campaign.discount_value}%` 
            : `-R$ ${campaign.discount_value.toFixed(2)}`;
        
        // Todos os botões sempre visíveis, desabilitados quando não aplicável
        const canApply = status === 'scheduled' || status === 'expired' || status === 'paused';
        const canPause = status === 'active';
        const canResume = status === 'paused';
        const canSuspend = status !== 'suspended';
        
        const actionButtons = `
            <button class="btn-secondary btn-sm ${!canApply ? 'btn-disabled' : ''}" 
                    onclick="${canApply ? `applyCampaign('${campaign.id}')` : 'return false'}" 
                    title="Aplicar campanha"
                    ${!canApply ? 'disabled' : ''}>
                ⚡ Aplicar
            </button>
            <button class="btn-secondary btn-sm ${!canPause ? 'btn-disabled' : ''}" 
                    onclick="${canPause ? `pauseCampaign('${campaign.id}')` : 'return false'}" 
                    title="Pausar campanha"
                    ${!canPause ? 'disabled' : ''}>
                ⏸️ Pausar
            </button>
            <button class="btn-secondary btn-sm ${!canResume ? 'btn-disabled' : ''}" 
                    onclick="${canResume ? `resumeCampaign('${campaign.id}')` : 'return false'}" 
                    title="Resumir campanha"
                    ${!canResume ? 'disabled' : ''}>
                ▶️ Resumir
            </button>
            <button class="btn-secondary btn-sm btn-danger-text ${!canSuspend ? 'btn-disabled' : ''}" 
                    onclick="${canSuspend ? `suspendCampaign('${campaign.id}')` : 'return false'}" 
                    title="Suspender permanentemente"
                    ${!canSuspend ? 'disabled' : ''}>
                ⛔ Suspender
            </button>
        `;
        
        return `
            <div class="campaign-card ${status === 'suspended' || status === 'expired' ? 'inactive' : ''}">
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
                    ${actionButtons}
                    <button class="btn-icon edit" onclick="editCampaign('${campaign.id}')" title="Editar campanha">✏️</button>
                    <button class="btn-icon delete" onclick="deleteCampaign('${campaign.id}')" title="Excluir campanha">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterCampaigns() {
    loadCampaigns();
}

async function applyCampaign(campaignId) {
    if (!confirm('Aplicar esta campanha AGORA aos produtos? Isso atualizará os preços promocionais imediatamente.')) return;
    
    try {
        console.log('⚡ Aplicando campanha:', campaignId);
        const result = await api.applyCampaign(campaignId);
        console.log('✅ Resultado:', result);
        showNotification(`✅ ${result.message}`, 'success');
        
        // Forçar atualização imediata
        console.log('🔄 Atualizando lista de campanhas...');
        await reloadCampaignsNow();
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('❌ Erro ao aplicar campanha: ' + error.message, 'error');
    }
}

async function pauseCampaign(campaignId) {
    if (!confirm('Pausar esta campanha? Os produtos voltarão ao preço normal, mas você pode resumir depois.')) return;
    
    try {
        console.log('⏸️ Pausando campanha:', campaignId);
        const result = await api.pauseCampaign(campaignId);
        console.log('✅ Resultado:', result);
        showNotification(`⏸️ ${result.message}`, 'success');
        
        // Forçar atualização imediata
        console.log('🔄 Atualizando lista de campanhas...');
        await reloadCampaignsNow();
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('❌ Erro ao pausar campanha: ' + error.message, 'error');
    }
}

async function resumeCampaign(campaignId) {
    if (!confirm('Resumir esta campanha? Os descontos serão reaplicados aos produtos.')) return;
    
    try {
        console.log('▶️ Resumindo campanha:', campaignId);
        const result = await api.resumeCampaign(campaignId);
        console.log('✅ Resultado:', result);
        showNotification(`▶️ ${result.message}`, 'success');
        
        // Forçar atualização imediata
        console.log('🔄 Atualizando lista de campanhas...');
        await reloadCampaignsNow();
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('❌ Erro ao resumir campanha: ' + error.message, 'error');
    }
}

async function suspendCampaign(campaignId) {
    if (!confirm('⚠️ SUSPENDER esta campanha PERMANENTEMENTE? Os produtos voltarão ao preço normal e a campanha NÃO poderá ser resumida.')) return;
    
    try {
        console.log('⛔ Suspendendo campanha:', campaignId);
        const result = await api.suspendCampaign(campaignId);
        console.log('✅ Resultado:', result);
        showNotification(`⛔ ${result.message}`, 'warning');
        
        // Forçar atualização imediata
        console.log('🔄 Atualizando lista de campanhas...');
        await reloadCampaignsNow();
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('❌ Erro ao suspender campanha: ' + error.message, 'error');
    }
}

// Função para forçar reload imediato das campanhas
async function reloadCampaignsNow() {
    try {
        const activeOnly = document.getElementById('activeOnlyFilter')?.checked || false;
        const timestamp = Date.now();
        const url = activeOnly 
            ? `/campaigns/?active_only=true&_t=${timestamp}` 
            : `/campaigns/?_t=${timestamp}`;
        
        console.log('📡 Buscando campanhas:', url);
        const newCampaigns = await api.request(url, { method: 'GET' });
        console.log('📦 Campanhas recebidas:', newCampaigns.map(c => ({ name: c.name, status: c.status })));
        
        // Atualizar array global
        campaigns = newCampaigns;
        
        // Re-renderizar
        renderCampaigns();
        console.log('✅ Campanhas renderizadas!');
        
        // Atualizar produtos também
        await loadProducts();
    } catch (error) {
        console.error('❌ Erro ao recarregar campanhas:', error);
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
        container.innerHTML = `
            <div class="empty-state" style="background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">📋</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum pedido encontrado</p>
            </div>`;
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
    applyGlobalFilters();
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
        const role = document.getElementById('userRoleFilter')?.value || '';
        
        users = await api.getUsers(status, businessType, role);
        renderUsers();
        populateComboboxes(); // Atualizar comboboxes com dados dos usuários
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        users = [];
        renderUsers();
    }
}

// Criar novo usuário (consultor ou admin)
async function openNewUserModal() {
    document.getElementById('newUserForm').reset();
    document.getElementById('newUserRole').value = 'cliente';
    toggleClienteFields();
    openModal('newUserModal');
}

// Mostrar/ocultar campos específicos de cliente
function toggleClienteFields() {
    const role = document.getElementById('newUserRole').value;
    const clienteFields = document.getElementById('clienteFields');
    
    if (role === 'cliente') {
        clienteFields.style.display = 'block';
    } else {
        clienteFields.style.display = 'none';
    }
}

async function saveNewUser() {
    const form = document.getElementById('newUserForm');
    const formData = new FormData(form);
    
    const role = formData.get('role');
    
    const userData = {
        email: formData.get('email'),
        username: formData.get('username'),
        name: formData.get('name'),
        password: formData.get('password'),
        role: role,
        company: formData.get('company') || null,
        phone: formData.get('phone') || null
    };
    
    // Adicionar campos de cliente se for cliente
    if (role === 'cliente') {
        userData.cnpj = formData.get('cnpj') || null;
        userData.business_type = formData.get('business_type') || null;
    }
    
    // Validação
    if (!userData.email || !userData.username || !userData.name || !userData.password) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    if (userData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        await api.createUser(userData);
        closeModal('newUserModal');
        showNotification('✅ Usuário criado com sucesso!', 'success');
        await loadUsers();
    } catch (error) {
        alert('❌ Erro ao criar usuário: ' + error.message);
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${getRoleIcon(user.role)}</div>
                    <div class="user-details">
                        <span class="user-name-cell">${user.name}</span>
                        <span class="user-email-cell">${user.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="role-badge ${user.role}">${getRoleLabel(user.role)}</span></td>
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

function getRoleIcon(role) {
    switch (role) {
        case 'admin': return '👑';
        case 'consultor': return '🎯';
        default: return '👤';
    }
}

function getRoleLabel(role) {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'consultor': return 'Consultor';
        default: return 'Cliente';
    }
}

function filterUsers() {
    applyGlobalFilters();
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
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">✅</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhuma aprovação pendente</p>
            </div>`;
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
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">👥</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum usuário suspenso</p>
            </div>`;
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
        showImagePreview(product.image_url);
    } else {
        resetImagePreview();
    }
    
    openModal('productModal');
}

// Flag para evitar duplo salvamento
let isSavingProduct = false;

async function saveProduct() {
    // Evitar duplo clique
    if (isSavingProduct) {
        console.log('⏳ Já está salvando, aguarde...');
        return;
    }
    
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const unit = document.getElementById('productUnit').value;
    const minOrder = document.getElementById('productMinOrder').value || '1';
    const stock = document.getElementById('productStock').value;
    const description = document.getElementById('productDescription').value || '';
    const isPromo = document.getElementById('productIsPromo').checked;
    const promoPrice = document.getElementById('productPromoPrice').value;
    
    // Validação básica
    if (!name || !category || !price || !unit || !stock) {
        alert('❌ Preencha todos os campos obrigatórios');
        return;
    }
    
    // Bloquear duplo salvamento
    isSavingProduct = true;
    const saveBtn = document.querySelector('#productForm button[type="submit"]');
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Salvando...';
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('unit', unit);
    formData.append('min_order', minOrder);
    formData.append('stock', stock);
    formData.append('description', description);
    
    // Boolean como string para FormData
    if (isPromo) {
        formData.append('is_promo', 'true');
        if (promoPrice) {
            formData.append('promo_price', promoPrice);
        }
    }
    
    const imageFile = document.getElementById('productImageFile')?.files[0];
    const imageUrl = document.getElementById('productImageUrl').value;
    
    if (imageFile) {
        formData.append('image_file', imageFile);
    } else if (imageUrl) {
        formData.append('image_url', imageUrl);
    }
    
    // Debug
    console.log('📦 Salvando produto...');
    for (let [key, value] of formData.entries()) {
        console.log(`   ${key}: ${value}`);
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
        console.error('❌ Erro ao salvar produto:', error);
        alert('❌ Erro: ' + error.message);
    } finally {
        // Desbloquear salvamento
        isSavingProduct = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText || 'Salvar';
        }
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

// ========== PROMO ORDER (Drag & Drop) ==========

let promoOrderVisible = false;

function togglePromoOrder() {
    const panel = document.getElementById('promoOrderPanel');
    const grid = document.getElementById('productsGrid');
    
    promoOrderVisible = !promoOrderVisible;
    
    if (promoOrderVisible) {
        panel.style.display = 'block';
        grid.style.display = 'none';
        renderPromoOrderList();
    } else {
        panel.style.display = 'none';
        grid.style.display = 'grid';
    }
}

// Abrir modo de edição de produtos (mostrar grid com opções de editar/deletar)
function openEditProductsMode() {
    // Fechar painel de ordenar promoções se estiver aberto
    const promoPanel = document.getElementById('promoOrderPanel');
    const grid = document.getElementById('productsGrid');
    
    if (promoPanel) {
        promoPanel.style.display = 'none';
    }
    if (grid) {
        grid.style.display = 'grid';
    }
    promoOrderVisible = false;
    
    // Rolar até a lista de produtos
    const productsSection = document.getElementById('sectionProducts');
    if (productsSection) {
        const gridElement = productsSection.querySelector('.products-grid');
        if (gridElement) {
            gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    showNotification('Clique em um produto para editar ou use os botões de ação', 'info');
}

function renderPromoOrderList() {
    const container = document.getElementById('promoOrderList');
    if (!container) return;
    
    // Filtrar apenas produtos em promoção e ordenar por display_order
    const promoProducts = products
        .filter(p => p.is_promo || p.isPromo)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    if (promoProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🎯</span>
                <p>Nenhum produto em promoção</p>
                <small>Marque produtos como "Em Promoção" para aparecerem aqui</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = promoProducts.map((product, index) => `
        <div class="promo-order-item" 
             draggable="true" 
             data-id="${product.id}"
             data-order="${index}"
             ondragstart="handleDragStart(event)"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event)"
             ondragend="handleDragEnd(event)">
            <span class="promo-order-handle">☰</span>
            <span class="promo-order-position">${index + 1}</span>
            <img class="promo-order-image" src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}">
            <div class="promo-order-info">
                <div class="promo-order-name">${product.name}</div>
                <div class="promo-order-price">
                    ${product.promo_price ? `
                        <span class="original">R$ ${parseFloat(product.price).toFixed(2)}</span>
                        <span class="promo">R$ ${parseFloat(product.promo_price).toFixed(2)}</span>
                    ` : `
                        <span class="promo">R$ ${parseFloat(product.price).toFixed(2)}</span>
                    `}
                </div>
            </div>
        </div>
    `).join('');
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.target.closest('.promo-order-item');
    draggedItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetItem = e.target.closest('.promo-order-item');
    if (targetItem && targetItem !== draggedItem) {
        targetItem.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetItem = e.target.closest('.promo-order-item');
    if (targetItem) {
        targetItem.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const targetItem = e.target.closest('.promo-order-item');
    if (!targetItem || targetItem === draggedItem) return;
    
    targetItem.classList.remove('drag-over');
    
    const container = document.getElementById('promoOrderList');
    const items = Array.from(container.querySelectorAll('.promo-order-item'));
    const draggedIndex = items.indexOf(draggedItem);
    const targetIndex = items.indexOf(targetItem);
    
    // Reordenar no DOM
    if (draggedIndex < targetIndex) {
        targetItem.parentNode.insertBefore(draggedItem, targetItem.nextSibling);
    } else {
        targetItem.parentNode.insertBefore(draggedItem, targetItem);
    }
    
    // Atualizar números de posição
    updatePositionNumbers();
}

function handleDragEnd(e) {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    
    document.querySelectorAll('.promo-order-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    draggedItem = null;
}

function updatePositionNumbers() {
    const items = document.querySelectorAll('.promo-order-item');
    items.forEach((item, index) => {
        const positionEl = item.querySelector('.promo-order-position');
        if (positionEl) {
            positionEl.textContent = index + 1;
        }
        item.dataset.order = index;
    });
}

async function savePromoOrder() {
    const items = document.querySelectorAll('.promo-order-item');
    const orderData = [];
    
    items.forEach((item, index) => {
        orderData.push({
            id: item.dataset.id,
            display_order: index + 1
        });
    });
    
    console.log('📊 Salvando ordem:', orderData);
    
    try {
        await api.updateProductsOrder(orderData);
        alert('✅ Ordem salva com sucesso!');
        
        // Recarregar produtos para atualizar a ordem no array local
        await loadProducts();
        renderPromoOrderList();
    } catch (error) {
        console.error('❌ Erro ao salvar ordem:', error);
        alert('❌ Erro ao salvar ordem: ' + error.message);
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
    
    // Limite de 5MB - se maior, comprimir
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (file.size > MAX_SIZE) {
        console.log(`📷 Imagem grande (${(file.size / 1024 / 1024).toFixed(2)}MB), comprimindo...`);
        compressImage(file, (compressedFile) => {
            // Substituir o arquivo no input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(compressedFile);
            input.files = dataTransfer.files;
            
            const reader = new FileReader();
            reader.onload = (e) => showImagePreview(e.target.result);
            reader.readAsDataURL(compressedFile);
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => showImagePreview(e.target.result);
        reader.readAsDataURL(file);
    }
}

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Redimensionar para máximo 1920px mantendo proporção (Full HD)
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;
            
            // Só redimensionar se for maior que o máximo
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * MAX_WIDTH / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                    }
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para blob com qualidade 0.92 (alta qualidade)
            canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                console.log(`✅ Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                callback(compressedFile);
            }, 'image/jpeg', 0.92);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageSrc) {
    const placeholder = document.getElementById('previewPlaceholder');
    const previewImage = document.getElementById('previewImage');
    const imageActions = document.getElementById('imageActions');
    
    if (placeholder) placeholder.style.display = 'none';
    if (previewImage) {
        previewImage.src = imageSrc;
        previewImage.style.display = 'block';
    }
    if (imageActions) imageActions.style.display = 'flex';
}

function removeProductImage() {
    const placeholder = document.getElementById('previewPlaceholder');
    const previewImage = document.getElementById('previewImage');
    const imageActions = document.getElementById('imageActions');
    const fileInput = document.getElementById('productImageFile');
    const urlInput = document.getElementById('productImageUrl');
    
    if (placeholder) placeholder.style.display = 'flex';
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
    }
    if (imageActions) imageActions.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

function resetImagePreview() {
    removeProductImage();
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
        'vegetais': 'Vegetais',
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
    
    api.getUsers = async function(status = '', businessType = '', role = '') {
        let url = '/users/';
        const params = [];
        if (role) params.push(`role=${role}`);
        if (status) params.push(`status=${status}`);
        if (businessType) params.push(`business_type=${businessType}`);
        if (params.length) url += '?' + params.join('&');
        return this.request(url, { method: 'GET' });
    };
    
    api.createUser = async function(userData) {
        return this.request('/users/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
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
        // Adicionar timestamp para evitar cache
        const timestamp = Date.now();
        const url = activeOnly 
            ? `/campaigns/?active_only=true&_t=${timestamp}` 
            : `/campaigns/?_t=${timestamp}`;
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
    
    api.pauseCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}/pause`, { method: 'POST' });
    };
    
    api.resumeCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}/resume`, { method: 'POST' });
    };
    
    api.suspendCampaign = async function(campaignId) {
        return this.request(`/campaigns/${campaignId}/suspend`, { method: 'POST' });
    };
}

