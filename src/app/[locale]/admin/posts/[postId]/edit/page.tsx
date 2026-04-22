import { PostComposer } from "@/components/blogs/posts";

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  return <PostComposer mode="edit" postId={postId} />;
}
