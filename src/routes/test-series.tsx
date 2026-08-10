import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAllTestSeries, type TestSeries as TS } from "@/lib/api";
import { AppShell, EmptyState, PageHeader, SkeletonGrid } from "@/components/layout";

export const Route = createFileRoute("/test-series")({
  head: () => ({
    meta: [
      { title: "Test Series — Practice Papers | RWA" },
      {
        name: "description",
        content:
          "Browse every available test series and practice paper on RWA. Powered by ApexLecture.",
      },
      { property: "og:title", content: "Test Series | RWA" },
      {
        property: "og:description",
        content: "All practice test series in one place.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/test-series" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/test-series" }],
  }),
  component: TestSeriesPage,
});

function title(t: TS) {
  return (
    (t.title as string) || (t.name as string) || (t.test_series_name as string) || "Test series"
  );
}

function TestSeriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-tests"],
    queryFn: getAllTestSeries,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <AppShell>
      <PageHeader
        title="Test Series"
        subtitle="Practice papers aur mock tests ka poora collection."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : !data?.length ? (
          <EmptyState message="Abhi koi test series available nahi hai." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t, i) => (
              <div key={(t.id as string) ?? i} className="card-soft overflow-hidden">
                {t.thumbnail && (
                  <img
                    src={t.thumbnail as string}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h2 className="line-2 font-display text-sm font-semibold text-foreground">
                    {title(t)}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">Test series</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
