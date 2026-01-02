import {
  DollarSign,
  FileText,
  LayoutDashboard,
  Package,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

import { RoleName } from "../types/api";

export type AppNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export function getEffectiveRole(role?: RoleName): RoleName | undefined {
  if (!role) return undefined;
  return role === RoleName.ADMIN ? RoleName.FINANCEIRO : role;
}

export function getNavItemsByRole(role?: RoleName): AppNavItem[] {
  const effectiveRole = getEffectiveRole(role);
  if (!effectiveRole) return [];

  const estoqueItem: AppNavItem = {
    label: "Estoque",
    to: "/estoque",
    icon: Package,
  };

  if (effectiveRole === RoleName.FINANCEIRO) {
    return [
      {
        label: "Dashboard",
        to: "/financeiro/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "RFQs",
        to: "/financeiro/rfqs",
        icon: FileText,
      },
      {
        label: "Contratos",
        to: "/financeiro/contratos",
        icon: ScrollText,
      },
      {
        label: "Contrapartes",
        to: "/financeiro/contrapartes",
        icon: Users,
      },
      {
        label: "Relatórios",
        to: "/financeiro/relatorios",
        icon: DollarSign,
      },
      estoqueItem,
    ];
  }

  if (effectiveRole === RoleName.COMPRAS) {
    return [
      {
        label: "Purchase Orders",
        to: "/compras/pos",
        icon: FileText,
      },
      {
        label: "Fornecedores",
        to: "/compras/fornecedores",
        icon: Users,
      },
      estoqueItem,
    ];
  }

  if (effectiveRole === RoleName.VENDAS) {
    return [
      {
        label: "Sales Orders",
        to: "/vendas/sos",
        icon: FileText,
      },
      {
        label: "Clientes",
        to: "/vendas/clientes",
        icon: Users,
      },
      estoqueItem,
    ];
  }

  if (effectiveRole === RoleName.ESTOQUE) {
    return [estoqueItem];
  }

  return [];
}

export function getSectionLabelByPath(pathname: string): string | null {
  if (pathname.startsWith("/financeiro")) return "Financeiro";
  if (pathname.startsWith("/compras")) return "Compras";
  if (pathname.startsWith("/vendas")) return "Vendas";
  if (pathname.startsWith("/estoque")) return "Estoque";
  return null;
}

export function getNavLabelByPath(
  pathname: string,
  role?: RoleName,
): string | null {
  const items = getNavItemsByRole(role);
  const match = items.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  return match?.label ?? null;
}
