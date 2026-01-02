import React from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { RoleName } from "../../types/api";
import { getEffectiveRole, getNavItemsByRole } from "../nav";
import { cn } from "./ui/utils";

type TopNavProps = {
  className?: string;
};

export function TopNav({ className }: TopNavProps) {
  const { user } = useAuth();
  const effectiveRole = getEffectiveRole(user?.role?.name as RoleName | undefined);

  if (!effectiveRole) return null;

  const items = getNavItemsByRole(effectiveRole);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <nav
        aria-label="Navegação principal"
        className="inline-flex min-w-max items-center justify-center gap-1 rounded-[var(--radius)] border border-border bg-card p-1"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "rounded-sm px-3 py-1.5 text-[14px] leading-[17px] font-normal transition-colors whitespace-nowrap",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
