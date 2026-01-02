import React from "react";
import { Bell, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContextAPI';
import { OrderStatus } from '../../types/api';
import logo from '../../assets/25708fe7a59949aebee89a264b778b057f612b74.png';
import { getNavLabelByPath, getSectionLabelByPath } from "../nav";
import { TopNav } from "./TopNav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

export const Header = () => {
  const { user, logout } = useAuth();
  const { purchaseOrders, salesOrders, isUsingMock } = useData();
  const location = useLocation();

  const pendencias =
    user?.role?.name === 'financeiro' || user?.role?.name === 'admin'
      ? purchaseOrders.filter((po) => [OrderStatus.DRAFT, OrderStatus.ACTIVE].includes(po.status)).length +
        salesOrders.filter((so) => [OrderStatus.DRAFT, OrderStatus.ACTIVE].includes(so.status)).length
      : 0;

  const sectionLabel = getSectionLabelByPath(location.pathname);
  const pageLabel = getNavLabelByPath(location.pathname, user?.role?.name);

  return (
    <header className="border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Alcast" className="h-8" />
          <span className="text-lg font-semibold tracking-tight">Hedge Control</span>
          {isUsingMock && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Modo Mock
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm text-muted-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role?.name || 'N/A'}</span>
              </div>

              {pendencias > 0 && (
                <Button variant="ghost" size="icon" className="relative" aria-label="Pendências">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                    {pendencias}
                  </span>
                </Button>
              )}

              <Button onClick={logout} variant="secondary" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {(sectionLabel || pageLabel) && (
        <div className="border-t border-border/70">
          <div className={cn("flex items-center gap-4 px-6 py-3")}>
            <Breadcrumb>
              <BreadcrumbList>
                {sectionLabel && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <span>{sectionLabel}</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  </>
                )}
                {pageLabel ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>—</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1">
              <TopNav className="max-w-full" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
