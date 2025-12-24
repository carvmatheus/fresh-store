// Sistema de Autenticação - Da Horta Distribuidora
// Sempre usa JWT do backend (PostgreSQL)

// Login (sempre via API backend com JWT)
async function login(usernameOrEmail, password) {
  console.log('🔐 Iniciando login com:', usernameOrEmail);
  console.log('🌐 API URL:', API_CONFIG.BASE_URL);
  
  try {
    // Login via API - gera JWT
    console.log('📡 Enviando requisição de login para backend...');
    const result = await api.login(usernameOrEmail, password);
    
    console.log('✅ Login bem-sucedido via API!');
    console.log('👤 Usuário:', result.user.username);
    console.log('🎭 Role:', result.user.role);
    console.log('🔑 Token JWT recebido:', result.access_token ? 'SIM' : 'NÃO');
    
    // Aguardar um pouco para garantir que localStorage foi persistido
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar se o token foi salvo (múltiplas tentativas)
    let savedToken = localStorage.getItem('auth_token');
    let savedUser = localStorage.getItem('currentUser');
    
    console.log('💾 Token salvo no localStorage:', !!savedToken);
    console.log('💾 Usuário salvo no localStorage:', !!savedUser);
    
    // Se não salvou, tentar salvar manualmente
    if (!savedToken && result.access_token) {
      console.warn('⚠️ Token não foi salvo automaticamente. Salvando manualmente...');
      localStorage.setItem('auth_token', result.access_token);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      
      // Verificar novamente
      savedToken = localStorage.getItem('auth_token');
      savedUser = localStorage.getItem('currentUser');
      
      console.log('💾 Token salvo manualmente:', !!savedToken);
      console.log('💾 Usuário salvo manualmente:', !!savedUser);
    }
    
    if (!savedToken) {
      console.error('❌ ERRO: Token JWT não foi salvo no localStorage!');
      console.error('❌ Token da resposta:', result.access_token ? 'PRESENTE' : 'AUSENTE');
      throw new Error('Token não foi salvo corretamente. Tente novamente.');
    }
    
    // Verificar se o usuário está correto
    if (!savedUser) {
      console.error('❌ ERRO: Usuário não foi salvo no localStorage!');
      throw new Error('Dados do usuário não foram salvos. Tente novamente.');
    }
    
    // Confirmar dados salvos antes de redirecionar
    console.log('✅ Dados confirmados no localStorage:');
    console.log('   - Token:', savedToken.substring(0, 20) + '...');
    console.log('   - Usuário:', JSON.parse(savedUser).username);
    
    // Redirecionar baseado no role e status de aprovação
    let redirectUrl = 'index.html';
    
    if (result.user.role === 'admin' || result.user.role === 'consultor') {
      // Admins e consultores vão para o dashboard
      redirectUrl = 'admin-dashboard.html';
    } else if (result.user.approval_status === 'approved') {
      // Clientes aprovados vão para a página de pedidos
      redirectUrl = 'cliente.html';
    } else {
      // Clientes pendentes ou suspensos vão para index (verão mensagem apropriada)
      redirectUrl = 'index.html';
    }
    
    console.log('🔀 Redirecionando para:', redirectUrl);
    console.log('📋 Status de aprovação:', result.user.approval_status);
    
    // Carregar carrinho após login bem-sucedido (antes de redirecionar)
    try {
      // Aguardar um pouco para garantir que o token foi salvo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentar carregar carrinho do backend ou localStorage
      // A função pode estar em window.loadCartFromStorage ou globalmente
      const loadCartFn = window.loadCartFromStorage || (typeof loadCartFromStorage !== 'undefined' ? loadCartFromStorage : null);
      
      if (loadCartFn && typeof loadCartFn === 'function') {
        await loadCartFn();
        console.log('📦 Carrinho carregado após login');
      } else {
        console.log('ℹ️ Função loadCartFromStorage não disponível ainda (será carregada na página)');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar carrinho após login:', error);
      // Continuar mesmo se houver erro ao carregar carrinho
    }
    
    // Usar setTimeout para garantir que o redirecionamento aconteça
    setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 50);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    console.error('❌ Mensagem:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Mostrar erro apropriado
    if (error.message.includes('Failed to fetch') || error.message.includes('Load failed')) {
      showLoginError('Erro de conexão com o servidor. Verifique sua internet ou aguarde o servidor iniciar (cold start ~30s).');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      showLoginError('Usuário ou senha incorretos');
    } else if (error.message.includes('aprovação') || error.message.includes('pending')) {
      // Nota: Agora permitimos login de pendentes, não deve chegar aqui
      showLoginError('⏳ Seu cadastro está aguardando aprovação.');
    } else if (error.message.includes('suspenso') || error.message.includes('suspended')) {
      // Nota: Agora permitimos login de suspensos, não deve chegar aqui
      showLoginError('🚫 Sua conta foi suspensa. Entre em contato com o suporte.');
    } else {
      showLoginError('Erro ao fazer login: ' + error.message);
    }
    
    return false;
  }
}

// Tornar login global
if (typeof window !== 'undefined') {
  window.login = login;
}

// Logout
async function logout() {
  // Salvar carrinho no localStorage antes de fazer logout (para preservar entre sessões)
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      // Tentar obter carrinho do backend antes de fazer logout
      try {
        const cartResponse = await api.getCart();
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
  
  await api.logout();
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('freshStoreCart'); // Limpar carrinho da sessão ao fazer logout
  window.location.href = 'index.html';
}

// Verificar se está logado
function isAuthenticated() {
  return localStorage.getItem('currentUser') !== null;
}

// Pegar usuário atual
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Verificar role
function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

// Verificar se usuário está aprovado
function isUserApproved() {
  const user = getCurrentUser();
  if (!user) return false;
  // Admins e consultores são sempre considerados aprovados
  if (user.role === 'admin' || user.role === 'consultor') return true;
  // Clientes precisam ter approval_status === 'approved'
  return user.approval_status === 'approved';
}

// Verificar se usuário está pendente
function isUserPending() {
  const user = getCurrentUser();
  if (!user) return false;
  return user.approval_status === 'pending';
}

// Verificar se usuário está suspenso
function isUserSuspended() {
  const user = getCurrentUser();
  if (!user) return false;
  return user.approval_status === 'suspended';
}

// Proteger página (redireciona se não estiver logado)
function requireAuth(requiredRole = null) {
  const user = getCurrentUser();
  
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = 'index.html';
    return false;
  }
  
  return true;
}

// Atualizar UI baseado no status de autenticação
function updateAuthUI() {
  const user = getCurrentUser();
  
  // Elementos
  const loginBtn = document.getElementById('loginBtn');
  const userName = document.getElementById('userName');
  const menuLoginLink = document.getElementById('menuLoginLink');
  const menuLogoutLink = document.getElementById('menuLogoutLink');
  const menuClienteLink = document.getElementById('menuClienteLink');
  const menuAdminLink = document.getElementById('menuAdminLink');
  
  if (user) {
    // Usuário logado
    if (loginBtn) {
      loginBtn.querySelector('.login-text').textContent = user.name.split(' ')[0];
      loginBtn.onclick = () => {
        if (user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'cliente.html';
        }
      };
    }
    
    if (userName) {
      userName.textContent = user.name;
    }
    
    if (menuLoginLink) menuLoginLink.style.display = 'none';
    if (menuLogoutLink) menuLogoutLink.style.display = 'block';
    
    // Mostrar links baseado no role
    if (user.role === 'cliente' && menuClienteLink) {
      menuClienteLink.style.display = 'block';
    }
    
    if (user.role === 'admin' && menuAdminLink) {
      menuAdminLink.style.display = 'block';
    }
  } else {
    // Usuário não logado
    if (loginBtn) {
      loginBtn.querySelector('.login-text').textContent = 'Entrar';
    }
    
    if (userName) {
      userName.textContent = 'Visitante';
    }
    
    if (menuLoginLink) menuLoginLink.style.display = 'block';
    if (menuLogoutLink) menuLogoutLink.style.display = 'none';
    if (menuClienteLink) menuClienteLink.style.display = 'none';
    if (menuAdminLink) menuAdminLink.style.display = 'none';
  }
}

// Mostrar erro de login
function showLoginError(message) {
  const errorDiv = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');
  
  if (errorDiv && errorMsg) {
    errorMsg.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
      errorDiv.classList.add('hidden');
    }, 5000);
  }
}

// Ir para login
function goToLogin() {
  const user = getCurrentUser();
  if (user) {
    if (user.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'cliente.html';
    }
  } else {
    window.location.href = 'login.html';
  }
}

// Inicializar no load da página
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
  });
}

