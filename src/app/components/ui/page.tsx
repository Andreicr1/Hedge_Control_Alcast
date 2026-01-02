import * as React from "react";

import { cn } from "./utils";

function Page({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 space-y-6", className)} {...props} />;
}

function PageHeader({
  className,
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  className?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-normal tracking-tight leading-[29px] truncate">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({
  className,
  title,
  description,
  action,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn("bg-card border rounded-lg p-4", className)}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-medium">{title}</h2> : null}
            {description ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export { Page, PageHeader, SectionCard };
