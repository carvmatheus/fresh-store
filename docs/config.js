/**
 * Configuração da API - Da Horta Distribuidora
 * Backend: PostgreSQL + Cloudinary
 */

// Detectar ambiente
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const API_CONFIG = {
    // URL da API
    BASE_URL: isProduction 
        ? 'https://compredahorta.com.br/api'  // Produção (VPS)
        : 'http://localhost:8000/api',   // Desenvolvimento local
    
    // Timeout para requisições (30 segundos - Render pode demorar no cold start)
    TIMEOUT: 30000,
    
    // Configuração de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // Configuração de CORS
    CREDENTIALS: 'omit',
    MODE: 'cors',
    
    // Backend info
    DATABASE: 'PostgreSQL',
    STORAGE: 'Cloudinary',
    VERSION: '2.0'
};

// Log de configuração
console.log('🔧 Da Horta API Config:', {
    environment: isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO',
    baseUrl: API_CONFIG.BASE_URL,
    database: API_CONFIG.DATABASE,
    storage: API_CONFIG.STORAGE,
    version: API_CONFIG.VERSION
});

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
