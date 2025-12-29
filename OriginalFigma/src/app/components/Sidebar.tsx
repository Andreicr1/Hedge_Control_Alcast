import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Archive,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { RoleName } from "../../types/api";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: RoleName[];
}

const navItems: NavItem[] = [
  {
    label: "Inbox",
    to: "/financeiro/inbox",
    icon: <Archive className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.ADMIN],
  },
  {
    label: "RFQs",
    to: "/financeiro/rfqs",
    icon: <FileText className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.ADMIN],
  },
  {
    label: "Contrapartes",
    to: "/financeiro/contrapartes",
    icon: <Users className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.ADMIN],
  },
  {
    label: "MTM",
    to: "/financeiro/mtm",
    icon: <TrendingUp className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.ADMIN],
  },
  {
    label: "Relatórios",
    to: "/financeiro/relatorios",
    icon: <DollarSign className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.ADMIN],
  },

  {
    label: "Fornecedores",
    to: "/compras/fornecedores",
    icon: <Users className="w-5 h-5" />,
    roles: [RoleName.COMPRAS, RoleName.ADMIN],
  },
  {
    label: "Purchase Orders",
    to: "/compras/pos",
    icon: <FileText className="w-5 h-5" />,
    roles: [RoleName.COMPRAS, RoleName.ADMIN],
  },

  {
    label: "Clientes",
    to: "/vendas/clientes",
    icon: <Users className="w-5 h-5" />,
    roles: [RoleName.VENDAS, RoleName.ADMIN],
  },
  {
    label: "Sales Orders",
    to: "/vendas/sos",
    icon: <FileText className="w-5 h-5" />,
    roles: [RoleName.VENDAS, RoleName.ADMIN],
  },

  {
    label: "Estoque",
    to: "/estoque",
    icon: <Package className="w-5 h-5" />,
    roles: [RoleName.FINANCEIRO, RoleName.COMPRAS, RoleName.VENDAS, RoleName.ADMIN],
  },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const userRole = user.role?.name;
  const filteredItems = navItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b">
        {!isCollapsed && (
          <span className="text-sm text-muted-foreground"></span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-2 hover:bg-accent rounded-md px-[-9px] py-[8px]"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 hover:bg-accent rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              } ${isCollapsed ? "justify-center" : ""}`
            }
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg"
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
      <aside
        className={`hidden lg:block border-r bg-card transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 bg-card border-r w-64 transform transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};