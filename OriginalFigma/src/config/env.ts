// Configuração centralizada de ambiente

export const config = {
  // URL da API backend
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Modo mock (desenvolvimento sem backend)
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  
  // Ambiente
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Log da configuração no console (apenas em desenvolvimento)
if (config.isDevelopment) {
  console.log('📋 Configuração do Sistema:');
  console.log('   API URL:', config.apiUrl);
  console.log('   Modo Mock:', config.useMockData ? '✅ ATIVO (dados mockados)' : '❌ INATIVO (API real)');
  console.log('   Ambiente:', config.isDevelopment ? 'Desenvolvimento' : 'Produção');
}

export default config;
