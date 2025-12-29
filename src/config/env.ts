// Configuração centralizada de ambiente

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const rawPrefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1';
const apiPrefix = rawPrefix && rawPrefix !== '/' ? rawPrefix : '';

export const config = {
  apiUrl,
  apiPrefix,
  apiBaseUrl: `${apiUrl}${apiPrefix}`,
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Log da configuração no console (apenas em desenvolvimento)
if (config.isDevelopment) {
  console.log('📋 Configuração do Sistema:');
  console.log('   API URL:', config.apiBaseUrl);
  console.log('   Modo Mock:', config.useMockData ? '✅ ATIVO (dados mockados)' : '❌ INATIVO (API real)');
  console.log('   Ambiente:', config.isDevelopment ? 'Desenvolvimento' : 'Produção');
}

export default config;
