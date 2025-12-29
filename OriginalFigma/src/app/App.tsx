import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContextAPI';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DebugPanel } from './components/DebugPanel';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Estoque } from './pages/Estoque';

// Financeiro
import { FinanceiroInbox } from './pages/financeiro/Inbox';
import { FinanceiroRFQs } from './pages/financeiro/RFQs';
import { NovoRFQ } from './pages/financeiro/NovoRFQ';
import { FinanceiroContrapartes } from './pages/financeiro/Contrapartes';
import { FinanceiroMTM } from './pages/financeiro/MTM';
import { FinanceiroRelatorios } from './pages/financeiro/Relatorios';

// Compras
import { ComprasFornecedores } from './pages/compras/Fornecedores';
import { ComprasPOs } from './pages/compras/POs';

// Vendas
import { VendasClientes } from './pages/vendas/Clientes';
import { VendasSOs } from './pages/vendas/SOs';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route
        path="/financeiro/inbox"
        element={
          <PrivateRoute>
            <AppLayout>
              <FinanceiroInbox />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro/rfqs"
        element={
          <PrivateRoute>
            <AppLayout>
              <FinanceiroRFQs />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro/novorfq"
        element={
          <PrivateRoute>
            <AppLayout>
              <NovoRFQ />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro/contrapartes"
        element={
          <PrivateRoute>
            <AppLayout>
              <FinanceiroContrapartes />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro/mtm"
        element={
          <PrivateRoute>
            <AppLayout>
              <FinanceiroMTM />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro/relatorios"
        element={
          <PrivateRoute>
            <AppLayout>
              <FinanceiroRelatorios />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/compras/fornecedores"
        element={
          <PrivateRoute>
            <AppLayout>
              <ComprasFornecedores />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/compras/pos"
        element={
          <PrivateRoute>
            <AppLayout>
              <ComprasPOs />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/vendas/clientes"
        element={
          <PrivateRoute>
            <AppLayout>
              <VendasClientes />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/vendas/sos"
        element={
          <PrivateRoute>
            <AppLayout>
              <VendasSOs />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/estoque"
        element={
          <PrivateRoute>
            <AppLayout>
              <Estoque />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
          <DebugPanel />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}