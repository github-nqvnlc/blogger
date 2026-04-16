import { CategoryDetail } from "@/components/blogs/categories";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  return <CategoryDetail categoryId={categoryId} />;
}
