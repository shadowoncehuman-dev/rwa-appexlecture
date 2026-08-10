import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSaved, type SavedBatch } from "@/lib/saved";
import { AppShell, EmptyState, PageHeader } from "@/components/layout";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Batches | RWA" },
      {
        name: "description",
        content: "Your bookmarked RWA batches, saved on this device for quick access.",
      },
      { property: "og:title", content: "Saved Batches | RWA" },
      {
        property: "og:description",
        content: "Quick access to the batches you bookmarked on RWA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/saved" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/saved" }],
  }),
  component: SavedPage,
});

function SavedPage() {
  const [items, setItems] = useState<SavedBatch[]>([]);

  useEffect(() => {
    const sync = () => setItems(getSaved());
    sync();
    window.addEventListener("rwa-saved-changed", sync);
    return () => window.removeEventListener("rwa-saved-changed", sync);
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Saved Batches"
        subtitle="Ye list sirf is device par save hoti hai."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {items.length === 0 ? (
          <EmptyState message="Abhi koi batch save nahi kiya gaya hai." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <Link
                key={b.batch_id}
                to="/course/$courseId"
                params={{ courseId: b.batch_id }}
                className="card-soft overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                <img
                  src={b.thumbnail}
                  alt={b.batch_name}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <div className="p-4">
                  <h2 className="line-2 font-display text-sm font-semibold text-foreground">
                    {b.batch_name}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
