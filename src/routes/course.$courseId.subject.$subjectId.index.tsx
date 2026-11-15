import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSubjects, getTopics } from "@/lib/api";
import { AppShell, EmptyState, LoadError, PageHeader } from "@/components/layout";
import { TileCard } from "@/components/cards";

export const Route = createFileRoute("/course/$courseId/subject/$subjectId/")({
  head: ({ params }) => ({
    meta: [
      { title: `Subject topics — Batch ${params.courseId} | RWA` },
      {
        name: "description",
        content: "Topic-wise lecture list for this subject on RWA, powered by ApexLecture.",
      },
      { property: "og:title", content: `Subject topics | RWA` },
      {
        property: "og:description",
        content: "Pick a topic to see all its lectures and notes.",
      },
      { property: "og:type", content: "article" },
      {
        property: "og:url",
        content: `/course/${params.courseId}/subject/${params.subjectId}`,
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: `/course/${params.courseId}/subject/${params.subjectId}`,
      },
    ],
  }),
  component: SubjectPage,
});

function SubjectPage() {
  const { courseId, subjectId } = Route.useParams();

  const subjects = useQuery({
    queryKey: ["subjects", courseId],
    queryFn: () => getSubjects(courseId),
  });
  const subject = subjects.data?.find((s) => s.subjectid === subjectId);

  const topics = useQuery({
    queryKey: ["topics", courseId, subjectId],
    queryFn: () => getTopics(courseId, subjectId),
  });

  return (
    <AppShell>
      <PageHeader
        title={subject?.subject_name ?? "Topics"}
        subtitle="Topic select karke lectures dekhein."
        crumb={
          <Link
            to="/course/$courseId"
            params={{ courseId }}
            className="hover:text-foreground"
          >
            ← Back to batch
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {topics.isLoading ? (
          <EmptyState message="Topics load ho rahe hain…" />
        ) : topics.isError ? (
          <LoadError
            message="Topics load nahi ho paaye. Content server se response nahi mila."
            onRetry={() => void topics.refetch()}
          />
        ) : !topics.data?.length ? (
          <EmptyState message="Is subject me koi topic nahi mila." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.data.map((t) => (
              <TileCard
                key={t.topicid}
                title={t.topic_name}
                image={t.topic_logo || undefined}
                caption="View lectures"
                to="/course/$courseId/subject/$subjectId/topic/$topicId"
                params={{ courseId, subjectId, topicId: t.topicid }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
