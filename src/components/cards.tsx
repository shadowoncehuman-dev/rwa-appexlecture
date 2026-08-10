import { Link } from "@tanstack/react-router";
import type { Batch } from "@/lib/api";

export function BatchCard({ batch }: { batch: Batch }) {
  return (
    <Link
      to="/course/$courseId"
      params={{ courseId: batch.batch_id }}
      className="card-soft group overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="aspect-video overflow-hidden bg-secondary">
        <img
          src={batch.thumbnail}
          alt={batch.batch_name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="line-2 font-display text-base font-semibold text-foreground">
          {batch.batch_name}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
            Batch #{batch.batch_id}
          </span>
          <span className="text-sm font-semibold text-primary">Open →</span>
        </div>
      </div>
    </Link>
  );
}

export function TileCard({
  title,
  image,
  caption,
  to,
  params,
}: {
  title: string;
  image?: string | undefined;
  caption?: string | undefined;
  to: string;
  params: Record<string, string>;
}) {

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={params as any}

      className="card-soft group flex items-center gap-4 p-4 transition-colors hover:border-primary/40"
    >
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent">
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-lg font-bold text-accent-foreground">
            {title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-2 font-display text-sm font-semibold text-foreground">
          {title}
        </h3>
        {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
      </div>
      <span className="text-primary">→</span>
    </Link>
  );
}
