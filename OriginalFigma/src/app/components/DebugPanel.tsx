import React, { useState } from 'react';
import { useData } from '../../contexts/DataContextAPI';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/env';

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Tentar usar os hooks com fallback seguro
  let dataContext;
  let authContext;
  
  try {
    dataContext = useData();
  } catch (error) {
    console.warn('DebugPanel: DataContext não disponível ainda');
    dataContext = { isUsingMock: false, purchaseOrders: [], salesOrders: [] };
  }
  
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('DebugPanel: AuthContext não disponível ainda');
    authContext = { user: null, token: null, isAuthenticated: false };
  }
  
  const { isUsingMock, purchaseOrders, salesOrders } = dataContext;
  const { user, token, isAuthenticated } = authContext;

  if (!config.isDevelopment) return null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-purple-700 z-50"
        title="Debug Panel"
      >
        🐛
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white border border-gray-300 rounded-lg shadow-2xl p-4 w-96 max-h-96 overflow-y-auto z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm">🐛 Debug Panel</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Configuração */}
            <div className="space-y-1 text-xs">
              <h4 className="font-semibold">⚙️ Configuração</h4>
              <div className="bg-gray-100 p-2 rounded">
                <div>API URL: <code className="text-purple-600">{config.apiUrl}</code></div>
                <div>Modo Mock: {config.useMockData ? '✅ ATIVO' : '❌ INATIVO'}</div>
                <div>Ambiente: {config.isDevelopment ? 'Dev' : 'Prod'}</div>
              </div>
            </div>

            {/* Autenticação */}
            <div className="space-y-1 text-xs">
              <h4 className="font-semibold">🔐 Autenticação</h4>
              <div className="bg-gray-100 p-2 rounded">
                <div>Autenticado: {isAuthenticated ? '✅ SIM' : '❌ NÃO'}</div>
                <div>Token: {token ? '✅ Presente' : '❌ Ausente'}</div>
                {user && (
                  <>
                    <div>Usuário: {user.name}</div>
                    <div>Role: {user.role?.name}</div>
                  </>
                )}
              </div>
            </div>

            {/* Dados */}
            <div className="space-y-1 text-xs">
              <h4 className="font-semibold">📊 Dados Carregados</h4>
              <div className="bg-gray-100 p-2 rounded">
                <div>Modo: {isUsingMock ? '🧪 Mock' : '🌐 API Real'}</div>
                <div>POs: {purchaseOrders.length} itens</div>
                <div>SOs: {salesOrders.length} itens</div>
              </div>
            </div>

            {/* Variáveis de Ambiente */}
            <div className="space-y-1 text-xs">
              <h4 className="font-semibold">🔧 Env Variables</h4>
              <div className="bg-gray-100 p-2 rounded font-mono">
                <div>VITE_API_URL: {import.meta.env.VITE_API_URL}</div>
                <div>VITE_USE_MOCK_DATA: {String(import.meta.env.VITE_USE_MOCK_DATA)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
              >
                🗑️ Limpar Storage e Recarregar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
              >
                🔄 Recarregar Página
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};