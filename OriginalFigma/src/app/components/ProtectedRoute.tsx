import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se o usuário tem permissão para acessar a rota
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.name;
    
    // Admin sempre tem acesso
    if (userRole !== RoleName.ADMIN && !allowedRoles.includes(userRole as RoleName)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 mb-4">
              <h2 className="text-2xl font-semibold text-destructive mb-2">Acesso Negado</h2>
              <p className="text-foreground">
                Você não tem permissão para acessar esta área do sistema.
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
