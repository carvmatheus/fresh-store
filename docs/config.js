/**
 * Configuração da API - Da Horta Distribuidora
 * 
 * IMPORTANTE: Atualizar BASE_URL após deploy do backend no Render
 */

const API_CONFIG = {
    // URL da API no Render.com (produção)
    // Atualizar esta URL após criar o Web Service no Render
    BASE_URL: 'https://dahorta-backend.onrender.com/api',
    
    // Para desenvolvimento local, usar:
    // BASE_URL: 'http://localhost:8000/api',
    
    // Timeout para requisições (30 segundos - Render pode demorar no cold start)
    TIMEOUT: 30000,
    
    // Configuração de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // Configuração de CORS
    CREDENTIALS: 'omit',
    MODE: 'cors'
};

// Log de configuração (apenas desenvolvimento)
console.log('🔧 API Config:', {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retries: API_CONFIG.MAX_RETRIES
});

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
