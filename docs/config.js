/**
 * Configuração da API
 */

const API_CONFIG = {
    // URL base da API (alterar em produção)
    BASE_URL: 'http://localhost:8000/api',
    
    // Timeout para requisições (30 segundos)
    TIMEOUT: 30000,
    
    // Configuração de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}

