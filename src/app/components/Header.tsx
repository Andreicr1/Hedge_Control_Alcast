import React from "react";
import { Bell, ChevronDown, CircleHelp, LogOut, Newspaper, UserCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContextAPI';
import { OrderStatus } from '../../types/api';
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
    <header className="bg-card sticky top-0 z-10">
      {/* Figma HEADER: breadcrumb + ações */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                {sectionLabel && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <span className="text-[14px] font-normal text-foreground">
                          {sectionLabel}
                        </span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-muted-foreground">/</BreadcrumbSeparator>
                  </>
                )}
                  <BreadcrumbItem>
                  <BreadcrumbPage className="text-[14px] font-normal text-foreground">
                    {pageLabel ?? "—"}
                  </BreadcrumbPage>
                  </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            {isUsingMock && (
              <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">
                Modo Mock
              </span>
            )}

            <Button variant="ghost" size="icon" aria-label="News">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {/* No Figma há um indicador verde; mantemos contador quando existir */}
              {pendencias > 0 ? (
                <span className="absolute -top-1 -right-1 bg-success text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                  {pendencias}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success" />
              )}
            </Button>

            <Button variant="ghost" size="icon" aria-label="Ajuda">
              <CircleHelp className="h-4 w-4 text-muted-foreground" />
            </Button>

            <div className="hidden md:flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] text-foreground truncate max-w-[140px]">
                  {user?.name ?? "—"}
                </span>
                <span className="text-[9px] text-muted-foreground truncate max-w-[140px]">
                  {user?.email ?? (user?.role?.name ?? "—")}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="h-5 w-px bg-border hidden md:block" />

            <Button onClick={logout} variant="ghost" size="icon" aria-label="Sair">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Figma MENUBAR */}
      <div className={cn("px-6 py-3")}>
        <TopNav className="max-w-full" />
      </div>
    </header>
  );
};
