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

// ========== NOTIFICATIONS ==========
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <img src="images/icons/close.svg" alt="Fechar" style="width: 14px; height: 14px; filter: brightness(0) invert(1);">
        </button>
    `;
    
    // Estilos inline para garantir que funcione
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        animation: notificationSlideIn 0.3s ease;
        max-width: 420px;
        backdrop-filter: blur(8px);
    `;
    
    // Estilo do botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.15);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
        flex-shrink: 0;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.15)';
    
    // Cor baseada no tipo
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
    
    // Adicionar animação CSS se não existir
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes notificationSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes notificationSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'notificationSlideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Modal de confirmação customizado
function showConfirmModal(title, message, onConfirm, onCancel = null) {
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.cssText = `
        background: linear-gradient(180deg, #2a323c 0%, #1e252d 100%);
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: modalSlideIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="color: #fff; margin: 0; font-size: 1.25rem;">${title}</h3>
            <button class="confirm-modal-close" style="
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s ease;
            ">
                <img src="images/icons/close.svg" alt="Fechar" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
            </button>
        </div>
        <p style="color: #9ca3af; margin: 0 0 24px 0; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="confirm-modal-cancel" style="
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                color: #fff;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            ">Cancelar</button>
            <button class="confirm-modal-ok" style="
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border: none;
                border-radius: 8px;
                padding: 10px 24px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                box-shadow: 0 4px 12px rgba(34,197,94,0.3);
            ">Confirmar</button>
        </div>
    `;
    
    // Adicionar estilos de animação
    if (!document.getElementById('confirm-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'confirm-modal-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const closeModal = () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    modal.querySelector('.confirm-modal-close').onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };
    
    modal.querySelector('.confirm-modal-cancel').onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };
    
    modal.querySelector('.confirm-modal-ok').onclick = () => {
        closeModal();
        onConfirm();
    };
    
    // Fechar ao clicar no overlay
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal();
            if (onCancel) onCancel();
        }
    };
    
    // Hover effects
    const cancelBtn = modal.querySelector('.confirm-modal-cancel');
    cancelBtn.onmouseover = () => cancelBtn.style.background = 'rgba(255,255,255,0.2)';
    cancelBtn.onmouseout = () => cancelBtn.style.background = 'rgba(255,255,255,0.1)';
    
    const okBtn = modal.querySelector('.confirm-modal-ok');
    okBtn.onmouseover = () => { okBtn.style.transform = 'scale(1.02)'; okBtn.style.boxShadow = '0 6px 16px rgba(34,197,94,0.4)'; };
    okBtn.onmouseout = () => { okBtn.style.transform = 'scale(1)'; okBtn.style.boxShadow = '0 4px 12px rgba(34,197,94,0.3)'; };
    
    const closeBtn = modal.querySelector('.confirm-modal-close');
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
}

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
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || sectionName;
    }
    
    // Show/hide back to dashboard button
    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) {
        if (sectionName === 'dashboard') {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'flex';
        }
    }
    
    // Update mobile menu active state
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionName);
    });
    
    // Load section data
    loadSectionData(sectionName);
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
        toggleMobileMenu();
    }
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
            // Carregar produtos primeiro para validar min_order
            if (products.length === 0) {
                await loadProducts();
            }
            await loadOrders();
            // Renderizar apenas a lista de pedidos (sem separação)
            renderOrders();
            break;
        case 'separation':
            // Carregar produtos primeiro para validar min_order
            if (products.length === 0) {
                await loadProducts();
            }
            // Carregar pedidos se ainda não foram carregados
            if (orders.length === 0) {
                await loadOrders();
            }
            // Carregar usuários para obter informações dos clientes
            if (users.length === 0) {
                await loadUsers();
            }
            // Renderizar tela de separação
            renderSeparationOrders();
            break;
        case 'transport':
            // Carregar pedidos primeiro se ainda não foram carregados
            if (orders.length === 0) {
                await loadOrders();
            }
            // Carregar usuários para obter informações dos clientes
            if (users.length === 0) {
                await loadUsers();
            }
            // Renderizar pedidos em transporte
            loadTransport();
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
    // Mobile menu toggle function
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const toggle = document.getElementById('mobileMenuToggle');
    
    if (menu && overlay && toggle) {
        const isOpen = menu.classList.contains('open');
        
        if (isOpen) {
            menu.classList.remove('open');
            overlay.classList.remove('active');
            toggle.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            menu.classList.add('open');
            overlay.classList.add('active');
            toggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Expor função globalmente
window.toggleMobileMenu = toggleMobileMenu;

// ========== GLOBAL FILTERS ==========
function toggleFilters() {
    const filtersBar = document.getElementById('globalFiltersBar');
    const toggleBtn = document.getElementById('filterToggleBtn');
    const filterArrow = document.getElementById('filterArrow');
    
    if (filtersBar && toggleBtn) {
        const isExpanded = filtersBar.classList.contains('expanded');
        
        if (isExpanded) {
            filtersBar.classList.remove('expanded');
            filtersBar.style.display = 'none';
            toggleBtn.classList.remove('active');
        } else {
            filtersBar.style.display = 'flex';
            // Pequeno delay para garantir que o display está aplicado antes da animação
            setTimeout(() => {
                filtersBar.classList.add('expanded');
                toggleBtn.classList.add('active');
            }, 10);
        }
    }
}

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
        const pendingCount = metrics.pending_approval || 0;
        const pendingBadge = document.getElementById('pendingBadge');
        const mobilePendingBadge = document.getElementById('mobilePendingBadge');
        
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount;
        }
        
        if (mobilePendingBadge) {
            mobilePendingBadge.textContent = pendingCount;
        }
        
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
        
        // Render summary cards
        renderSummaryCards(metrics, orders);
        
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
    console.log('🎨 renderCampaigns() chamado com', campaigns.length, 'campanhas');
    const container = document.getElementById('campaignsList');
    if (!container) {
        console.error('❌ Container campaignsList não encontrado!');
        return;
    }
    console.log('📍 Container encontrado:', container.id);
    
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
        // O status pode ser: null (não aplicada), 'active', 'paused', 'suspended'
        const campaignStatus = campaign.status;
        
        let status = 'inactive';
        let statusLabel = 'Inativa';
        
        // Status baseado no campo status da campanha
        if (campaignStatus === 'paused') {
            status = 'paused';
            statusLabel = 'Pausada';
        } else if (campaignStatus === 'suspended') {
            status = 'suspended';
            statusLabel = 'Suspensa';
        } else if (campaignStatus === 'active') {
            // Foi explicitamente aplicada pelo admin - confiar no backend
            status = 'active';
            statusLabel = 'Ativa';
        } else {
            // Campanha ainda não foi aplicada - usar comparação de datas
            const tolerance = 60 * 1000;
            
            if (nowTime < startTime - tolerance) {
                status = 'scheduled';
                statusLabel = 'Agendada';
            } else if (nowTime <= endTime + tolerance && campaign.is_active) {
                // Está no período e is_active = true
                status = 'active';
                statusLabel = 'Ativa';
            } else if (nowTime > endTime + tolerance) {
                status = 'expired';
                statusLabel = 'Expirada';
            } else {
                status = 'scheduled';
                statusLabel = 'Agendada';
            }
        }
        
        const discountDisplay = campaign.discount_type === 'percentage' 
            ? `-${campaign.discount_value}%` 
            : `-R$ ${campaign.discount_value.toFixed(2)}`;
        
        // Todos os botões sempre visíveis, desabilitados quando não aplicável
        // Aplicar só quando agendada (não iniciou ainda)
        const canApply = status === 'scheduled';
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
    showConfirmModal(
        '⚡ Aplicar Campanha',
        'Aplicar esta campanha AGORA aos produtos? Isso atualizará os preços promocionais imediatamente. Se a data de início ainda não chegou, ela será atualizada para agora.',
        async () => {
            try {
                console.log('⚡ Aplicando campanha:', campaignId);
                const result = await api.applyCampaign(campaignId);
                console.log('✅ Resultado:', result);
                showNotification(`✅ ${result.message}`, 'success');
                // Passar start_date atualizado do backend
                updateCampaignStatusLocally(campaignId, 'active', {
                    start_date: result.start_date,
                    is_active: result.is_active
                });
            } catch (error) {
                console.error('❌ Erro:', error);
                showNotification('❌ Erro ao aplicar campanha: ' + error.message, 'error');
            }
        }
    );
}

// Função que FORÇA refresh das campanhas destruindo e recriando o HTML
async function forceRefreshCampaigns() {
    console.log('🔄 FORÇANDO refresh de campanhas...');
    
    // 1. Buscar dados frescos do servidor
    const timestamp = Date.now();
    const url = `/campaigns/?_t=${timestamp}`;
    console.log('📡 Buscando:', url);
    
    const freshData = await api.request(url, { method: 'GET' });
    console.log('📦 Recebido:', freshData.length, 'campanhas');
    freshData.forEach(c => console.log(`  - ${c.name}: status=${c.status}`));
    
    // 2. Atualizar variável global
    campaigns = freshData;
    
    // 3. Pegar o container
    const container = document.getElementById('campaignsList');
    if (!container) {
        console.error('❌ Container campaignsList não encontrado!');
        return;
    }
    
    // 4. DESTRUIR o conteúdo atual
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Atualizando...</div>';
    
    // 5. Aguardar o DOM atualizar
    await new Promise(r => setTimeout(r, 100));
    
    // 6. Re-renderizar
    renderCampaigns();
    console.log('✅ Campanhas re-renderizadas!');
    
    // 7. Atualizar produtos também
    loadProducts();
}

async function pauseCampaign(campaignId) {
    showConfirmModal(
        '⏸️ Pausar Campanha',
        'Pausar esta campanha? Os produtos voltarão ao preço normal, mas você pode resumir depois.',
        async () => {
            try {
                console.log('⏸️ Pausando campanha:', campaignId);
                const result = await api.pauseCampaign(campaignId);
                console.log('✅ Resultado:', result);
                showNotification(`⏸️ ${result.message}`, 'success');
                updateCampaignStatusLocally(campaignId, 'paused');
            } catch (error) {
                console.error('❌ Erro:', error);
                showNotification('❌ Erro ao pausar campanha: ' + error.message, 'error');
            }
        }
    );
}

async function resumeCampaign(campaignId) {
    showConfirmModal(
        '▶️ Resumir Campanha',
        'Resumir esta campanha? Os descontos serão reaplicados aos produtos.',
        async () => {
            try {
                console.log('▶️ Resumindo campanha:', campaignId);
                const result = await api.resumeCampaign(campaignId);
                console.log('✅ Resultado:', result);
                showNotification(`▶️ ${result.message}`, 'success');
                updateCampaignStatusLocally(campaignId, 'active');
            } catch (error) {
                console.error('❌ Erro:', error);
                showNotification('❌ Erro ao resumir campanha: ' + error.message, 'error');
            }
        }
    );
}

async function suspendCampaign(campaignId) {
    showConfirmModal(
        '⚠️ Suspender Campanha',
        'SUSPENDER esta campanha PERMANENTEMENTE? Os produtos voltarão ao preço normal e a campanha NÃO poderá ser resumida.',
        async () => {
            try {
                console.log('⛔ Suspendendo campanha:', campaignId);
                const result = await api.suspendCampaign(campaignId);
                console.log('✅ Resultado:', result);
                showNotification(`⛔ ${result.message}`, 'warning');
                updateCampaignStatusLocally(campaignId, 'suspended');
            } catch (error) {
                console.error('❌ Erro:', error);
                showNotification('❌ Erro ao suspender campanha: ' + error.message, 'error');
            }
        }
    );
}

// Atualizar status da campanha localmente e re-renderizar com animação
function updateCampaignStatusLocally(campaignId, newStatus, extraData = {}) {
    console.log(`🔄 Atualizando campanha ${campaignId} para status: ${newStatus}`, extraData);
    
    // 1. Encontrar a campanha no array local
    const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
        console.error('❌ Campanha não encontrada no array local');
        return;
    }
    
    // 2. Atualizar o status localmente
    campaigns[campaignIndex].status = newStatus;
    campaigns[campaignIndex].is_active = newStatus === 'active';
    
    // 3. Atualizar dados extras (como start_date quando aplica campanha)
    if (extraData.start_date) {
        campaigns[campaignIndex].start_date = extraData.start_date;
    }
    if (extraData.is_active !== undefined) {
        campaigns[campaignIndex].is_active = extraData.is_active;
    }
    
    console.log('✅ Status atualizado localmente:', campaigns[campaignIndex]);
    
    // 3. Re-renderizar toda a lista com animação
    const container = document.getElementById('campaignsList');
    if (container) {
        // Adicionar classe de fade-out
        container.style.opacity = '0.5';
        container.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
            // Re-renderizar
            renderCampaigns();
            
            // Fade-in
            container.style.opacity = '1';
            console.log('✅ Cards re-renderizados!');
        }, 200);
    }
    
    // 4. Atualizar produtos também
    loadProducts();
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
        
        // Forçar limpeza e re-renderização do container
        const container = document.getElementById('campaignsList');
        if (container) {
            container.innerHTML = ''; // Limpar primeiro
            console.log('🧹 Container limpo');
        }
        
        // Pequeno delay para garantir atualização do DOM
        await new Promise(resolve => setTimeout(resolve, 50));
        
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
    showConfirmModal(
        '🗑️ Excluir Campanha',
        'Excluir esta campanha permanentemente? Esta ação não pode ser desfeita.',
        async () => {
            try {
                await api.deleteCampaign(campaignId);
                showNotification('✅ Campanha excluída!', 'success');
                await loadCampaigns();
            } catch (error) {
                showNotification('❌ Erro ao excluir campanha: ' + error.message, 'error');
            }
        }
    );
}

// ========== ORDERS ==========
async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter')?.value || '';
        orders = await api.getAllOrders(status || null);
        
        // Inicializar progresso de separação para novos pedidos (por item)
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const itemKey = `${order.id}_${item.product_id}`;
                if (!orderSeparationProgress[itemKey]) {
                    orderSeparationProgress[itemKey] = {
                        selected: 0,
                        total: item.quantity
                    };
                } else {
                    // Atualizar total caso tenha mudado
                    orderSeparationProgress[itemKey].total = item.quantity;
                    if (orderSeparationProgress[itemKey].selected > item.quantity) {
                        orderSeparationProgress[itemKey].selected = item.quantity;
                    }
                }
            });
        });
        
        // Salvar progresso atualizado
        if (typeof window !== 'undefined') {
            localStorage.setItem('orderSeparationProgress', JSON.stringify(orderSeparationProgress));
        }
        
        renderOrders();
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        orders = [];
        renderOrders();
    }
}

let orderSeparationProgress = {}; // {orderId: {selected: 0, total: 0}}

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
        const user = users.find(u => u.id === order.user_id) || {};
        const clientName = user.name || 'Cliente não identificado';
        const clientCompany = user.company || '';
        const clientPhone = user.phone || '';
        const clientEmail = user.email || '';
        
        // Parse notes para extrair informações de contato
        const notes = order.notes || '';
        const contactMatch = notes.match(/Contato:\s*(.+?)(?:\n|$)/);
        const phoneMatch = notes.match(/Telefone:\s*(.+?)(?:\n|$)/);
        const emailMatch = notes.match(/Email:\s*(.+?)(?:\n|$)/);
        
        const contactName = contactMatch ? contactMatch[1].trim() : clientName;
        const contactPhone = phoneMatch ? phoneMatch[1].trim() : clientPhone;
        const contactEmail = emailMatch ? emailMatch[1].trim() : clientEmail;
        
        const deliveryDate = order.delivery_date ? formatDate(order.delivery_date) : null;
        const deliveryAddress = order.delivery_address || 'Endereço não informado';
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div class="order-card-info">
                        <h4>${order.order_number}</h4>
                        <p class="order-meta">${formatDateTime(order.created_at)}</p>
                        <p class="order-client-name">👤 ${clientName}${clientCompany ? ` • ${clientCompany}` : ''}</p>
                    </div>
                    <div class="order-card-status">
                        <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
                        <span class="order-total">${formatCurrency(order.total)}</span>
                    </div>
                </div>
                <div class="order-card-body">
                    <div class="order-summary">
                        <span class="order-summary-item">📦 <strong>${totalItems}</strong> itens</span>
                        <span class="order-summary-item">${items.length} produtos</span>
                        <span class="order-summary-item">📍 ${deliveryAddress.split(',')[0] || deliveryAddress}</span>
                    </div>
                </div>
                <div class="order-card-footer">
                    <button class="btn-secondary btn-sm order-expand-btn" onclick="toggleOrderDetails('${order.id}')" data-expanded="false">
                        <span class="expand-icon">▼</span> Ver Detalhes
                    </button>
                    <select class="filter-select order-status-select" data-order-id="${order.id}">
                        ${getStatusOptions(order.status)}
                    </select>
                    <button class="btn-primary btn-sm" onclick="updateOrderStatus('${order.id}')">
                        Atualizar
                    </button>
                </div>
                <!-- Versão Expandida -->
                <div class="order-card-expanded" id="orderExpanded_${order.id}" style="display: none;">
                    <div class="order-details-grid">
                        <div class="order-detail-section">
                            <h5 class="order-detail-title">👤 Cliente</h5>
                            <div class="order-detail-content">
                                <p class="order-detail-item"><strong>Nome:</strong> ${contactName}</p>
                                ${clientCompany ? `<p class="order-detail-item"><strong>Empresa:</strong> ${clientCompany}</p>` : ''}
                                ${contactPhone ? `<p class="order-detail-item"><strong>Telefone:</strong> <a href="tel:${contactPhone}">${contactPhone}</a></p>` : ''}
                                ${contactEmail ? `<p class="order-detail-item"><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>` : ''}
                            </div>
                        </div>
                        <div class="order-detail-section">
                            <h5 class="order-detail-title">📍 Entrega</h5>
                            <div class="order-detail-content">
                                <p class="order-detail-item"><strong>Endereço:</strong> ${deliveryAddress}</p>
                                ${deliveryDate ? `<p class="order-detail-item"><strong>Data prevista:</strong> ${deliveryDate}</p>` : ''}
                            </div>
                        </div>
                        <div class="order-detail-section">
                            <h5 class="order-detail-title">📦 Itens do Pedido</h5>
                            <div class="order-items-list">
                                ${items.map((item, index) => {
                                    return `
                                    <div class="order-item-card" data-item-index="${index}" data-order-id="${order.id}">
                                        <div class="order-item-image-wrapper">
                                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="order-item-image">` : '<div class="order-item-image-placeholder">📦</div>'}
                                        </div>
                                        <div class="order-item-name">${item.name}</div>
                                        <div class="order-item-bottom">
                                            <div class="order-item-quantity-group">
                                                <span class="order-item-quantity-badge">${item.quantity}x</span>
                                                <span class="order-item-unit">${item.unit.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        </div>
                        <div class="order-detail-section">
                            <h5 class="order-detail-title">💰 Resumo Financeiro</h5>
                            <div class="order-financial-summary">
                                ${(() => {
                                    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                    const deliveryFee = order.total - subtotal;
                                    return `
                                        <div class="financial-row">
                                            <span>Subtotal:</span>
                                            <span>${formatCurrency(subtotal)}</span>
                                        </div>
                                        ${deliveryFee > 0 ? `
                                        <div class="financial-row">
                                            <span>Taxa de entrega:</span>
                                            <span>${formatCurrency(deliveryFee)}</span>
                                        </div>
                                        ` : ''}
                                        <div class="financial-row financial-total">
                                            <span><strong>Total:</strong></span>
                                            <span><strong>${formatCurrency(order.total)}</strong></span>
                                        </div>
                                    `;
                                })()}
                            </div>
                        </div>
                        ${notes && notes.trim() ? `
                        <div class="order-detail-section">
                            <h5 class="order-detail-title">📝 Observações</h5>
                            <div class="order-detail-content">
                                <p class="order-notes">${notes.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <!-- Status no final do card expandido -->
                    <div class="order-expanded-footer">
                        <select class="filter-select order-status-select" data-order-id="${order.id}">
                            ${getStatusOptions(order.status)}
                        </select>
                        <button class="btn-primary btn-sm" onclick="updateOrderStatus('${order.id}')">
                            Atualizar Status
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar tela de separação
function renderSeparationOrders() {
    const container = document.getElementById('separationOrdersContainer');
    if (!container) return;
    
    // Filtrar apenas pedidos com status: confirmado ou em_preparacao (não em_transporte)
    const separationOrders = orders.filter(o => 
        o.status === 'confirmado' || o.status === 'em_preparacao'
    );
    
    if (separationOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">📦</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum pedido para separação</p>
                <p style="color: #64748b; font-size: 13px; margin-top: 8px;">Apenas pedidos confirmados ou em preparação aparecem aqui</p>
            </div>`;
        return;
    }
    
    container.innerHTML = separationOrders.map(order => {
        const items = order.items || [];
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const user = users.find(u => u.id === order.user_id) || {};
        const clientName = user.name || 'Cliente não identificado';
        const clientCompany = user.company || '';
        
        // Calcular total separado somando todos os itens
        const totalSelected = items.reduce((sum, item) => {
            const itemKey = `${order.id}_${item.product_id}`;
            return sum + (orderSeparationProgress[itemKey]?.selected || 0);
        }, 0);
        
        const meetsRequirement = totalSelected >= totalItems;
        
        return `
            <div class="separation-order-card ${meetsRequirement ? 'requirement-met' : ''}" data-order-id="${order.id}">
                <div class="separation-order-header">
                    <div class="separation-order-info">
                        <h3>${order.order_number}</h3>
                        <p class="separation-client">👤 ${clientName}${clientCompany ? ` • ${clientCompany}` : ''}</p>
                    </div>
                    <div class="separation-order-status">
                        <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
                    </div>
                </div>
                
                <div class="separation-counter-section">
                    <div class="separation-counter-wrapper">
                        <span class="separation-counter-label">Total Separado:</span>
                        <div class="separation-counter">
                            <span class="counter-value-large" id="selectedItems_${order.id}">${(() => {
                                // Calcular total separado somando todos os itens
                                return items.reduce((sum, item) => {
                                    const itemKey = `${order.id}_${item.product_id}`;
                                    return sum + (orderSeparationProgress[itemKey]?.selected || 0);
                                }, 0);
                            })()}</span>
                        </div>
                        <span class="separation-counter-total">de ${totalItems} itens</span>
                    </div>
                </div>
                
                <div class="separation-items-grid">
                    ${items.map((item, index) => {
                        // Inicializar contador individual se não existir
                        const itemKey = `${order.id}_${item.product_id}`;
                        if (!orderSeparationProgress[itemKey]) {
                            orderSeparationProgress[itemKey] = {
                                selected: 0,
                                total: item.quantity
                            };
                        }
                        const itemProgress = orderSeparationProgress[itemKey];
                        const itemMeetsRequirement = itemProgress.selected >= itemProgress.total;
                        
                        return `
                        <div class="separation-item-card ${itemMeetsRequirement ? 'item-requirement-met' : ''}" data-order-id="${order.id}" data-product-id="${item.product_id}">
                            <div class="separation-item-image">
                                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="separation-item-placeholder">📦</div>'}
                            </div>
                            <div class="separation-item-name">${item.name}</div>
                            <div class="separation-item-quantity-large">
                                <span class="separation-quantity-number">${item.quantity}</span>
                                <span class="separation-quantity-unit">${item.unit.toUpperCase()}</span>
                            </div>
                            <div class="separation-item-counter">
                                <button class="counter-btn counter-minus" onclick="updateItemSeparationCount('${order.id}', '${item.product_id}', -1)" title="Diminuir">−</button>
                                <span class="counter-value" id="itemSelected_${order.id}_${item.product_id}">${itemProgress.selected}</span>
                                <button class="counter-btn counter-plus" onclick="updateItemSeparationCount('${order.id}', '${item.product_id}', 1)" title="Aumentar">+</button>
                            </div>
                            <div class="separation-item-progress">de ${item.quantity}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="separation-order-footer">
                    <button class="btn-primary" onclick="markOrderAsSeparated('${order.id}')">
                        ✅ Separado
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function updateItemSeparationCount(orderId, productId, delta) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const item = order.items.find(i => i.product_id === productId);
    if (!item) return;
    
    const itemKey = `${orderId}_${productId}`;
    
    // Inicializar se não existir
    if (!orderSeparationProgress[itemKey]) {
        orderSeparationProgress[itemKey] = {
            selected: 0,
            total: item.quantity
        };
    }
    
    const progress = orderSeparationProgress[itemKey];
    const previousSelected = progress.selected;
    const newSelected = Math.max(0, Math.min(progress.total, progress.selected + delta));
    progress.selected = newSelected;
    
    // Calcular total geral do pedido ANTES e DEPOIS da atualização
    const totalSelectedBefore = order.items.reduce((sum, i) => {
        const key = `${orderId}_${i.product_id}`;
        if (key === itemKey) {
            return sum + previousSelected;
        }
        return sum + (orderSeparationProgress[key]?.selected || 0);
    }, 0);
    
    const totalSelectedAfter = order.items.reduce((sum, i) => {
        const key = `${orderId}_${i.product_id}`;
        return sum + (orderSeparationProgress[key]?.selected || 0);
    }, 0);
    
    // Se estava em 0 e agora passou para 1 ou mais, mudar status para "em_preparacao"
    if (totalSelectedBefore === 0 && totalSelectedAfter > 0 && order.status === 'confirmado') {
        try {
            console.log('🔄 Mudando status automaticamente para "em_preparacao" após primeira separação');
            await api.updateOrderStatus(orderId, 'em_preparacao');
            order.status = 'em_preparacao';
            
            // Atualizar badge de status
            const orderCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
            if (orderCard) {
                const statusBadge = orderCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Em Preparação';
                    statusBadge.className = 'status-badge em_preparacao';
                }
            }
            
            showNotification('✅ Status alterado automaticamente para "Em Preparação"', 'success');
        } catch (error) {
            console.error('❌ Erro ao atualizar status automaticamente:', error);
            showNotification('⚠️ Erro ao atualizar status automaticamente', 'error');
        }
    }
    
    // Atualizar UI do item
    const selectedElement = document.getElementById(`itemSelected_${orderId}_${productId}`);
    if (selectedElement) {
        selectedElement.textContent = newSelected;
    }
    
    // Verificar se item completou
    const itemMeetsRequirement = newSelected >= progress.total;
    const itemCard = document.querySelector(`.separation-item-card[data-order-id="${orderId}"][data-product-id="${productId}"]`);
    if (itemCard) {
        if (itemMeetsRequirement) {
            itemCard.classList.add('item-requirement-met');
        } else {
            itemCard.classList.remove('item-requirement-met');
        }
    }
    
    const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Atualizar contador geral
    const generalCounter = document.getElementById(`selectedItems_${orderId}`);
    if (generalCounter) {
        generalCounter.textContent = totalSelectedAfter;
    }
    
    // Verificar se pedido completo
    const orderMeetsRequirement = totalSelectedAfter >= totalItems;
    const orderCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
    if (orderCard) {
        if (orderMeetsRequirement) {
            orderCard.classList.add('requirement-met');
        } else {
            orderCard.classList.remove('requirement-met');
        }
    }
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('orderSeparationProgress', JSON.stringify(orderSeparationProgress));
    }
}
window.updateItemSeparationCount = updateItemSeparationCount;

// Marcar pedido como separado (mudar para em_transporte)
async function markOrderAsSeparated(orderId) {
    try {
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('❌ Pedido não encontrado', 'error');
            return;
        }
        
        console.log('🔄 Marcando pedido como separado:', orderId);
        
        // Atualizar status para em_transporte
        await api.updateOrderStatus(orderId, 'em_transporte');
        order.status = 'em_transporte';
        
        // Remover o card da tela de separação com animação
        if (currentSection === 'separation') {
            const separationCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
            if (separationCard) {
                separationCard.classList.add('slide-out-right');
                setTimeout(() => {
                    renderSeparationOrders();
                }, 300);
            } else {
                renderSeparationOrders();
            }
        }
        
        showNotification('✅ Pedido marcado como separado e movido para transporte!', 'success');
    } catch (error) {
        console.error('❌ Erro ao marcar pedido como separado:', error);
        showNotification('❌ Erro ao marcar pedido como separado: ' + (error.message || 'Erro desconhecido'), 'error');
    }
}
window.markOrderAsSeparated = markOrderAsSeparated;

// Marcar pedido como concluído (mudar status para concluido)
async function markOrderAsCompleted(orderId) {
    try {
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('❌ Pedido não encontrado', 'error');
            return;
        }
        
        console.log('🔄 Marcando pedido como concluído:', orderId);
        
        // Atualizar status para concluido
        await api.updateOrderStatus(orderId, 'concluido');
        order.status = 'concluido';
        
        // Remover o card da tela de transporte (pedidos concluídos não aparecem)
        if (currentSection === 'transport') {
            const transportCard = document.querySelector(`.transport-card[data-order-id="${orderId}"]`);
            if (transportCard) {
                transportCard.classList.add('slide-out-right');
                setTimeout(() => {
                    renderTransport();
                }, 300);
            } else {
                renderTransport();
            }
        }
        
        showNotification('✅ Pedido marcado como concluído!', 'success');
    } catch (error) {
        console.error('❌ Erro ao marcar pedido como concluído:', error);
        showNotification('❌ Erro ao marcar pedido como concluído: ' + (error.message || 'Erro desconhecido'), 'error');
    }
}
window.markOrderAsCompleted = markOrderAsCompleted;

// Carregar progresso salvo
function loadSeparationProgress() {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('orderSeparationProgress');
        if (saved) {
            try {
                orderSeparationProgress = JSON.parse(saved);
            } catch (e) {
                orderSeparationProgress = {};
            }
        }
    }
}

function filterOrders() {
    applyGlobalFilters();
}

function refreshOrders() {
    loadOrders();
}

async function updateOrderStatus(orderId) {
    // Procurar o select que foi clicado - pode estar em qualquer seção
    let select = null;
    
    // Tentar encontrar o select - pode estar em qualquer seção
    // Primeiro, tentar na seção de separação
    if (currentSection === 'separation') {
        const separationCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
        if (separationCard) {
            select = separationCard.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
        }
    }
    
    // Se não encontrou, tentar na seção de transporte
    if (!select && currentSection === 'transport') {
        const transportCard = document.querySelector(`.transport-card[data-order-id="${orderId}"]`);
        if (transportCard) {
            select = transportCard.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
        }
    }
    
    // Se não encontrou, tentar o seletor geral
    if (!select) {
        select = document.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
    }
    
    if (!select) {
        console.error('❌ Select não encontrado para pedido:', orderId);
        return;
    }
    
    const newStatus = select.value;
    console.log('🔄 Atualizando status do pedido:', orderId, 'para:', newStatus, 'select encontrado:', select);
    
    // Obter o status antigo antes de atualizar
    const order = orders.find(o => o.id === orderId);
    const oldStatus = order ? order.status : null;
    
    // Função para atualizar o DOM imediatamente
    const updateDOM = () => {
        // Atualizar o status no objeto order local PRIMEIRO
        if (order) {
            order.status = newStatus;
        }
        
        // Atualizar badge de status no card (visualização) - IMEDIATAMENTE
        const orderCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
        if (orderCard) {
            const statusBadge = orderCard.querySelector('.status-badge');
            if (statusBadge) {
                const newLabel = getStatusLabel(newStatus);
                statusBadge.textContent = newLabel;
                statusBadge.className = 'status-badge ' + newStatus;
                // Forçar reflow
                void statusBadge.offsetHeight;
            }
        }
        
        // Atualizar badge de status na tela de separação - IMEDIATAMENTE
        const separationCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
        if (separationCard) {
            // Procurar o badge dentro do header - usar seletor mais específico
            let separationStatusBadge = separationCard.querySelector('.separation-order-status .status-badge');
            if (!separationStatusBadge) {
                separationStatusBadge = separationCard.querySelector('.status-badge');
            }
            
            if (separationStatusBadge) {
                const newLabel = getStatusLabel(newStatus);
                console.log('🔄 Atualizando badge de separação:', orderId, 'para:', newStatus, 'label:', newLabel);
                
                // Atualizar texto
                separationStatusBadge.textContent = newLabel;
                separationStatusBadge.innerText = newLabel;
                
                // Remover todas as classes de status antigas
                const statusClasses = ['pendente', 'confirmado', 'em_preparacao', 'em_transporte', 'concluido', 'cancelado', 'reembolsado'];
                statusClasses.forEach(cls => separationStatusBadge.classList.remove(cls));
                
                // Adicionar nova classe
                separationStatusBadge.classList.add(newStatus);
                separationStatusBadge.className = 'status-badge ' + newStatus;
                
                // Forçar reflow e repaint
                void separationStatusBadge.offsetHeight;
                separationStatusBadge.style.transform = 'scale(1)';
                void separationStatusBadge.offsetHeight;
            } else {
                console.error('❌ Badge de status não encontrado na tela de separação para pedido:', orderId);
                console.log('🔍 Card encontrado:', separationCard);
                console.log('🔍 Tentando encontrar badge...');
                const allBadges = separationCard.querySelectorAll('.status-badge');
                console.log('🔍 Badges encontrados:', allBadges.length);
            }
        } else {
            console.warn('⚠️ Card de separação não encontrado para pedido:', orderId);
        }
        
        // Atualizar todos os selects do mesmo pedido
        document.querySelectorAll(`.order-status-select[data-order-id="${orderId}"]`).forEach(sel => {
            sel.value = newStatus;
        });
        
        // Atualizar summary se necessário
        const summary = document.getElementById('ordersSummary');
        if (summary && currentSection === 'orders') {
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
    };
    
    try {
        // Atualizar DOM ANTES de fazer a requisição (otimista)
        updateDOM();
        
        // Fazer a requisição
        await api.updateOrderStatus(orderId, newStatus);
        
        // Se chegou aqui, a API retornou sucesso - garantir que está tudo atualizado
        updateDOM();
        
        // Se estamos na tela de separação, atualizar imediatamente após mudança de status
        if (currentSection === 'separation') {
            // Se o status mudou para "em_transporte", remover da lista de separação
            if (newStatus === 'em_transporte') {
                // Remover o card da tela imediatamente com animação
                const separationCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
                if (separationCard) {
                    separationCard.classList.add('slide-out-right');
                    setTimeout(() => {
                        renderSeparationOrders();
                    }, 300);
                } else {
                    renderSeparationOrders();
                }
            } else {
                // Para outros status (em_preparacao), apenas atualizar a lista
                renderSeparationOrders();
            }
        }
        
        // Se estamos na tela de transporte, atualizar imediatamente após mudança de status
        if (currentSection === 'transport') {
            // Se o status mudou para "concluido", remover da lista (não aparece mais)
            // Se o status mudou para "em_transporte", adicionar à lista
            renderTransport();
        }
        
        showNotification('✅ Status atualizado!', 'success');
        
    } catch (error) {
        // Reverter em caso de erro
        if (order && oldStatus) {
            order.status = oldStatus;
        }
        
        // Reverter badges
        const orderCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
        if (orderCard && oldStatus) {
            const statusBadge = orderCard.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = getStatusLabel(oldStatus);
                statusBadge.className = 'status-badge ' + oldStatus;
            }
        }
        
        const separationCard = document.querySelector(`.separation-order-card[data-order-id="${orderId}"]`);
        if (separationCard && oldStatus) {
            const separationStatusBadge = separationCard.querySelector('.separation-order-status .status-badge') || 
                                         separationCard.querySelector('.status-badge');
            if (separationStatusBadge) {
                separationStatusBadge.textContent = getStatusLabel(oldStatus);
                separationStatusBadge.innerText = getStatusLabel(oldStatus);
                separationStatusBadge.className = 'status-badge ' + oldStatus;
            }
        }
        
        // Reverter selects
        if (oldStatus) {
            select.value = oldStatus;
            document.querySelectorAll(`.order-status-select[data-order-id="${orderId}"]`).forEach(sel => {
                sel.value = oldStatus;
            });
        }
        
        showNotification('❌ Erro ao atualizar: ' + error.message, 'error');
    }
}

function toggleOrderDetails(orderId) {
    const expanded = document.getElementById(`orderExpanded_${orderId}`);
    const button = document.querySelector(`.order-expand-btn[onclick="toggleOrderDetails('${orderId}')"]`);
    
    if (!expanded || !button) return;
    
    const isExpanded = expanded.style.display !== 'none';
    
    if (isExpanded) {
        expanded.style.display = 'none';
        button.setAttribute('data-expanded', 'false');
        button.innerHTML = '<span class="expand-icon">▼</span> Ver Detalhes';
    } else {
        expanded.style.display = 'block';
        button.setAttribute('data-expanded', 'true');
        button.innerHTML = '<span class="expand-icon">▲</span> Ocultar Detalhes';
    }
}
window.toggleOrderDetails = toggleOrderDetails;

// ========== TRANSPORT ==========
async function loadTransport() {
    try {
        // Garantir que os pedidos estão carregados
        if (orders.length === 0) {
            await loadOrders();
        }
        // Garantir que os usuários estão carregados (para informações do cliente)
        if (users.length === 0) {
            await loadUsers();
        }
        // Renderizar pedidos em transporte
        renderTransport();
    } catch (error) {
        console.error('Erro ao carregar transporte:', error);
        renderTransport();
    }
}

function renderTransport() {
    const container = document.getElementById('transportListContainer');
    const summary = document.getElementById('transportSummary');
    
    if (!container) return;
    
    // Filtrar apenas pedidos em transporte
    const transportOrders = orders.filter(o => o.status === 'em_transporte');
    
    // Summary
    if (summary) {
        summary.innerHTML = `
            <span>Total: <strong>${transportOrders.length}</strong> pedidos em transporte</span>
        `;
    }
    
    if (transportOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="background: #1a1f26; border: 1px solid #2d3640; color: #94a3b8;">
                <span class="empty-state-icon">🚚</span>
                <p class="empty-state-text" style="color: #94a3b8;">Nenhum pedido em transporte</p>
            </div>`;
        return;
    }
    
    container.innerHTML = transportOrders.map(order => {
        const items = order.items || [];
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const user = users.find(u => u.id === order.user_id) || {};
        const clientName = user.name || 'Cliente não identificado';
        const clientCompany = user.company || '';
        const clientPhone = user.phone || '';
        const clientEmail = user.email || '';
        
        // Parse notes para extrair informações de contato
        const notes = order.notes || '';
        const contactMatch = notes.match(/Contato:\s*(.+?)(?:\n|$)/);
        const contactName = contactMatch ? contactMatch[1].trim() : clientName;
        
        const deliveryDate = order.delivery_date ? formatDate(order.delivery_date) : null;
        const deliveryAddress = order.delivery_address || 'Endereço não informado';
        
        return `
            <div class="transport-card" data-order-id="${order.id}">
                <div class="transport-card-header">
                    <div class="transport-order-info">
                        <h3 class="transport-order-number">${order.order_number}</h3>
                        <p class="transport-meta">${formatDateTime(order.created_at)}</p>
                    </div>
                    <div class="transport-status">
                        <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
                    </div>
                </div>
                
                <div class="transport-card-body">
                    <div class="transport-info-grid">
                        <div class="transport-info-item">
                            <span class="transport-label">👤 Comprador:</span>
                            <span class="transport-value">${contactName}</span>
                        </div>
                        <div class="transport-info-item">
                            <span class="transport-label">🏢 Cliente:</span>
                            <span class="transport-value">${clientName}${clientCompany ? ` • ${clientCompany}` : ''}</span>
                        </div>
                        <div class="transport-info-item">
                            <span class="transport-label">📦 Quantidade:</span>
                            <span class="transport-value"><strong>${totalItems}</strong> itens</span>
                        </div>
                        <div class="transport-info-item">
                            <span class="transport-label">📍 Endereço:</span>
                            <span class="transport-value">${deliveryAddress}</span>
                        </div>
                        ${deliveryDate ? `
                        <div class="transport-info-item">
                            <span class="transport-label">📅 Data prevista:</span>
                            <span class="transport-value">${deliveryDate}</span>
                        </div>
                        ` : ''}
                        ${clientPhone ? `
                        <div class="transport-info-item">
                            <span class="transport-label">📞 Telefone:</span>
                            <span class="transport-value"><a href="tel:${clientPhone}">${clientPhone}</a></span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="transport-items-section">
                        <h4 class="transport-items-title">📦 Itens do Pedido</h4>
                        <table class="transport-items-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Unidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item, index) => {
                                    return `
                                    <tr>
                                        <td class="transport-item-name">${item.name}</td>
                                        <td class="transport-item-qty">${item.quantity}</td>
                                        <td class="transport-item-unit">${item.unit.toUpperCase()}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="transport-card-footer">
                    <button class="btn-primary" onclick="markOrderAsCompleted('${order.id}')">
                        ✅ Concluído
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function refreshTransport() {
    loadTransport();
}

function refreshSeparation() {
    // Recarregar pedidos e renderizar separação
    loadOrders().then(() => {
        renderSeparationOrders();
    });
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
        showNotification('⚠️ Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    if (userData.password.length < 6) {
        showNotification('⚠️ A senha deve ter pelo menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        await api.createUser(userData);
        closeModal('newUserModal');
        showNotification('✅ Usuário criado com sucesso!', 'success');
        await loadUsers();
    } catch (error) {
        showNotification('❌ Erro ao criar usuário: ' + error.message, 'error');
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
        showNotification('❌ Erro ao carregar usuário: ' + error.message, 'error');
    }
}

async function suspendUser(userId) {
    const reason = prompt('Motivo da suspensão:');
    if (reason === null) return;
    
    try {
        await api.manageUserApproval(userId, 'suspend', reason);
        showNotification('✅ Usuário suspenso', 'success');
        await loadUsers();
    } catch (error) {
        showNotification('❌ Erro: ' + error.message, 'error');
    }
}

async function reactivateUser(userId) {
    showConfirmModal(
        '✅ Reativar Usuário',
        'Reativar este usuário? Ele voltará a ter acesso ao sistema.',
        async () => {
            try {
                await api.manageUserApproval(userId, 'reactivate');
                showNotification('✅ Usuário reativado', 'success');
                await loadUsers();
            } catch (error) {
                showNotification('❌ Erro: ' + error.message, 'error');
            }
        }
    );
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
        <div class="approval-card pending" data-user-id="${user.id}">
            <div class="approval-date">${formatRelativeTime(user.created_at)}</div>
            <div class="approval-header">
                <div class="approval-avatar">👤</div>
                <div class="approval-info">
                    <div class="approval-name">${user.name}</div>
                    <div class="approval-email">${user.email}</div>
                </div>
            </div>
            <div class="approval-details">
                <div class="approval-summary">
                    <div class="approval-summary-item">
                        <span class="summary-label">Empresa</span>
                        <span class="summary-value">${user.company || '-'}</span>
                    </div>
                    <div class="approval-summary-item">
                        <span class="summary-label">CNPJ</span>
                        <span class="summary-value">${user.cnpj || '-'}</span>
                    </div>
                    <div class="approval-summary-item">
                        <span class="summary-label">Tipo de Negócio</span>
                        <span class="summary-value">${getBusinessTypeLabel(user.business_type)}</span>
                    </div>
                    <div class="approval-summary-item">
                        <span class="summary-label">Forma de Pagamento</span>
                        <span class="summary-value">${getPaymentPreferenceLabel(user.payment_preference)}</span>
                    </div>
                    <div class="approval-summary-item">
                        <span class="summary-label">Telefone</span>
                        <span class="summary-value">${user.phone || '-'}</span>
                    </div>
                    <div class="approval-summary-item">
                        <span class="summary-label">Data de Cadastro</span>
                        <span class="summary-value">${formatDateTime(user.created_at)}</span>
                    </div>
                </div>
                <div class="approval-expanded-details" id="expanded-${user.id}" style="display: none;">
                    ${user.address_city ? `
                    <div class="approval-detail-section">
                        <div class="approval-detail-item">
                            <span class="detail-label">Endereço:</span>
                            <span class="detail-value">${user.address_street || ''} ${user.address_number || ''}, ${user.address_neighborhood || ''} - ${user.address_city || ''}/${user.address_state || ''} - CEP: ${user.address_cep || ''}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${user.payment_justification ? `
                    <div class="approval-detail-section">
                        <div class="approval-detail-item">
                            <span class="detail-label">Justificativa de Pagamento:</span>
                            <span class="detail-value">${user.payment_justification}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${user.razao_social ? `
                    <div class="approval-detail-section">
                        <div class="approval-detail-item">
                            <span class="detail-label">Razão Social:</span>
                            <span class="detail-value">${user.razao_social}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${user.ie ? `
                    <div class="approval-detail-section">
                        <div class="approval-detail-item">
                            <span class="detail-label">Inscrição Estadual:</span>
                            <span class="detail-value">${user.ie}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="approval-actions">
                <button class="btn-secondary btn-toggle-details" onclick="toggleUserDetails('${user.id}')" data-expanded="false">
                    <span class="toggle-icon">▼</span> Mais
                </button>
                <button class="btn-primary" onclick="approveUser('${user.id}')">✅ Aprovar</button>
                <button class="btn-danger" onclick="rejectUser('${user.id}')">❌ Recusar</button>
            </div>
        </div>
    `).join('');
}

// Função para expandir/colapsar detalhes do usuário
function toggleUserDetails(userId) {
    const expandedSection = document.getElementById(`expanded-${userId}`);
    const button = document.querySelector(`[onclick="toggleUserDetails('${userId}')"]`);
    const icon = button.querySelector('.toggle-icon');
    
    if (expandedSection.style.display === 'none') {
        expandedSection.style.display = 'block';
        icon.textContent = '▲';
        button.setAttribute('data-expanded', 'true');
    } else {
        expandedSection.style.display = 'none';
        icon.textContent = '▼';
        button.setAttribute('data-expanded', 'false');
    }
}

// Função para mostrar detalhes completos do usuário (mantida para compatibilidade)
async function showUserDetails(userId) {
    try {
        // Buscar dados completos do usuário
        const users = await api.getPendingUsers();
        const user = users.find(u => u.id === userId || String(u.id) === String(userId));
        
        if (!user) {
            alert('Usuário não encontrado');
            return;
        }
        
        // Criar modal com todas as informações
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'userDetailsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>📋 Detalhes Completos do Cadastro</h2>
                    <button class="modal-close" onclick="closeUserDetailsModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="user-details-section">
                        <h3>👤 Dados Pessoais</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Nome Completo:</span>
                                <span class="detail-value">${user.name || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">E-mail:</span>
                                <span class="detail-value">${user.email || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Telefone:</span>
                                <span class="detail-value">${user.phone || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Username:</span>
                                <span class="detail-value">${user.username || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-details-section">
                        <h3>🏢 Dados da Empresa</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Nome Fantasia:</span>
                                <span class="detail-value">${user.company || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">CNPJ:</span>
                                <span class="detail-value">${user.cnpj || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tipo de Estabelecimento:</span>
                                <span class="detail-value">${getBusinessTypeLabel(user.business_type)}</span>
                            </div>
                            ${user.razao_social ? `
                            <div class="detail-item">
                                <span class="detail-label">Razão Social:</span>
                                <span class="detail-value">${user.razao_social}</span>
                            </div>
                            ` : ''}
                            ${user.ie ? `
                            <div class="detail-item">
                                <span class="detail-label">Inscrição Estadual:</span>
                                <span class="detail-value">${user.ie}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="user-details-section">
                        <h3>📍 Endereço</h3>
                        <div class="detail-grid">
                            ${user.address ? `
                            <div class="detail-item">
                                <span class="detail-label">CEP:</span>
                                <span class="detail-value">${user.address.cep || '-'}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">Endereço:</span>
                                <span class="detail-value">${user.address.street || ''} ${user.address.number || ''} ${user.address.complement || ''}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Bairro:</span>
                                <span class="detail-value">${user.address.neighborhood || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Cidade/Estado:</span>
                                <span class="detail-value">${user.address.city || '-'} / ${user.address.state || '-'}</span>
                            </div>
                            ` : `
                            <div class="detail-item full-width">
                                <span class="detail-value">Endereço não informado</span>
                            </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="user-details-section">
                        <h3>💳 Dados de Pagamento</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Forma de Pagamento:</span>
                                <span class="detail-value">${getPaymentPreferenceLabel(user.payment_preference)}</span>
                            </div>
                            ${user.payment_justification ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">Justificativa/Motivo:</span>
                                <span class="detail-value">${user.payment_justification}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="user-details-section">
                        <h3>📅 Informações do Cadastro</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Data de Cadastro:</span>
                                <span class="detail-value">${formatDate(user.created_at)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">${getApprovalLabel(user.approval_status || 'pending')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeUserDetailsModal()">Fechar</button>
                    <button class="btn-danger" onclick="rejectUser('${user.id}'); closeUserDetailsModal();">❌ Recusar</button>
                    <button class="btn-primary" onclick="approveUser('${user.id}'); closeUserDetailsModal();">✅ Aprovar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
        
        // Adicionar overlay se não existir
        let overlay = document.getElementById('modalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modalOverlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('show');
        
        // Fechar ao clicar fora
        overlay.addEventListener('click', function() {
            closeUserDetailsModal();
        });
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do usuário');
    }
}

function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
        setTimeout(() => {
            if (modal) modal.remove();
        }, 300);
    }
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
    showConfirmModal(
        '✅ Aprovar Cadastro',
        'Aprovar este cadastro? O usuário terá acesso ao sistema.',
        async () => {
            try {
                await api.manageUserApproval(userId, 'approve');
                showNotification('✅ Usuário aprovado!', 'success');
                await loadApprovals();
                await loadDashboardData();
            } catch (error) {
                showNotification('❌ Erro: ' + error.message, 'error');
            }
        }
    );
}

async function rejectUser(userId) {
    const reason = prompt('Motivo da recusa:');
    if (reason === null) return;
    
    try {
        await api.manageUserApproval(userId, 'suspend', reason || 'Cadastro recusado');
        showNotification('✅ Cadastro recusado', 'success');
        await loadApprovals();
    } catch (error) {
        showNotification('❌ Erro: ' + error.message, 'error');
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
        showNotification('⚠️ Preencha todos os campos obrigatórios', 'warning');
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
            showNotification('✅ Produto atualizado!', 'success');
        } else {
            await api.createProduct(formData);
            showNotification('✅ Produto criado!', 'success');
        }
        
        closeProductModal();
        await loadProducts();
    } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        showNotification('❌ Erro: ' + error.message, 'error');
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
    showConfirmModal(
        '🗑️ Excluir Produto',
        'Excluir este produto permanentemente? Esta ação não pode ser desfeita.',
        async () => {
            try {
                await api.deleteProduct(productId);
                showNotification('✅ Produto excluído!', 'success');
                await loadProducts();
            } catch (error) {
                showNotification('❌ Erro: ' + error.message, 'error');
            }
        }
    );
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
             ondragend="handleDragEnd(event)"
             ontouchstart="handleTouchStart(event)"
             ontouchmove="handleTouchMove(event)"
             ontouchend="handleTouchEnd(event)">
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

// ========== TOUCH EVENTS PARA MOBILE ==========
let touchStartY = 0;
let touchStartElement = null;
let touchCurrentElement = null;

function handleTouchStart(e) {
    touchStartElement = e.target.closest('.promo-order-item');
    if (!touchStartElement) return;
    
    touchStartY = e.touches[0].clientY;
    touchStartElement.classList.add('dragging');
    
    // Adicionar estilo visual de arraste
    touchStartElement.style.transform = 'scale(1.05)';
    touchStartElement.style.zIndex = '1000';
    touchStartElement.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.3)';
    
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchStartElement) return;
    
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    
    // Mover visualmente o elemento sendo arrastado
    const deltaY = touchY - touchStartY;
    touchStartElement.style.transform = `translateY(${deltaY}px) scale(1.05)`;
    
    // Encontrar o item de destino baseado na posição Y
    const container = document.getElementById('promoOrderList');
    if (!container) return;
    
    const allItems = Array.from(container.querySelectorAll('.promo-order-item'));
    let targetItem = null;
    
    // Encontrar qual item está na posição do toque
    for (const item of allItems) {
        if (item === touchStartElement) continue;
        
        const rect = item.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        
        // Se o toque está sobre este item
        if (touchY >= rect.top && touchY <= rect.bottom) {
            targetItem = item;
            break;
        }
    }
    
    // Remover drag-over de todos os itens
    allItems.forEach(item => {
        if (item !== touchStartElement) {
            item.classList.remove('drag-over');
        }
    });
    
    // Adicionar drag-over no item atual (amarelo)
    if (targetItem && targetItem !== touchStartElement) {
        targetItem.classList.add('drag-over');
        touchCurrentElement = targetItem;
    } else {
        touchCurrentElement = null;
    }
}

function handleTouchEnd(e) {
    if (!touchStartElement) return;
    
    e.preventDefault();
    
    const touchY = e.changedTouches[0].clientY;
    const container = document.getElementById('promoOrderList');
    
    if (!container) {
        // Limpar se não houver container
        touchStartElement.classList.remove('dragging');
        touchStartElement.style.transform = '';
        touchStartElement.style.zIndex = '';
        touchStartElement.style.boxShadow = '';
        touchStartElement = null;
        touchCurrentElement = null;
        touchStartY = 0;
        return;
    }
    
    // Encontrar o item de destino baseado na posição Y final
    const allItems = Array.from(container.querySelectorAll('.promo-order-item'));
    let targetItem = null;
    
    for (const item of allItems) {
        if (item === touchStartElement) continue;
        
        const rect = item.getBoundingClientRect();
        
        // Se o toque está sobre este item
        if (touchY >= rect.top && touchY <= rect.bottom) {
            targetItem = item;
            break;
        }
    }
    
    // Se não encontrou pelo toque, usar o touchCurrentElement
    if (!targetItem && touchCurrentElement) {
        targetItem = touchCurrentElement;
    }
    
    if (targetItem && targetItem !== touchStartElement) {
        targetItem.classList.remove('drag-over');
        
        const draggedIndex = allItems.indexOf(touchStartElement);
        const targetIndex = allItems.indexOf(targetItem);
        
        // Reordenar no DOM apenas se os índices forem diferentes
        if (draggedIndex !== targetIndex) {
            // Remover o elemento da posição atual
            touchStartElement.remove();
            
            // Inserir na nova posição
            if (draggedIndex < targetIndex) {
                // Movendo para baixo
                if (targetItem.nextSibling) {
                    container.insertBefore(touchStartElement, targetItem.nextSibling);
                } else {
                    container.appendChild(touchStartElement);
                }
            } else {
                // Movendo para cima
                container.insertBefore(touchStartElement, targetItem);
            }
            
            // Atualizar números de posição
            updatePositionNumbers();
        }
    }
    
    // Limpar estilos visuais
    touchStartElement.classList.remove('dragging');
    touchStartElement.style.transform = '';
    touchStartElement.style.zIndex = '';
    touchStartElement.style.boxShadow = '';
    
    document.querySelectorAll('.promo-order-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    touchStartElement = null;
    touchCurrentElement = null;
    touchStartY = 0;
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
        showNotification('✅ Ordem salva com sucesso!', 'success');
        
        // Recarregar produtos para atualizar a ordem no array local
        await loadProducts();
        renderPromoOrderList();
    } catch (error) {
        console.error('❌ Erro ao salvar ordem:', error);
        showNotification('❌ Erro ao salvar ordem: ' + error.message, 'error');
    }
}

function handleProductImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('⚠️ Selecione apenas imagens!', 'warning');
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
    
    console.log('📝 Editando campanha:');
    console.log('  start_date do banco:', campaign.start_date);
    console.log('  end_date do banco:', campaign.end_date);
    
    // Usar diretamente a string do banco, sem criar objeto Date
    const formattedStart = formatDateTimeLocal(campaign.start_date);
    const formattedEnd = formatDateTimeLocal(campaign.end_date);
    
    console.log('  formatDateTimeLocal start:', formattedStart);
    console.log('  formatDateTimeLocal end:', formattedEnd);
    
    currentEditId = campaignId;
    document.getElementById('campaignModalTitle').textContent = 'Editar Campanha';
    
    document.getElementById('campaignId').value = campaign.id;
    document.getElementById('campaignName').value = campaign.name;
    document.getElementById('campaignDescription').value = campaign.description || '';
    document.getElementById('campaignDiscountType').value = campaign.discount_type;
    document.getElementById('campaignDiscountValue').value = campaign.discount_value;
    document.getElementById('campaignStartDate').value = formattedStart;
    document.getElementById('campaignEndDate').value = formattedEnd;
    document.getElementById('campaignCategory').value = campaign.category || '';
    
    updateDiscountLabel();
    openModal('campaignModal');
}

async function saveCampaign() {
    // Pegar os valores do datetime-local (formato: YYYY-MM-DDTHH:MM)
    const startDateValue = document.getElementById('campaignStartDate').value;
    const endDateValue = document.getElementById('campaignEndDate').value;
    
    // Converter para ISO SEM mudar o horário (adiciona :00.000Z mas mantém os valores)
    // Isso garante que 12:30 local seja salvo como 12:30, não convertido para UTC
    const startDateISO = startDateValue + ':00';  // YYYY-MM-DDTHH:MM:00
    const endDateISO = endDateValue + ':00';
    
    console.log('📅 Salvando campanha:');
    console.log('  Input start:', startDateValue, '→ Enviando:', startDateISO);
    console.log('  Input end:', endDateValue, '→ Enviando:', endDateISO);
    
    const data = {
        name: document.getElementById('campaignName').value,
        description: document.getElementById('campaignDescription').value || null,
        discount_type: document.getElementById('campaignDiscountType').value,
        discount_value: parseFloat(document.getElementById('campaignDiscountValue').value),
        start_date: startDateISO,
        end_date: endDateISO,
        category: document.getElementById('campaignCategory').value || null
    };
    
    try {
        if (currentEditId) {
            await api.updateCampaign(currentEditId, data);
            showNotification('✅ Campanha atualizada!', 'success');
        } else {
            await api.createCampaign(data);
            showNotification('✅ Campanha criada!', 'success');
        }
        
        closeCampaignModal();
        await loadCampaigns();
    } catch (error) {
        showNotification('❌ Erro: ' + error.message, 'error');
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
    // Se for string, tentar extrair diretamente sem conversão de timezone
    if (typeof date === 'string') {
        // Se tem Z no final (UTC), converter para local
        if (date.endsWith('Z')) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        // Se não tem Z, extrair diretamente (já está em horário local)
        // Formato esperado: "2025-12-14T12:30:00" ou "2025-12-14T12:30"
        const match = date.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
        if (match) {
            return match[1];
        }
    }
    
    // Fallback: usar conversão padrão
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

function getStatusOptions(currentStatus, context = 'default') {
    let options = [];
    
    // Definir opções baseadas no contexto
    switch (context) {
        case 'transport':
            // Na aba de transporte, apenas em_transporte e concluido
            options = [
                { value: 'em_transporte', label: 'Em Transporte' },
                { value: 'concluido', label: 'Concluído' }
            ];
            break;
        case 'separation':
            // Na aba de separação, apenas em_preparacao e em_transporte
            options = [
                { value: 'em_preparacao', label: 'Em Preparação' },
                { value: 'em_transporte', label: 'Em Transporte' }
            ];
            break;
        default:
            // Contexto padrão: todas as opções
            options = [
                { value: 'pendente', label: 'Pendente' },
                { value: 'confirmado', label: 'Confirmado' },
                { value: 'em_preparacao', label: 'Em Preparação' },
                { value: 'em_transporte', label: 'Em Transporte' },
                { value: 'concluido', label: 'Concluído' },
                { value: 'cancelado', label: 'Cancelado' },
                { value: 'reembolsado', label: 'Reembolsado' }
            ];
    }
    
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

function getPaymentPreferenceLabel(preference) {
    const labels = {
        'pix': '💳 PIX',
        'cartao_credito': '💳 Cartão de Crédito',
        'boleto_7dias': '📄 Boleto (7 dias)',
        'boleto_10dias': '📄 Boleto (10 dias)',
        'faturamento': '📋 Faturamento'
    };
    return labels[preference] || preference || '-';
}

// ========== SUMMARY CARDS ==========
function renderSummaryCards(metrics, orders) {
    // Update customers summary
    const summaryTotalCustomers = document.getElementById('summaryTotalCustomers');
    if (summaryTotalCustomers) {
        summaryTotalCustomers.textContent = metrics.active_users || 0;
    }
    
    const summaryNewCustomers = document.getElementById('summaryNewCustomers');
    if (summaryNewCustomers) {
        summaryNewCustomers.textContent = metrics.new_users_week || 0;
    }
    
    // Update orders summary
    const summaryTotalOrders = document.getElementById('summaryTotalOrders');
    if (summaryTotalOrders) {
        summaryTotalOrders.textContent = orders ? orders.length : 0;
    }
    
    const pendingOrders = orders ? orders.filter(o => o.status === 'pendente').length : 0;
    const summaryPendingOrders = document.getElementById('summaryPendingOrders');
    if (summaryPendingOrders) {
        summaryPendingOrders.textContent = pendingOrders;
    }
    
    // Update requests summary (will be updated when approvals are loaded)
    const summaryPendingRequests = document.getElementById('summaryPendingRequests');
    if (summaryPendingRequests) {
        summaryPendingRequests.textContent = metrics.pending_approval || 0;
    }
}

let summaryModalType = null;

async function openSummaryModal(type) {
    summaryModalType = type;
    const modal = document.getElementById('summaryModal');
    const modalTitle = document.getElementById('summaryModalTitle');
    const modalContent = document.getElementById('summaryModalContent');
    
    modal.classList.add('show');
    document.getElementById('modalOverlay').classList.add('show');
    
    try {
        if (type === 'customers') {
            modalTitle.textContent = '👥 Detalhes dos Clientes';
            await renderCustomersDetails(modalContent);
        } else if (type === 'orders') {
            modalTitle.textContent = '📦 Detalhes dos Pedidos';
            await renderOrdersDetails(modalContent);
        } else if (type === 'requests') {
            modalTitle.textContent = '⏳ Solicitações de Cadastro';
            await renderRequestsDetails(modalContent);
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalContent.innerHTML = '<p style="color: var(--accent-danger);">Erro ao carregar detalhes.</p>';
    }
}

function closeSummaryModal() {
    const modal = document.getElementById('summaryModal');
    modal.classList.remove('show');
    document.getElementById('modalOverlay').classList.remove('show');
    summaryModalType = null;
}

async function renderCustomersDetails(container) {
    try {
        const users = await api.getUsers();
        const metricsData = await api.getUserMetrics();
        
        // Group by business type
        const byBusinessType = {};
        users.forEach(user => {
            const type = user.business_type || 'outros';
            if (!byBusinessType[type]) byBusinessType[type] = [];
            byBusinessType[type].push(user);
        });
        
        // Group by status
        const byStatus = { approved: 0, suspended: 0, pending: 0 };
        users.forEach(user => {
            const status = user.approval_status || 'approved';
            if (byStatus.hasOwnProperty(status)) {
                byStatus[status]++;
            }
        });
        
        container.innerHTML = `
            <div class="summary-details">
                <div class="summary-section">
                    <h3>Resumo Geral</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Total de Clientes:</span>
                            <span class="detail-value">${users.length}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Ativos:</span>
                            <span class="detail-value">${byStatus.approved}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Suspensos:</span>
                            <span class="detail-value">${byStatus.suspended}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pendentes:</span>
                            <span class="detail-value">${byStatus.pending}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Novos (semana):</span>
                            <span class="detail-value">${metricsData.new_users_week || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>Por Tipo de Negócio</h3>
                    <div class="detail-list">
                        ${Object.entries(byBusinessType).map(([type, list]) => `
                            <div class="detail-row">
                                <span class="detail-label">${getBusinessTypeLabel(type)}:</span>
                                <span class="detail-value">${list.length}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>Top 10 Clientes</h3>
                    <div class="detail-list">
                        ${(metricsData.top_customers || []).slice(0, 10).map((customer, index) => `
                            <div class="detail-row">
                                <span class="detail-label">${index + 1}. ${customer.name}</span>
                                <span class="detail-value">${formatCurrency(customer.total_spent)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-danger);">Erro: ${error.message}</p>`;
    }
}

async function renderOrdersDetails(container) {
    try {
        const ordersData = await api.getAllOrders();
        
        // Group by status
        const byStatus = {};
        ordersData.forEach(order => {
            const status = order.status || 'pendente';
            if (!byStatus[status]) byStatus[status] = [];
            byStatus[status].push(order);
        });
        
        // Calculate totals
        const totalValue = ordersData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const pendingValue = (byStatus.pendente || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        container.innerHTML = `
            <div class="summary-details">
                <div class="summary-section">
                    <h3>Resumo Geral</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Total de Pedidos:</span>
                            <span class="detail-value">${ordersData.length}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Valor Total:</span>
                            <span class="detail-value">${formatCurrency(totalValue)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pendentes:</span>
                            <span class="detail-value">${byStatus.pendente?.length || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Valor Pendente:</span>
                            <span class="detail-value">${formatCurrency(pendingValue)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>Por Status</h3>
                    <div class="detail-list">
                        ${Object.entries(byStatus).map(([status, list]) => `
                            <div class="detail-row">
                                <span class="detail-label">${getStatusLabel(status)}:</span>
                                <span class="detail-value">${list.length}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="summary-section">
                    <h3>Últimos 10 Pedidos</h3>
                    <div class="orders-mini-list">
                        ${ordersData.slice(0, 10).map(order => `
                            <div class="order-mini-item">
                                <div class="order-mini-info">
                                    <span class="order-mini-number">${order.order_number}</span>
                                    <span class="order-mini-date">${formatRelativeTime(order.created_at)}</span>
                                </div>
                                <div class="order-mini-footer">
                                    <span class="order-mini-status ${order.status}">${getStatusLabel(order.status)}</span>
                                    <span class="order-mini-total">${formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-danger);">Erro: ${error.message}</p>`;
    }
}

async function renderRequestsDetails(container) {
    try {
        const pending = await api.getPendingUsers();
        
        if (pending.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">✅</span>
                    <p class="empty-state-text">Nenhuma solicitação pendente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="summary-details">
                <div class="summary-section">
                    <h3>Total: ${pending.length} Solicitação(ões) Pendente(s)</h3>
                    <div class="requests-list">
                        ${pending.map(user => `
                            <div class="request-card-expanded">
                                <div class="request-header-expanded">
                                    <div class="request-avatar">👤</div>
                                    <div class="request-info-expanded">
                                        <div class="request-name-expanded">${user.name}</div>
                                        <div class="request-email-expanded">${user.email}</div>
                                        <div class="request-date-expanded">${formatRelativeTime(user.created_at)}</div>
                                    </div>
                                </div>
                                
                                <div class="request-summary-box">
                                    <div class="request-summary-row">
                                        <span class="summary-label">Empresa:</span>
                                        <span class="summary-value">${user.company || '-'}</span>
                                    </div>
                                    <div class="request-summary-row">
                                        <span class="summary-label">CNPJ:</span>
                                        <span class="summary-value">${user.cnpj || '-'}</span>
                                    </div>
                                    <div class="request-summary-row">
                                        <span class="summary-label">TIPO:</span>
                                        <span class="summary-value">${getBusinessTypeLabel(user.business_type)}</span>
                                    </div>
                                    <div class="request-summary-row">
                                        <span class="summary-label">Nome Comprador:</span>
                                        <span class="summary-value">${user.name || '-'}</span>
                                    </div>
                                    <div class="request-summary-row">
                                        <span class="summary-label">Tipo Pagamento:</span>
                                        <span class="summary-value">${getPaymentPreferenceLabel(user.payment_preference)}</span>
                                    </div>
                                    <div class="request-summary-row">
                                        <span class="summary-label">Telefone:</span>
                                        <span class="summary-value">${user.phone || '-'}</span>
                                    </div>
                                </div>
                                
                                <div class="request-highlights">
                                    <div class="request-highlight-item">
                                        <span class="highlight-label">💳 Forma de Pagamento:</span>
                                        <span class="highlight-value">${getPaymentPreferenceLabel(user.payment_preference)}</span>
                                    </div>
                                    ${user.payment_justification ? `
                                    <div class="request-highlight-item">
                                        <span class="highlight-label">📝 Motivo/Justificativa:</span>
                                        <span class="highlight-value">${user.payment_justification}</span>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <div class="request-details-expanded">
                                    <div class="detail-row">
                                        <span class="detail-label">Empresa:</span>
                                        <span class="detail-value">${user.company || '-'}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">CNPJ:</span>
                                        <span class="detail-value">${user.cnpj || '-'}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Tipo de Negócio:</span>
                                        <span class="detail-value">${getBusinessTypeLabel(user.business_type)}</span>
                                    </div>
                                    ${user.phone ? `
                                    <div class="detail-row">
                                        <span class="detail-label">Telefone:</span>
                                        <span class="detail-value">${user.phone}</span>
                                    </div>
                                    ` : ''}
                                    ${user.address_city ? `
                                    <div class="detail-row">
                                        <span class="detail-label">Endereço:</span>
                                        <span class="detail-value">${user.address_street || ''} ${user.address_number || ''}, ${user.address_city || ''} - ${user.address_state || ''}</span>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <div class="request-actions-expanded">
                                    <button class="btn-secondary btn-sm" onclick="showUserDetails('${user.id}'); closeSummaryModal();">👁️ Ver Detalhes</button>
                                    <button class="btn-primary btn-sm" onclick="approveUser('${user.id}'); closeSummaryModal();">✅ Aprovar</button>
                                    <button class="btn-danger btn-sm" onclick="rejectUser('${user.id}'); closeSummaryModal();">❌ Recusar</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-danger);">Erro: ${error.message}</p>`;
    }
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

