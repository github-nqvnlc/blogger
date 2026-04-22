import { Badge } from "@/components/ui/badge";
import { Dictionary } from "@/i18n";
import { PostStatus } from "@/types/blogs";
import { formatPostStatusLabel } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

function StatusBadge({ status, t }: { status: PostStatus; t: Dictionary }) {
  const tone =
    status === "Published"
      ? "bg-green-500 text-white"
      : status === "Archived"
        ? "bg-slate-500 text-white"
        : "bg-amber-500 text-white";

  return (
    <Badge variant="secondary" className={cn(tone)}>
      {formatPostStatusLabel(status, t.blogPosts.status)}
    </Badge>
  );
}

export { StatusBadge };
