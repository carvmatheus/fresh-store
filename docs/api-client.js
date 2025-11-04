/**
 * Cliente HTTP para comunicação com a API
 */

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Obter headers para requisições
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Fazer requisição HTTP com timeout
     */
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
            console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
            
            // Criar timeout para a requisição (30 segundos para Render cold start)
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT || 30000);
            
            config.signal = controller.signal;
            
            const response = await fetch(url, config);
            clearTimeout(timeout);
            
            console.log(`✅ API Response: ${response.status} ${response.statusText}`);
            
            // Se status 204 (No Content), retornar null
            if (response.status === 204) {
                return null;
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error(`❌ API Error ${response.status}:`, data);
                throw new Error(data.detail || `Erro ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ API Timeout: Requisição excedeu o tempo limite');
                throw new Error('Timeout: O servidor demorou muito para responder. Pode estar em cold start (aguarde 30s e tente novamente).');
            }
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // =============================
    // AUTENTICAÇÃO
    // =============================

    /**
     * Login de usuário - Gera e salva JWT
     */
    async login(username, password) {
        console.log('📡 ApiClient: Enviando credenciais para', this.baseURL + '/auth/login');
        
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        console.log('📦 Resposta do backend:', {
            user: data.user.username,
            role: data.user.role,
            token_presente: !!data.access_token,
            token_length: data.access_token ? data.access_token.length : 0
        });
        
        // Salvar token JWT
        this.token = data.access_token;
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Confirmar salvamento
        const tokenSalvo = localStorage.getItem('auth_token');
        const userSalvo = localStorage.getItem('currentUser');
        
        console.log('✅ Token JWT salvo:', !!tokenSalvo, `(${tokenSalvo ? tokenSalvo.substring(0, 20) + '...' : 'VAZIO'})`);
        console.log('✅ Usuário salvo:', !!userSalvo);
        console.log('✅ Login realizado com sucesso:', data.user.username, '-', data.user.role);
        
        return data;
    }

    /**
     * Registrar novo usuário
     */
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        this.token = data.access_token;
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        console.log('✅ Usuário registrado:', data.user.username);
        return data;
    }

    /**
     * Obter informações do usuário atual
     */
    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    /**
     * Logout
     */
    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        console.log('✅ Logout realizado');
    }

    // =============================
    // PRODUTOS
    // =============================

    /**
     * Listar produtos
     */
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.skip !== undefined) params.append('skip', filters.skip);
        if (filters.limit !== undefined) params.append('limit', filters.limit);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        
        const products = await this.request(endpoint);
        console.log(`✅ ${products.length} produtos carregados`);
        return products;
    }

    /**
     * Obter produto por ID
     */
    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    /**
     * Criar novo produto (admin)
     */
    async createProduct(productData) {
        const product = await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        console.log('✅ Produto criado:', product.name);
        return product;
    }

    /**
     * Atualizar produto (admin)
     */
    async updateProduct(id, productData) {
        const product = await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
        console.log('✅ Produto atualizado:', product.name);
        return product;
    }

    /**
     * Deletar produto (admin)
     */
    async deleteProduct(id) {
        await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
        console.log('✅ Produto excluído');
    }

    /**
     * Listar categorias disponíveis
     */
    async getCategories() {
        return await this.request('/products/categories/list');
    }

    // =============================
    // PEDIDOS
    // =============================

    /**
     * Listar pedidos do usuário
     */
    async getOrders(status = null) {
        const params = status ? `?status=${status}` : '';
        const orders = await this.request(`/orders${params}`);
        console.log(`✅ ${orders.length} pedidos carregados`);
        return orders;
    }

    /**
     * Listar todos os pedidos (admin)
     */
    async getAllOrders(status = null) {
        const params = status ? `?status=${status}` : '';
        return await this.request(`/orders/all${params}`);
    }

    /**
     * Obter pedido por ID
     */
    async getOrder(id) {
        return await this.request(`/orders/${id}`);
    }

    /**
     * Criar novo pedido
     */
    async createOrder(orderData) {
        const order = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        console.log('✅ Pedido criado:', order.order_number);
        return order;
    }

    /**
     * Atualizar status do pedido (admin)
     */
    async updateOrderStatus(id, status, deliveryDate = null) {
        const data = { status };
        if (deliveryDate) data.delivery_date = deliveryDate;
        
        return await this.request(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // =============================
    // USUÁRIOS (ADMIN)
    // =============================

    /**
     * Listar todos os usuários (admin)
     */
    async getUsers() {
        return await this.request('/users');
    }

    /**
     * Obter usuário por ID (admin)
     */
    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    /**
     * Desativar usuário (admin)
     */
    async deactivateUser(id) {
        await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
        console.log('✅ Usuário desativado');
    }
}

// Instância global da API
const api = new ApiClient(API_CONFIG.BASE_URL);

console.log('✅ API Client inicializado:', API_CONFIG.BASE_URL);

