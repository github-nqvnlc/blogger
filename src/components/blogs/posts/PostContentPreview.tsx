"use client";

import { RichContent } from "@/components/blogs/editor/rich-content";

interface PostContentPreviewProps {
  value: string;
  emptyText: string;
  className?: string;
}

export function PostContentPreview({ value, emptyText, className }: PostContentPreviewProps) {
  return <RichContent value={value} emptyText={emptyText} className={className} />;
}
