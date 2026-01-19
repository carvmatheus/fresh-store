/**
 * Cliente HTTP para comunicação com a API - Da Horta
 */

import { API_CONFIG } from './config';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'cliente' | 'consultor';
  approval_status: 'pending' | 'approved' | 'suspended';
  company_name?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
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
  displayOrder: number;
  isActive: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  created_at: string;
  delivery_date?: string;
  notes?: string;
}

export interface OrderItem {
  product_id: number;
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
      
      const data = await response.json();
      
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
        
        // Outros erros
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            throw new Error(data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
          }
          throw new Error(String(data.detail))
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
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

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async updateProductsOrder(products: { id: string; display_order: number }[]): Promise<{ message: string }> {
    return await this.request<{ message: string }>('/products/order/update', {
      method: 'PUT',
      body: JSON.stringify({ products })
    });
  }

  async getCategories(): Promise<string[]> {
    return await this.request<string[]>('/products/categories/list');
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

  async getOrder(id: number): Promise<Order> {
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

  async updateOrderStatus(id: number, status: string, deliveryDate?: string): Promise<Order> {
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
    return await this.request<User[]>('/users/all');
  }

  async getUser(id: number): Promise<User> {
    return await this.request<User>(`/users/${id}`);
  }

  async updateUser(id: number | string, userData: Partial<User>): Promise<User> {
    return await this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async updateUserApproval(id: number, status: 'approved' | 'pending' | 'suspended' | 'rejected'): Promise<User> {
    return await this.request<User>(`/users/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status: status })
    });
  }

  async approveUser(id: number): Promise<User> {
    return this.updateUserApproval(id, 'approved');
  }

  async rejectUser(id: number): Promise<User> {
    return this.updateUserApproval(id, 'rejected');
  }

  async suspendUser(id: number): Promise<User> {
    return this.updateUserApproval(id, 'suspended');
  }

  async deactivateUser(id: number): Promise<void> {
    await this.request(`/users/${id}`, { method: 'DELETE' });
  }
}

// Instância global da API
export const api = new ApiClient(API_CONFIG.BASE_URL);

export default api;
