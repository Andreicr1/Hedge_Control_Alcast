import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleName } from '../../types/api';
import config from '../../config/env';
import logo from '../../assets/25708fe7a59949aebee89a264b778b057f612b74.png';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username: email, password });
      
      // Buscar role do usuário após login
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Redirecionar baseado no role
        if (user.role?.name === RoleName.FINANCEIRO) {
          navigate('/financeiro/dashboard');
        } else if (user.role?.name === RoleName.COMPRAS) {
          navigate('/compras/pos');
        } else if (user.role?.name === RoleName.VENDAS) {
          navigate('/vendas/sos');
        } else if (user.role?.name === RoleName.ADMIN) {
          navigate('/financeiro/dashboard'); // Admin acessa o fluxo Financeiro por padrão
        } else if (user.role?.name === RoleName.ESTOQUE) {
          navigate('/estoque');
        } else {
          navigate('/estoque');
        }
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-xl p-8 border">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Alcast" className="h-16" />
            </div>
            <h2 className="text-2xl font-semibold text-sky-900 mb-2">Hedge Control</h2>
            
            {config.useMockData && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-xs mb-3">
                <strong>Modo Mock Ativo</strong>
                <div className="mt-1">Qualquer email/senha funciona</div>
              </div>
            )}
            
            <p className="text-sm text-destructive mt-2">
              Acesso Restrito - Somente Pessoal Autorizado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.useMockData ? "qualquer@email.com" : "usuario@alcast.com"}
                required
                className="w-full px-4 py-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={config.useMockData ? "qualquer senha" : "••••••••"}
                required
                className="w-full px-4 py-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>

            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                Alcast Hedge Control v1.0 - Backend API Python/FastAPI
              </p>
              {config.useMockData && (
                <p className="text-xs text-yellow-600 mt-1">
                  🧪 Dados mockados • Backend não necessário
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
