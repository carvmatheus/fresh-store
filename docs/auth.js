// Sistema de Autenticação - Da Horta Distribuidora

// Usuários demo (em produção, isso viria de um backend)
const DEMO_USERS = [
  {
    id: 1,
    username: 'cliente',
    email: 'cliente@dahorta.com',
    password: 'cliente123',
    role: 'cliente',
    name: 'João Silva',
    company: 'Restaurante Bom Sabor'
  },
  {
    id: 2,
    username: 'admin',
    email: 'admin@dahorta.com',
    password: 'admin123',
    role: 'admin',
    name: 'Jean Dutra',
    company: 'Da Horta Distribuidora'
  }
];

// Login (usando API backend)
async function login(usernameOrEmail, password) {
  console.log('Login chamado com:', usernameOrEmail);
  
  try {
    // Tentar login via API
    const result = await api.login(usernameOrEmail, password);
    
    console.log('✅ Login bem-sucedido via API:', result.user.username);
    
    // Redirecionar baseado no role
    if (result.user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'cliente.html';
    }
    
    return true;
  } catch (error) {
    console.error('❌ Login falhou:', error);
    
    // Fallback: tentar usuários demo (desenvolvimento)
    console.log('⚠️ Tentando fallback com usuários demo...');
    const user = DEMO_USERS.find(u => 
      (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
      u.password === password
    );

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      console.log('✅ Login bem-sucedido (fallback):', user.username);
      
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'cliente.html';
      }
      return true;
    }
    
    showLoginError('Usuário ou senha incorretos');
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

