import * as React from "react";

import { cn } from "./utils";
import { Button } from "./button";

export function FigmaSurface({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-card border border-border rounded-[6px]", className)}
      {...props}
    />
  );
}

type FigmaButtonTone = "primary" | "neutral" | "outline" | "ghost";

export function FigmaButton({
  tone = "outline",
  className,
  ...props
}: React.ComponentProps<typeof Button> & { tone?: FigmaButtonTone }) {
  const variant =
    tone === "ghost" ? "ghost" : tone === "outline" ? "outline" : "default";

  return (
    <Button
      variant={variant}
      className={cn(
        "h-8 rounded-[6px] px-4 text-[12px] font-normal",
        tone === "primary" &&
          "bg-[var(--ui-primary,#4caf50)] text-white hover:bg-[var(--ui-primary,#4caf50)]/90",
        tone === "neutral" &&
          "bg-[var(--ui-neutral,#6592b7)] text-white hover:bg-[var(--ui-neutral,#6592b7)]/90",
        className,
      )}
      {...props}
    />
  );
}

export type FigmaTabItem = {
  value: string;
  label: React.ReactNode;
};

export function FigmaTabs({
  items,
  value,
  onValueChange,
  className,
}: {
  items: FigmaTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-1", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              "h-9 px-4 text-[14px] leading-none rounded-t-[6px] border border-transparent",
              active
                ? "bg-card border-border border-b-0 text-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
