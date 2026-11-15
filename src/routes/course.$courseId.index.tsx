import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBatches,
  getCourseTestSeries,
  getSubjects,
  type TestSeries,
} from "@/lib/api";
import { AppShell, EmptyState, LoadError, PageHeader } from "@/components/layout";
import { TileCard } from "@/components/cards";
import { isSaved, toggleSaved } from "@/lib/saved";

export const Route = createFileRoute("/course/$courseId/")({
  head: ({ params }) => ({
    meta: [
      { title: `Batch ${params.courseId} — Subjects & Lectures | RWA` },
      {
        name: "description",
        content:
          "Open subjects, topics and lectures for this batch on RWA. Powered by ApexLecture.",
      },
      { property: "og:title", content: `Batch ${params.courseId} | RWA` },
      {
        property: "og:description",
        content: "Subjects, topics and streaming lectures for this batch.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/course/${params.courseId}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/course/${params.courseId}` }],
  }),
  component: CoursePage,
});

function testTitle(t: TestSeries) {
  return (
    (t.title as string) ||
    (t.name as string) ||
    (t.test_series_name as string) ||
    "Test"
  );
}

function CoursePage() {
  const { courseId } = Route.useParams();
  const [tab, setTab] = useState<"subjects" | "tests">("subjects");
  const [saved, setSaved] = useState(false);

  const batches = useQuery({
    queryKey: ["batches"],
    queryFn: getBatches,
    staleTime: 5 * 60 * 1000,
  });
  const batch = batches.data?.find((b) => b.batch_id === courseId);

  const subjects = useQuery({
    queryKey: ["subjects", courseId],
    queryFn: () => getSubjects(courseId),
  });

  const tests = useQuery({
    queryKey: ["course-tests", courseId],
    queryFn: () => getCourseTestSeries(courseId),
    enabled: tab === "tests",
  });

  useEffect(() => {
    setSaved(isSaved(courseId));
  }, [courseId]);

  return (
    <AppShell>
      <PageHeader
        title={batch?.batch_name ?? `Batch ${courseId}`}
        subtitle="Subject choose karein, phir topic aur lectures."
        crumb={
          <Link to="/" className="hover:text-foreground">
            ← All batches
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {batch && (
          <div className="card-soft mb-8 flex flex-col gap-5 overflow-hidden p-5 sm:flex-row">
            <img
              src={batch.thumbnail}
              alt={batch.batch_name}
              className="h-40 w-full rounded-xl object-cover sm:w-64"
            />
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {batch.batch_name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {subjects.data?.length ?? "—"} subjects available
                </p>
              </div>
              <button
                onClick={() =>
                  setSaved(
                    toggleSaved({
                      batch_id: batch.batch_id,
                      batch_name: batch.batch_name,
                      thumbnail: batch.thumbnail,
                    }),
                  )
                }
                className="w-fit rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {saved ? "★ Saved" : "☆ Save batch"}
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
          {(["subjects", "tests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "subjects" ? "Subjects" : "Test Series"}
            </button>
          ))}
        </div>

        {tab === "subjects" ? (
          subjects.isLoading ? (
            <EmptyState message="Subjects load ho rahe hain…" />
          ) : subjects.isError ? (
            <LoadError
              message="Batch ke subjects load nahi ho paaye. Content server se response nahi mila."
              onRetry={() => void subjects.refetch()}
            />
          ) : !subjects.data?.length ? (
            <EmptyState message="Is batch me koi subject nahi mila." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.data.map((s) => (
                <TileCard
                  key={s.subjectid}
                  title={s.subject_name}
                  image={s.subject_logo}
                  caption="View topics"
                  to="/course/$courseId/subject/$subjectId"
                  params={{ courseId, subjectId: s.subjectid }}
                />
              ))}
            </div>
          )
        ) : tests.isLoading ? (
          <EmptyState message="Test series load ho rahi hai…" />
        ) : !tests.data?.length ? (
          <EmptyState message="Is batch ke liye koi test series nahi mili." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.data.map((t, i) => (
              <div key={(t.id as string) ?? i} className="card-soft p-4">
                <h3 className="line-2 font-display text-sm font-semibold text-foreground">
                  {testTitle(t)}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">Test series</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
