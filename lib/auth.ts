/**
 * Sistema de Autenticação - Da Horta Distribuidora
 * Para uso com Next.js
 */

import { api, User, LoginResponse } from './api-client';

// Login
export async function login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
  console.log('🔐 Iniciando login com:', usernameOrEmail);
  
  try {
    const result = await api.login(usernameOrEmail, password);
    
    console.log('✅ Login bem-sucedido via API!');
    console.log('👤 Usuário:', result.user.username);
    console.log('🎭 Role:', result.user.role);
    
    return result;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
}

// Logout
export async function logout(): Promise<void> {
  // Salvar carrinho antes de fazer logout
  try {
    const currentUser = getCurrentUser();
    if (currentUser && typeof window !== 'undefined') {
      const cartResponse = await api.getCart();
      if (cartResponse?.items?.length > 0) {
        const cartKey = `user_cart_${currentUser.id}`;
        localStorage.setItem(cartKey, JSON.stringify(cartResponse.items));
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao salvar carrinho antes do logout:', error);
  }
  
  await api.logout();
}

// Verificar se está logado
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('currentUser') !== null;
}

// Pegar usuário atual
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Pegar token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Verificar role
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Verificar se é admin
export function isAdmin(): boolean {
  return hasRole('admin');
}

// Verificar se é consultor
export function isConsultor(): boolean {
  return hasRole('consultor');
}

// Verificar se usuário está aprovado
export function isUserApproved(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  // Admins e consultores são sempre considerados aprovados
  if (user.role === 'admin' || user.role === 'consultor') return true;
  return user.approval_status === 'approved';
}

// Verificar se usuário está pendente
export function isUserPending(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.approval_status === 'pending';
}

// Verificar se usuário está suspenso
export function isUserSuspended(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.approval_status === 'suspended';
}

// Obter URL de redirecionamento após login
export function getRedirectUrl(user: User): string {
  if (user.role === 'admin' || user.role === 'consultor') {
    return '/admin';
  }
  if (user.approval_status === 'approved') {
    return '/cliente';
  }
  return '/';
}

// Hook para proteger páginas (use em componentes client-side)
export function useRequireAuth(requiredRole?: string): {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
} {
  // Esta função deve ser usada apenas no cliente
  if (typeof window === 'undefined') {
    return { isLoading: true, isAuthenticated: false, user: null };
  }

  const user = getCurrentUser();
  const authenticated = !!user;
  
  // Verificar role se necessário
  if (requiredRole && user?.role !== requiredRole) {
    return { isLoading: false, isAuthenticated: false, user: null };
  }
  
  return { isLoading: false, isAuthenticated: authenticated, user };
}
