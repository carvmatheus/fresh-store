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
        
        // Detectar se body é FormData
        const isFormData = options.body instanceof FormData;
        
        // Configurar headers
        const headers = {
            ...this.getHeaders(),
            ...options.headers
        };
        
        // Se for FormData, remover Content-Type para o browser definir automaticamente (com boundary)
        if (isFormData) {
            delete headers['Content-Type'];
        }
        
        const config = {
            ...options,
            headers: headers
        };

        try {
            console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
            if (isFormData) {
                console.log('   📦 FormData detectado (arquivo + dados)');
            }
            
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
            
            // Verificar se a resposta é JSON antes de tentar parsear
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Resposta não é JSON:', text.substring(0, 200));
                
                if (response.status === 404) {
                    throw new Error('Rota não encontrada no servidor. Verifique se o backend está rodando.');
                }
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Não autorizado. Faça login novamente.');
                }
                if (response.status === 413) {
                    throw new Error('Arquivo muito grande. Tente uma imagem menor (máximo 2MB).');
                }
                if (response.status >= 500) {
                    throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
                }
                throw new Error(`Resposta inválida do servidor (${response.status})`);
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
        
        // Verificar se recebeu token
        if (!data.access_token) {
            console.error('❌ ERRO: Backend não retornou access_token!');
            console.error('❌ Resposta completa:', data);
            throw new Error('Servidor não retornou token de autenticação');
        }
        
        // Salvar token JWT
        this.token = data.access_token;
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Aguardar um pouco para garantir persistência
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Confirmar salvamento (múltiplas verificações)
        let tokenSalvo = localStorage.getItem('auth_token');
        let userSalvo = localStorage.getItem('currentUser');
        
        // Se não salvou, tentar novamente
        if (!tokenSalvo && data.access_token) {
            console.warn('⚠️ Token não foi salvo na primeira tentativa. Tentando novamente...');
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Verificar novamente
            tokenSalvo = localStorage.getItem('auth_token');
            userSalvo = localStorage.getItem('currentUser');
        }
        
        console.log('✅ Token JWT salvo:', !!tokenSalvo, `(${tokenSalvo ? tokenSalvo.substring(0, 20) + '...' : 'VAZIO'})`);
        console.log('✅ Usuário salvo:', !!userSalvo);
        
        if (!tokenSalvo) {
            console.error('❌ ERRO CRÍTICO: Token não foi salvo após múltiplas tentativas!');
            throw new Error('Falha ao salvar token no localStorage');
        }
        
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
     * Obter perfil completo do usuário (com endereço)
     */
    async getMyProfile() {
        return await this.request('/auth/me/profile');
    }

    /**
     * Atualizar perfil do usuário (nome, telefone, endereço)
     */
    async updateMyProfile(profileData) {
        const updated = await this.request('/auth/me/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        // Atualizar dados no localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const mergedUser = { ...currentUser, ...updated };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        
        console.log('✅ Perfil atualizado:', updated.name);
        return updated;
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
    async logout() {
        // Salvar carrinho antes de fazer logout
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (currentUser) {
                // Tentar obter carrinho do backend antes de fazer logout
                try {
                    const cartResponse = await this.getCart();
                    if (cartResponse && cartResponse.items && cartResponse.items.length > 0) {
                        // Salvar carrinho no localStorage vinculado ao usuário
                        const cartKey = `user_cart_${currentUser.id}`;
                        localStorage.setItem(cartKey, JSON.stringify(cartResponse.items));
                        console.log('💾 Carrinho salvo no localStorage antes do logout:', cartResponse.items.length, 'itens');
                    }
                } catch (error) {
                    console.warn('⚠️ Não foi possível obter carrinho do backend antes do logout:', error);
                    // Tentar salvar do sessionStorage como fallback
                    const sessionCart = sessionStorage.getItem('freshStoreCart');
                    if (sessionCart) {
                        const cartKey = `user_cart_${currentUser.id}`;
                        localStorage.setItem(cartKey, sessionCart);
                        console.log('💾 Carrinho salvo do sessionStorage antes do logout');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro ao salvar carrinho antes do logout:', error);
        }
        
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('freshStoreCart'); // Limpar carrinho da sessão ao fazer logout
        console.log('✅ Logout realizado');
    }

    // =============================
    // CARRINHO
    // =============================

    /**
     * Obter carrinho da sessão
     */
    async getCart() {
        return await this.request('/cart/');
    }

    /**
     * Salvar carrinho na sessão
     */
    async saveCart(items) {
        return await this.request('/cart/', {
            method: 'POST',
            body: JSON.stringify(items)
        });
    }

    /**
     * Limpar carrinho da sessão
     */
    async clearCart() {
        await this.request('/cart/', {
            method: 'DELETE'
        });
        console.log('✅ Carrinho limpo');
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
     * Aceita FormData (com arquivo) ou objeto JSON
     */
    async createProduct(productData) {
        // Se for FormData, enviar diretamente; senão, converter para JSON
        const body = productData instanceof FormData 
            ? productData 
            : JSON.stringify(productData);
        
        const product = await this.request('/products', {
            method: 'POST',
            body: body
        });
        console.log('✅ Produto criado:', product.name);
        return product;
    }

    /**
     * Atualizar produto (admin)
     * Aceita FormData (com arquivo) ou objeto JSON
     */
    async updateProduct(id, productData) {
        // Se for FormData, enviar diretamente; senão, converter para JSON
        const body = productData instanceof FormData 
            ? productData 
            : JSON.stringify(productData);
        
        const product = await this.request(`/products/${id}`, {
            method: 'PUT',
            body: body
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
     * Atualizar ordem de exibição dos produtos (admin)
     */
    async updateProductsOrder(products) {
        const result = await this.request('/products/order/update', {
            method: 'PUT',
            body: JSON.stringify({ products })
        });
        console.log('✅ Ordem atualizada:', result);
        return result;
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
     * Calcular frete/entrega
     */
    async calculateDelivery(cep, cartTotal) {
        return await this.request('/orders/calculate-delivery', {
            method: 'POST',
            body: JSON.stringify({ cep, cart_total: cartTotal })
        });
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

