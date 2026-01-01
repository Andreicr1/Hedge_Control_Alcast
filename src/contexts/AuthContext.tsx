import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, LoginRequest, TokenResponse, RoleName } from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar token e usuário do localStorage na inicialização
  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Erro ao parsear usuário armazenado:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    loadStoredAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    // Verificar se está em modo mock
    const useMockEnv = import.meta.env.VITE_USE_MOCK_DATA;
    const useMock = useMockEnv === 'true';

    console.log('🔐 Iniciando login...');
    console.log('   VITE_USE_MOCK_DATA:', useMockEnv);
    console.log('   Modo detectado:', useMock ? 'MOCK' : 'API REAL');

    // SEMPRE tentar modo mock primeiro se configurado
    if (useMock) {
      console.log('🧪 Modo MOCK ativo - Login simulado');
      
      // Simular login mockado
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser: User = {
        id: 1,
        email: credentials.username,
        name: 'Usuário Mock',
        active: true,
        role: {
          id: 1,
          name: RoleName.ADMIN,
          description: 'Administrador Mock',
        },
        created_at: new Date().toISOString(),
      };

      // Salvar token e usuário mockados
      setToken(mockToken);
      localStorage.setItem('token', mockToken);
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      console.log('✅ Login mock bem-sucedido');
      return;
    }

    // Modo produção - chamar backend real COM fallback para mock
    try {
      console.log('🌐 Modo API REAL - Chamando backend...');
      
      // Chamar endpoint de login do backend
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await api.post<TokenResponse>('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      
      // Salvar token
      setToken(access_token);
      localStorage.setItem('token', access_token);

      // Buscar dados do usuário
      const userResponse = await api.get<User>('/auth/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userData = userResponse.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Login backend bem-sucedido');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      // Se for erro 404 ou de conexão, usar fallback para mock
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.warn('⚠️ Backend não disponível - Usando modo mock como fallback');
        
        // Fazer login mock
        const mockToken = 'mock-jwt-token-' + Date.now();
        const mockUser: User = {
          id: 1,
          email: credentials.username,
          name: 'Usuário Mock (Fallback)',
          active: true,
          role: {
            id: 1,
            name: RoleName.ADMIN,
            description: 'Administrador Mock',
          },
          created_at: new Date().toISOString(),
        };

        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        console.log('✅ Login mock (fallback) bem-sucedido');
        return;
      }
      
      // Se for outro tipo de erro (401, 403, etc), propagar
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Hook auxiliar para verificar role do usuário
export const useUserRole = (): RoleName | null => {
  const { user } = useAuth();
  return user?.role?.name || null;
};

// Hook para verificar se usuário tem uma das roles
export const useHasRole = (roles: RoleName[]): boolean => {
  const userRole = useUserRole();
  return userRole ? roles.includes(userRole) : false;
};
