/**
 * Configuração da API - Da Horta Distribuidora
 * Backend: PostgreSQL + Cloudinary
 */

const isProduction = typeof window !== 'undefined' 
  ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  : process.env.NODE_ENV === 'production';

export const API_CONFIG = {
  // URL da API
  BASE_URL: isProduction 
      ? 'https://compredahorta.com.br/api'  // Produção (VPS)
    : 'https://compredahorta.com.br/api', // Desenvolvimento local (usando prod API)
  
  // Timeout para requisições (30 segundos - Render pode demorar no cold start)
  TIMEOUT: 30000,
  
  // Configuração de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Configuração de CORS
  CREDENTIALS: 'omit' as RequestCredentials,
  MODE: 'cors' as RequestMode,
  
  // Backend info
  DATABASE: 'PostgreSQL',
  STORAGE: 'Cloudinary',
  VERSION: '2.0'
};

export default API_CONFIG;
