import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getBatches } from "@/lib/api";
import { AppShell, EmptyState, SkeletonGrid } from "@/components/layout";
import { BatchCard } from "@/components/cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RWA — Free Batches, Lectures & Test Series" },
      {
        name: "description",
        content:
          "RWA gives you every batch, subject, lecture and test series in one clean library. Powered by ApexLecture.",
      },
      { property: "og:title", content: "RWA — Free Batches, Lectures & Test Series" },
      {
        property: "og:description",
        content: "Browse batches, stream lectures and practice test series on RWA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const PAGE = 24;

function Index() {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["batches"],
    queryFn: getBatches,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.batch_name?.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <AppShell>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Powered by ApexLecture
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] text-foreground sm:text-6xl">
            Every batch. Every lecture.
            <span className="block text-primary">One clean library.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Browse {data?.length ?? "hundreds of"} batches, open subjects and topics, and
            stream lectures instantly — no login, no clutter.
          </p>

          <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE);
              }}
              placeholder="Search batches…"
              aria-label="Search batches"
              className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <Link
              to="/test-series"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Test Series
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">All Batches</h2>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {filtered.length} results
            </span>
          )}
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <EmptyState message="Batches load nahi ho paaye. Thodi der baad try karein." />
        ) : filtered.length === 0 ? (
          <EmptyState message="Is search se koi batch match nahi hua." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visible).map((batch) => (
                <BatchCard key={batch.batch_id} batch={batch} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE)}
                  className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
