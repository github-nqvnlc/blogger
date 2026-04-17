import { TopicDetail } from "@/components/blogs/topics";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  return <TopicDetail topicId={topicId} />;
}
