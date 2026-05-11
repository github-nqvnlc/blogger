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

export function PostCard({ post, categoryLabel }: { post: Post; categoryLabel?: string }) {
  const readTime = estimateReadTime(post.content);
  return (
    <a
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-3xl overflow-hidden border border-blue-100 bg-white hover:shadow-xl transition-all duration-300"
    >
      {/* Image with gradient + title overlay */}
      <div className="relative overflow-hidden rounded-2xl m-3 mb-0">
        <div className="aspect-4/3 overflow-hidden rounded-2xl">
          <img
            src={postImageUrl(post.thumb)}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.currentTarget.src = PlaceholderImage.src;
            }}
          />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 drop-shadow-md">
            {post.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2">
        {categoryLabel && (
          <div className="flex items-center w-fit gap-1.5 border border-blue-200 rounded-full px-3 py-1 text-xs text-blue-700 font-medium">
            <FolderOpen className="size-3.5 text-blue-500 shrink-0" />
            <span>{categoryLabel}</span>
          </div>
        )}
        <p className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{post.title}</p>
        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 text-xs text-gray-500">
          {post.published_at ? (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-gray-400 shrink-0" />
              <span>{formatDate(new Date(post.published_at), "d 'tháng' M, yyyy")}</span>
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-gray-400 shrink-0" />
            <span>{readTime}p đọc</span>
          </div>
        </div>
      </div>
    </a>
  );
}
