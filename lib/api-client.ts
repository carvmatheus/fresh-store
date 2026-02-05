/**
 * Cliente HTTP para comunicação com a API - Da Horta
 */

import { API_CONFIG } from './config';

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'cliente' | 'consultor' | 'god';
  tier?: 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';
  approval_status: 'pending' | 'approved' | 'suspended';
  suspension_reason?: string;
  company_name?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  orders_count?: number;
  total_spent?: number;
  last_purchase?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  promoPrice?: number | null;
  unit: string;
  minOrder: number;
  stock: number;
  image: string;
  description: string;
  isPromo: boolean;
  tierPricing?: Record<string, { type: 'fixed' | 'percentage'; value: number }>;
  finalPrice?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string; // UUID
  order_number: string;
  user_id: string; // UUID
  status: 'pendente' | 'confirmado' | 'em_preparacao' | 'em_transporte' | 'concluido' | 'cancelado' | 'reembolsado';
  total: number;
  items: OrderItem[];
  created_at: string;
  delivery_date?: string;
  notes?: string;
}

export interface OrderItem {
  product_id: string; // UUID
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Obter headers para requisições
   */
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
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
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Detectar se body é FormData
    const isFormData = options.body instanceof FormData;

    // Configurar headers
    const headers: Record<string, string> = {
      ...Object.fromEntries(Object.entries(this.getHeaders())),
      ...Object.fromEntries(Object.entries(options.headers || {}))
    };

    // Se for FormData, remover Content-Type para o browser definir automaticamente
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

      // Criar timeout para a requisição
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeout);

      console.log(`✅ API Response: ${response.status} ${response.statusText}`);

      // Se status 204 (No Content), retornar null
      if (response.status === 204) {
        return null as T;
      }

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 200));

        if (response.status === 404) {
          throw new Error('Rota não encontrada no servidor.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Não autorizado. Faça login novamente.');
        }
        throw new Error(`Resposta inválida do servidor (${response.status})`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Se não conseguir parsear JSON, tentar ler como texto
        const text = await response.text();
        console.error(`❌ API Error ${response.status} - Resposta não é JSON:`, text.substring(0, 200));
        throw new Error(`Erro ${response.status}: ${response.statusText || 'Erro no servidor'}`);
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);

        // Tratar erro 422 (validação) - mostrar detalhes
        if (response.status === 422 && data.detail) {
          let errorMsg = 'Erro de validação:\n'
          if (Array.isArray(data.detail)) {
            errorMsg += data.detail.map((err: any) => {
              const field = err.loc?.join('.') || 'campo'
              const msg = err.msg || 'erro desconhecido'
              return `• ${field}: ${msg}`
            }).join('\n')
          } else if (typeof data.detail === 'string') {
            errorMsg = data.detail
          } else {
            errorMsg = JSON.stringify(data.detail, null, 2)
          }
          throw new Error(errorMsg)
        }

        // Outros erros - verificar se data.detail existe
        if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            throw new Error(data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
          }
          throw new Error(String(data.detail))
        }

        // Se data está vazio ou não tem detail, usar mensagem genérica mais informativa
        if (response.status === 500) {
          throw new Error('Erro interno do servidor. Por favor, tente novamente mais tarde.');
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ API Timeout');
        throw new Error('Timeout: O servidor demorou muito para responder.');
      }
      throw error;
    }
  }

  // =============================
  // AUTENTICAÇÃO
  // =============================

  async login(username: string, password: string): Promise<LoginResponse> {
    console.log('📡 ApiClient: Enviando credenciais...');

    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (!data.access_token) {
      throw new Error('Servidor não retornou token de autenticação');
    }

    // Salvar token JWT
    this.token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    console.log('✅ Login realizado com sucesso:', data.user.username);

    return data;
  }

  async register(userData: Record<string, any>): Promise<LoginResponse> {
    console.log('📤 Enviando dados de cadastro:', userData);

    const data = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    this.token = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    console.log('✅ Cadastro realizado:', data.user.username);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    return await this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    // Salvar carrinho antes de fazer logout (idêntico ao original)
    try {
      if (typeof window !== 'undefined') {
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
      }
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho antes do logout:', error);
    }

    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('freshStoreCart');
    }
    console.log('✅ Logout realizado');
  }

  // =============================
  // CARRINHO
  // =============================

  async getCart(): Promise<{ items: CartItem[] }> {
    return await this.request<{ items: CartItem[] }>('/cart/');
  }

  async saveCart(items: CartItem[]): Promise<void> {
    await this.request('/cart/', {
      method: 'POST',
      body: JSON.stringify(items)
    });
  }

  async clearCart(): Promise<void> {
    await this.request('/cart/', { method: 'DELETE' });
  }

  // =============================
  // PRODUTOS
  // =============================

  async getProducts(filters: {
    category?: string;
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<Product[]> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));

    // Sempre buscar todos os produtos (limite alto) para evitar paginação
    const limit = filters.limit ?? 500;
    params.append('limit', String(limit));
    params.append('active_only', 'false');
    const queryString = params.toString();
    const endpoint = `/products?${queryString}`;

    const productsData = await this.request<any[]>(endpoint);

    // Normalizar dados do PostgreSQL
    return productsData.map(p => ({
      id: String(p.id),
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      promoPrice: p.promo_price ? parseFloat(p.promo_price) : null,
      unit: p.unit,
      minOrder: p.min_order || 1,
      stock: p.stock,
      image: p.image_url || 'https://via.placeholder.com/400',
      description: p.description || '',
      isPromo: p.is_promo === true,
      tierPricing: p.tier_pricing,
      finalPrice: p.final_price ? parseFloat(p.final_price) : undefined,
      displayOrder: p.display_order || 0,
      isActive: p.is_active !== false
    }));
  }

  async getProduct(id: string): Promise<Product> {
    return await this.request<Product>(`/products/${id}`);
  }

  async createProduct(productData: FormData | Partial<Product>): Promise<Product> {
    const body = productData instanceof FormData
      ? productData
      : JSON.stringify(productData);

    return await this.request<Product>('/products', {
      method: 'POST',
      body: body as BodyInit
    });
  }

  async updateProduct(id: string, productData: FormData | Partial<Product>): Promise<Product> {
    const body = productData instanceof FormData
      ? productData
      : JSON.stringify(productData);

    return await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: body as BodyInit
    });
  }

  async updateProductStock(id: string, stock: number): Promise<Product> {
    const formData = new FormData();
    formData.append('stock', stock.toString());
    return await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: formData
    });
  }

  async updateProductAvailability(id: string, isActive: boolean): Promise<Product> {
    const formData = new FormData();
    formData.append('is_active', isActive.toString());
    return await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: formData
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async updateProductsOrder(products: { id: string; display_order: number }[]): Promise<{ message: string }> {
    return await this.request<{ message: string }>('/products/order/update', {
      method: 'PUT',
      body: JSON.stringify({ products })
    });
  }

  async updateProductTierPricing(id: string, tierPricing: Record<string, any>): Promise<Product> {
    const formData = new FormData();
    formData.append('tier_pricing', JSON.stringify(tierPricing));

    return await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: formData
    });
  }

  async getCategories(): Promise<string[]> {
    return await this.request<string[]>('/products/categories');
  }

  async bulkUpdatePricing(data: {
    product_ids: string[];
    tier_percentages: { [tier: string]: number };
    apply_to_base_price?: boolean;
  }): Promise<{ updated_count: number; products_updated: any[]; message: string }> {
    return await this.request<{ updated_count: number; products_updated: any[]; message: string }>('/products/bulk-update-pricing', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // =============================
  // PEDIDOS
  // =============================

  async getOrders(status?: string): Promise<Order[]> {
    const params = status ? `?status=${status}` : '';
    return await this.request<Order[]>(`/orders${params}`);
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    const params = status ? `?status=${status}` : '';
    return await this.request<Order[]>(`/orders/all${params}`);
  }

  async getOrder(id: string): Promise<Order> {
    return await this.request<Order>(`/orders/${id}`);
  }

  async createOrder(orderData: {
    items: Array<{
      product_id: string;
      name: string;
      quantity: number;
      unit: string;
      price: number;
      image?: string | null;
    }>;
    shipping_address: {
      street: string;
      number: string;
      complement?: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipcode: string;
    };
    contact_info: {
      name: string;
      email: string;
      phone: string;
    };
    delivery_fee: number;
    notes?: string;
  }): Promise<Order> {
    return await this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async updateOrderStatus(id: string, status: string, deliveryDate?: string): Promise<Order> {
    const data: { status: string; delivery_date?: string } = { status };
    if (deliveryDate) data.delivery_date = deliveryDate;

    return await this.request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // =============================
  // USUÁRIOS (ADMIN)
  // =============================

  async getUsers(): Promise<User[]> {
    return await this.request<User[]>('/users');
  }

  async getAllUsers(): Promise<User[]> {
    // A rota /users já lista todos os usuários para admin
    return await this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return await this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return await this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async updateUserApproval(
    id: string,
    action: 'approve' | 'suspend' | 'reactivate',
    reason?: string
  ): Promise<{ message: string; user_id: string; new_status: string }> {
    return await this.request<{ message: string; user_id: string; new_status: string }>(`/users/${id}/approval`, {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    });
  }

  async approveUser(id: string): Promise<{ message: string; user_id: string; new_status: string }> {
    return this.updateUserApproval(id, 'approve');
  }

  async rejectUser(id: string): Promise<{ message: string; user_id: string; new_status: string }> {
    return this.updateUserApproval(id, 'suspend', 'Rejeitado pelo administrador');
  }

  async suspendUser(id: string): Promise<{ message: string; user_id: string; new_status: string }> {
    return this.updateUserApproval(id, 'suspend');
  }

  async deactivateUser(id: string): Promise<void> {
    await this.request(`/users/${id}`, { method: 'DELETE' });
  }

  async getUserPassword(id: string): Promise<{ hashed_password: string; username: string; email: string }> {
    return await this.request<{ hashed_password: string; username: string; email: string }>(`/users/${id}/password`);
  }

  async updateUserPassword(id: string, newPassword: string): Promise<{ message: string; user_id: string; username: string }> {
    return await this.request<{ message: string; user_id: string; username: string }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword })
    });
  }
}

// Instância global da API
export const api = new ApiClient(API_CONFIG.BASE_URL);

export default api;
