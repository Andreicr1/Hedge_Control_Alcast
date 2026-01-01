import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContextAPI';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleName } from '../types/api';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Estoque } from './pages/Estoque';

// Financeiro
import { FinanceiroDashboard } from './pages/financeiro/Dashboard';
import { FinanceiroRFQs } from './pages/financeiro/RFQs';
import { NovoRFQ } from './pages/financeiro/NovoRFQ';
import { FinanceiroContratos } from './pages/financeiro/Contratos';
import { FinanceiroContrapartes } from './pages/financeiro/Contrapartes';
import { FinanceiroRelatorios } from './pages/financeiro/Relatorios';
import { RFQDetalhe } from './pages/financeiro/RFQDetalhe';

// Compras
import { ComprasFornecedores } from './pages/compras/Fornecedores';
import { ComprasPOs } from './pages/compras/POs';

// Vendas
import { VendasClientes } from './pages/vendas/Clientes';
import { VendasSOs } from './pages/vendas/SOs';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  const defaultRouteByRole = (role?: RoleName) => {
    switch (role) {
      case RoleName.FINANCEIRO:
        return '/financeiro/dashboard';
      case RoleName.COMPRAS:
        return '/compras/pos';
      case RoleName.VENDAS:
        return '/vendas/sos';
      case RoleName.ESTOQUE:
        return '/estoque';
      case RoleName.ADMIN:
        return '/financeiro/dashboard';
      default:
        return '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderProtected = (component: React.ReactNode, allowedRoles: RoleName[]) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{component}</AppLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={defaultRouteByRole(user?.role?.name)} replace /> : <Login />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to={defaultRouteByRole(user?.role?.name)} replace /> : <Signup />
        }
      />
      
      <Route
        path="/financeiro/dashboard"
        element={renderProtected(<FinanceiroDashboard />, [RoleName.FINANCEIRO, RoleName.ADMIN])}
      />
      <Route
        path="/financeiro/inbox"
        element={renderProtected(<Navigate to="/financeiro/dashboard" replace />, [RoleName.FINANCEIRO, RoleName.ADMIN])}
      />
      <Route
        path="/financeiro/rfqs"
        element={
          renderProtected(<FinanceiroRFQs />, [RoleName.FINANCEIRO, RoleName.ADMIN])
        }
      />
      <Route
        path="/financeiro/rfqs/:id"
        element={
          renderProtected(<RFQDetalhe />, [RoleName.FINANCEIRO, RoleName.ADMIN])
        }
      />
      <Route
        path="/financeiro/novorfq"
        element={
          renderProtected(<NovoRFQ />, [RoleName.FINANCEIRO, RoleName.ADMIN])
        }
      />
      <Route
        path="/financeiro/contrapartes"
        element={
          renderProtected(<FinanceiroContrapartes />, [RoleName.FINANCEIRO, RoleName.ADMIN])
        }
      />
      <Route
        path="/financeiro/contratos"
        element={renderProtected(<FinanceiroContratos />, [RoleName.FINANCEIRO, RoleName.ADMIN])}
      />
      <Route
        path="/financeiro/mtm"
        element={renderProtected(<Navigate to="/financeiro/dashboard" replace />, [RoleName.FINANCEIRO, RoleName.ADMIN])}
      />
      <Route
        path="/financeiro/relatorios"
        element={
          renderProtected(<FinanceiroRelatorios />, [RoleName.FINANCEIRO, RoleName.ADMIN])
        }
      />
      <Route
        path="/financeiro/exposicao"
        element={renderProtected(<Navigate to="/financeiro/relatorios" replace />, [RoleName.FINANCEIRO, RoleName.ADMIN])}
      />

      <Route
        path="/compras/fornecedores"
        element={
          renderProtected(<ComprasFornecedores />, [RoleName.COMPRAS, RoleName.ADMIN])
        }
      />
      <Route
        path="/compras/pos"
        element={
          renderProtected(<ComprasPOs />, [RoleName.COMPRAS, RoleName.ADMIN])
        }
      />

      <Route
        path="/vendas/clientes"
        element={
          renderProtected(<VendasClientes />, [RoleName.VENDAS, RoleName.ADMIN])
        }
      />
      <Route
        path="/vendas/sos"
        element={
          renderProtected(<VendasSOs />, [RoleName.VENDAS, RoleName.ADMIN])
        }
      />

      <Route
        path="/estoque"
        element={
          renderProtected(
            <Estoque />,
            [RoleName.ESTOQUE, RoleName.FINANCEIRO, RoleName.COMPRAS, RoleName.VENDAS, RoleName.ADMIN]
          )
        }
      />

      <Route path="/" element={<Navigate to={defaultRouteByRole(user?.role?.name)} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
