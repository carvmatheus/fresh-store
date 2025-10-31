/**
 * Configuração da API - Da Horta Distribuidora
 * 
 * IMPORTANTE: Configurar BASE_URL conforme ambiente
 */

// Detectar ambiente
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const API_CONFIG = {
    // URL da API - ajustar conforme necessário
    BASE_URL: isProduction 
        ? 'https://dahorta-backend.onrender.com/api'  // Produção (Render)
        : 'http://localhost:8000/api',                 // Desenvolvimento local
    
    // Timeout para requisições (30 segundos - Render pode demorar no cold start)
    TIMEOUT: 30000,
    
    // Configuração de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // Configuração de CORS
    CREDENTIALS: 'omit',
    MODE: 'cors'
};

// Log de configuração
console.log('🔧 API Config:', {
    environment: isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO',
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retries: API_CONFIG.MAX_RETRIES
});

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
