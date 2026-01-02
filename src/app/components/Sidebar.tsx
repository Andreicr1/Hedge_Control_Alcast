import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleName } from '../../types/api';
import logo from '../../assets/25708fe7a59949aebee89a264b778b057f612b74.png';

import { getEffectiveRole, getNavItemsByRole } from '../nav';
import { cn } from './ui/utils';

export const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);

  if (!user) return null;

  const userRole = (user.role?.name as string | undefined)?.toLowerCase() as
    | RoleName
    | undefined;
  const effectiveRole = getEffectiveRole(userRole);
  const filteredItems = getNavItemsByRole(effectiveRole);

  const iconAccentByPath: Record<string, string> = {
    '/financeiro/dashboard': 'text-purple',
    '/financeiro/rfqs': 'text-teal',
    '/financeiro/contratos': 'text-highlight',
    '/financeiro/contrapartes': 'text-pink',
    '/financeiro/relatorios': 'text-success',
    '/compras/pos': 'text-purple',
    '/compras/fornecedores': 'text-teal',
    '/vendas/sos': 'text-purple',
    '/vendas/clientes': 'text-pink',
    '/estoque': 'text-highlight',
  };

  const getIconAccentClass = (to: string) =>
    iconAccentByPath[to] ?? 'text-muted-foreground';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-2.5 border-b border-border">
        <div className="flex items-center justify-start">
          <img
            src={logo}
            alt="Alcast"
            className={cn("h-[41px] w-[36px] object-contain", isCollapsed ? "" : "mr-2")}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium text-foreground truncate">
              Alcast
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(v => !v)}
          className="mt-2 hidden lg:flex w-full items-center justify-center h-9 rounded-[var(--radius)] hover:bg-accent transition-colors"
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden mt-2 w-full inline-flex h-8 items-center justify-center rounded-[var(--radius)] hover:bg-accent transition-colors"
          aria-label="Fechar menu"
          title="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center h-9 rounded-[var(--radius)] transition-colors',
                  isCollapsed ? 'justify-center px-3' : 'gap-3 px-3',
                  isActive
                      ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center transition-colors',
                      isActive ? 'text-primary-foreground' : getIconAccentClass(item.to)
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Open Button (when hidden) */}
      {isDesktopHidden && (
        <button
          type="button"
          onClick={() => setIsDesktopHidden(false)}
          className="hidden lg:inline-flex fixed left-4 top-24 z-50 h-10 w-10 items-center justify-center rounded-lg border border-border bg-card shadow-sm"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg"
        aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
        title={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {!isDesktopHidden ? (
        <aside
          className={cn(
            'hidden lg:block sidebar-container transition-all duration-300',
            isCollapsed ? 'w-14' : 'w-60'
          )}
        >
          <SidebarContent />
        </aside>
      ) : null}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 z-50 sidebar-container border-r border-border w-64 transform transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};
