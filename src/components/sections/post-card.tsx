/* eslint-disable @next/next/no-img-element */
import { FolderOpen, CalendarDays, Clock } from "lucide-react";
import PlaceholderImage from "@public/images/post-placeholder.png";
import { postImageUrl } from "@/helper/format-image";
import { Post } from "@/types/blogs";
import { formatDate } from "date-fns";

function estimateReadTime(content?: string): number {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, "");
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}

export function PostCard({
  post,
  categoryLabel,
  departmentCode,
}: {
  post: Post;
  categoryLabel?: string;
  departmentCode?: string;
}) {
  const readTime = estimateReadTime(post.content);
  return (
    <a
      href={`/${departmentCode}/${post.slug}`}
      className="group flex gap-3 rounded-2xl md:flex-col md:gap-0 md:rounded-3xl overflow-hidden border border-blue-100 bg-white p-2.5 md:p-0 hover:shadow-xl transition-all duration-300"
    >
      {/* Image with gradient + title overlay */}
      <div className="relative w-28 shrink-0 overflow-hidden rounded-xl md:w-auto md:rounded-2xl md:m-3 md:mb-0">
        <div className="aspect-square md:aspect-4/3 overflow-hidden rounded-xl md:rounded-2xl">
          <img
            src={postImageUrl(post.thumb)}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.currentTarget.src = PlaceholderImage.src;
            }}
          />
        </div>
        <div className="absolute inset-0 hidden rounded-xl bg-linear-to-t from-black/70 via-black/20 to-transparent md:block md:rounded-2xl" />
        <div className="absolute bottom-0 left-0 right-0 hidden p-4 md:block">
          <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 drop-shadow-md">
            {post.title}
          </h3>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 md:px-4 md:pt-3 md:pb-4">
        {categoryLabel && (
          <div className="hidden items-center max-w-full w-fit gap-1.5 border border-blue-200 rounded-full px-3 py-1 text-xs text-blue-700 font-medium md:flex">
            <FolderOpen className="size-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{categoryLabel}</span>
          </div>
        )}
        <p className="font-bold text-base md:text-lg text-gray-900 leading-snug line-clamp-2">
          {post.title}
        </p>
        {post.excerpt && (
          <p className="hidden text-sm text-gray-500 line-clamp-3 leading-relaxed md:block">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 md:mt-auto md:pt-2 text-xs text-gray-500">
          {post.published_at ? (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {formatDate(new Date(post.published_at), "d 'tháng' M, yyyy")}
              </span>
            </div>
          ) : (
            <span />
          )}
          <div className="hidden items-center gap-1.5 md:flex">
            <Clock className="size-3.5 text-gray-400 shrink-0" />
            <span>{readTime}p đọc</span>
          </div>
        </div>
      </div>
    </a>
  );
}
