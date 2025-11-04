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
    
    // Verificar se o token foi salvo
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('currentUser');
    
    console.log('💾 Token salvo no localStorage:', !!savedToken);
    console.log('💾 Usuário salvo no localStorage:', !!savedUser);
    
    if (!savedToken) {
      console.error('❌ ERRO: Token JWT não foi salvo no localStorage!');
      throw new Error('Token não foi salvo corretamente');
    }
    
    // Redirecionar baseado no role
    console.log('🔀 Redirecionando para:', result.user.role === 'admin' ? 'admin.html' : 'cliente.html');
    
    if (result.user.role === 'admin') {
      window.location.replace('admin.html');
    } else {
      window.location.replace('cliente.html');
    }
    
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
function logout() {
  api.logout();
  localStorage.removeItem('currentUser');
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
      window.location.href = 'admin.html';
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

