import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
        R
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight text-foreground">
          RWA
        </span>
        {!compact && (
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Powered by ApexLecture
          </span>
        )}
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/", label: "Batches" },
  { to: "/test-series", label: "Test Series" },
  { to: "/saved", label: "Saved" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Brand />
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-foreground">RWA</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Powered by ApexLecture
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Educational content library · All lectures stream from the original source.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  crumb,
}: {
  title: string;
  subtitle?: string;
  crumb?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {crumb && <div className="mb-3 text-xs text-muted-foreground">{crumb}</div>}
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-soft overflow-hidden">
          <div className="aspect-video animate-pulse bg-secondary" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card-soft px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
