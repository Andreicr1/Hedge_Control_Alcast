import React from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContextAPI';
import { OrderStatus } from '../../types/api';
import logo from 'figma:asset/25708fe7a59949aebee89a264b778b057f612b74.png';

export const Header = () => {
  const { user, logout } = useAuth();
  const { purchaseOrders, salesOrders, isUsingMock } = useData();

  // Contar pendências (POs e SOs com status submitted aguardando hedge)
  const pendencias = user?.role?.name === 'financeiro' || user?.role?.name === 'admin'
    ? purchaseOrders.filter(po => po.status === OrderStatus.SUBMITTED).length +
      salesOrders.filter(so => so.status === OrderStatus.SUBMITTED).length
    : 0;

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Alcast" className="h-8" />
          <span className="text-lg font-semibold text-sky-900">Hedge Control</span>
          {isUsingMock && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Modo Mock
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm text-muted-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role?.name || 'N/A'}</span>
              </div>

              {pendencias > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendencias}
                  </span>
                </div>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};