import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { getVideoDetails } from "@/lib/api";
import { decryptLink } from "@/lib/vault";
import { AppShell, EmptyState } from "@/components/layout";

const VideoPlayer = lazy(() =>
  import("@/components/video-player").then((m) => ({ default: m.VideoPlayer })),
);

type PlayerSearch = { courseId: string; videoId: string };

export const Route = createFileRoute("/player")({
  validateSearch: (search: Record<string, unknown>): PlayerSearch => ({
    courseId: String(search["courseId"] ?? ""),
    videoId: String(search["videoId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Lecture Player | RWA" },
      {
        name: "description",
        content: "Stream RWA lectures with adaptive quality playback and notes.",
      },
      { property: "og:title", content: "Lecture Player | RWA" },
      {
        property: "og:description",
        content: "Watch lectures with quality options and downloadable notes.",
      },
      { property: "og:type", content: "video.other" },
      { property: "og:url", content: "/player" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/player" }],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { courseId, videoId } = Route.useSearch();
  const [quality, setQuality] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["video", courseId, videoId],
    queryFn: () => getVideoDetails(courseId, videoId),
    enabled: Boolean(courseId && videoId),
  });

  const sources = useMemo(() => {
    if (!data) return [] as { label: string; url: string }[];
    const list: { label: string; url: string }[] = [];
    for (const link of data.livestream_links ?? []) {
      const url = decryptLink(link.path);
      if (url) list.push({ label: link.quality || "Stream", url });
    }
    for (const link of data.encrypted_links ?? []) {
      const url = decryptLink(link.path, link.key);
      if (url) list.push({ label: link.quality || "Stream", url });
    }
    const file = decryptLink(data.file_link);
    if (file) list.push({ label: "Original", url: file });
    return list.filter(
      (item, i, arr) => arr.findIndex((x) => x.url === item.url) === i,
    );
  }, [data]);

  const pdf = useMemo(() => decryptLink(data?.pdf_link), [data]);
  const active = sources[quality] ?? sources[0];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to batch
        </Link>

        {isLoading ? (
          <div className="mt-4 aspect-video w-full animate-pulse rounded-xl bg-secondary" />
        ) : !active ? (
          <div className="mt-4">
            <EmptyState message="Is lecture ka playable link nahi mila." />
          </div>
        ) : (
          <div className="mt-4">
            <Suspense
              fallback={
                <div className="aspect-video w-full animate-pulse rounded-xl bg-secondary" />
              }
            >
              <VideoPlayer
                key={active.url}
                src={active.url}
                poster={(data?.["thumbnail"] as string) || undefined}
              />
            </Suspense>
          </div>
        )}

        <h1 className="mt-6 font-display text-xl font-bold text-foreground">
          {(data?.Title as string) ?? "Lecture"}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {sources.map((s, i) => (
            <button
              key={s.url}
              onClick={() => setQuality(i)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                i === quality
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
          {pdf && (
            <a
              href={pdf}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              ⬇ Notes / PDF
            </a>
          )}
        </div>
      </div>
    </AppShell>
  );
}
