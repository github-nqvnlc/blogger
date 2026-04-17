import { TagDetail } from "@/components/blogs/tags";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  const { tagId } = await params;

  return <TagDetail tagId={tagId} />;
}
