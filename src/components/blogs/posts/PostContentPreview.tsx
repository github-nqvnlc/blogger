"use client";

import { cn } from "@/lib/utils";
import { restoreEmbeddedMediaHtml } from "@/lib/blog-posts";

interface PostContentPreviewProps {
  value: string;
  emptyText: string;
  className?: string;
}

export function PostContentPreview({
  value,
  emptyText,
  className,
}: PostContentPreviewProps) {
  if (!value.trim()) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div
      className={cn(
        "prose prose-stone max-w-none dark:prose-invert prose-headings:tracking-tight prose-img:rounded-xl prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-pre:p-4 prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-4 prose-blockquote:italic [&_figure[data-blog-media]]:my-6 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_video]:w-full [&_video]:rounded-xl",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: restoreEmbeddedMediaHtml(value) }}
    />
  );
}
