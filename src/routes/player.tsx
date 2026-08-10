import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { getVideoDetails } from "@/lib/api";
import {
  buildSources,
  downloadSource,
  pdfLinkOf,
  type MediaSource,
} from "@/lib/media";
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
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["video", courseId, videoId],
    queryFn: () => getVideoDetails(courseId, videoId),
    enabled: Boolean(courseId && videoId),
  });

  const sources = useMemo(() => buildSources(data), [data]);
  const pdf = useMemo(() => pdfLinkOf(data), [data]);

  useEffect(() => {
    if (!selected && sources.length) {
      // Default to 480p-ish for a fast, smooth start.
      const preferred =
        sources.find((s) => s.height === 480) ??
        sources.find((s) => s.height === 360) ??
        sources[0]!;
      setSelected(preferred.url);
    }
  }, [sources, selected]);

  const active: MediaSource | undefined =
    sources.find((s) => s.url === selected) ?? sources[0];

  const title = (data?.Title as string) ?? "Lecture";

  async function handleDownload() {
    if (!active || progress !== null) return;
    setDownloadError(null);
    setProgress(0);
    try {
      await downloadSource(active, title, setProgress);
    } catch {
      setDownloadError("Download fail hua. Doosri quality try karein.");
    } finally {
      setTimeout(() => setProgress(null), 1200);
    }
  }

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
                source={active}
                sources={sources}
                onSelectSource={(s) => setSelected(s.url)}
                poster={(data?.["thumbnail"] as string) || undefined}
              />
            </Suspense>
          </div>
        )}

        <h1 className="mt-6 font-display text-xl font-bold text-foreground">
          {title}
        </h1>

        {sources.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Quality
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {sources.map((s) => (
                <button
                  key={s.url}
                  onClick={() => setSelected(s.url)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    s.url === active?.url
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleDownload()}
            disabled={!active || progress !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-70"
          >
            {progress === null ? (
              <Download className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {progress === null
              ? `Download ${active?.label ?? ""}`.trim()
              : `Downloading ${progress}%`}
          </button>

          {pdf && (
            <a
              href={pdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <FileText className="h-4 w-4" /> Notes / PDF
            </a>
          )}
        </div>

        {progress !== null && (
          <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {downloadError && (
          <p className="mt-2 text-xs text-destructive">{downloadError}</p>
        )}
      </div>
    </AppShell>
  );
}
