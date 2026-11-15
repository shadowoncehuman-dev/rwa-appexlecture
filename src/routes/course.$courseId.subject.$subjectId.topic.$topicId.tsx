import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLectures, getTopics } from "@/lib/api";
import { AppShell, EmptyState, LoadError, PageHeader } from "@/components/layout";

export const Route = createFileRoute(
  "/course/$courseId/subject/$subjectId/topic/$topicId",
)({
  head: ({ params }) => ({
    meta: [
      { title: `Lectures — Topic ${params.topicId} | RWA` },
      {
        name: "description",
        content: "Watch every lecture in this topic on RWA. Powered by ApexLecture.",
      },
      { property: "og:title", content: "Topic lectures | RWA" },
      {
        property: "og:description",
        content: "Full lecture list with instant streaming playback.",
      },
      { property: "og:type", content: "article" },
      {
        property: "og:url",
        content: `/course/${params.courseId}/subject/${params.subjectId}/topic/${params.topicId}`,
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: `/course/${params.courseId}/subject/${params.subjectId}/topic/${params.topicId}`,
      },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { courseId, subjectId, topicId } = Route.useParams();

  const topics = useQuery({
    queryKey: ["topics", courseId, subjectId],
    queryFn: () => getTopics(courseId, subjectId),
  });
  const topic = topics.data?.find((t) => t.topicid === topicId);

  const lectures = useQuery({
    queryKey: ["lectures", courseId, subjectId, topicId],
    queryFn: () => getLectures(courseId, subjectId, topicId),
  });

  return (
    <AppShell>
      <PageHeader
        title={topic?.topic_name ?? "Lectures"}
        subtitle={`${lectures.data?.length ?? 0} lectures in this topic`}
        crumb={
          <Link
            to="/course/$courseId/subject/$subjectId"
            params={{ courseId, subjectId }}
            className="hover:text-foreground"
          >
            ← Back to topics
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {lectures.isLoading ? (
          <EmptyState message="Lectures load ho rahe hain…" />
        ) : lectures.isError ? (
          <LoadError
            message="Lectures load nahi ho paaye. Content server se response nahi mila."
            onRetry={() => void lectures.refetch()}
          />
        ) : !lectures.data?.length ? (
          <EmptyState message="Is topic me koi lecture nahi mila." />
        ) : (
          <ul className="space-y-3">
            {lectures.data.map((lec, i) => (
              <li key={lec.id}>
                <Link
                  to="/player"
                  search={{ courseId, videoId: lec.id }}
                  className="card-soft group flex items-center gap-4 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-2 text-sm font-semibold text-foreground">
                      {lec.Title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {(lec.material_type as string) || "VIDEO"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                    ▶ Play
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
