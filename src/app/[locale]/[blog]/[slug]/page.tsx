/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Pencil } from "lucide-react";
import { formatDate } from "date-fns";
import { useGetList } from "@/hooks";
import { Post, PostTag } from "@/types/blogs";
import PlaceholderImage from "@public/images/post-placeholder.png";
import { postImageUrl } from "@/helper/format-image";
import { injectHeadingIds, TableOfContents } from "@/app/[locale]/[blog]/[slug]/_toc";
import { useCategoryMap, useTagMap } from "@/hooks/useGuestMetadata";
import { unbounded } from "@/lib/font";
import { PostCard } from "@/components/sections/post-card";
import Support from "@/components/sections/support";

function getPostCategoryLabel(
  category: Post["category"] | undefined,
  categoryMap: Record<string, string>
) {
  if (!category) return "";
  if (typeof category !== "string")
    return category.category ?? categoryMap[category.name] ?? category.name;
  return categoryMap[category] ?? category;
}

export default function BlogDetailPage() {
  const params = useParams();
  const blogCode = params?.blog as string;
  const slug = params?.slug as string;

  const { data: posts, isLoading: postLoading } = useGetList<Post>("posts", {
    fields: ["*"],
    filters: [["slug", "=", slug]],
    limit: 1,
  });
  const post = posts?.[0];

  const { data: postTags } = useGetList<PostTag>(
    "post_tags",
    {
      fields: ["tag"],
      filters: post?.name ? [["post", "=", post.name]] : [["post", "=", "__none__"]],
      limit: 100,
    },
    { enabled: !!post?.name }
  );

  const categoryId = typeof post?.category === "string" ? post.category : post?.category?.name;
  const { data: relatedPosts } = useGetList<Post>(
    "posts",
    {
      fields: ["*"],
      filters:
        categoryId && post?.name
          ? [
              ["category", "=", categoryId],
              ["name", "!=", post.name],
              ["status", "=", "Published"],
            ]
          : [["name", "=", "__none__"]],
      limit: 3,
    },
    { enabled: !!categoryId && !!post?.name }
  );

  const tagMap = useTagMap();
  const categoryMap = useCategoryMap();

  const categoryLabel = React.useMemo(() => {
    return getPostCategoryLabel(post?.category, categoryMap);
  }, [post, categoryMap]);

  if (postLoading) {
    return (
      <section>
        <div className="inner animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-3xl" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="l-section">
        <div className="inner text-center py-32">
          <h1 className="text-3xl font-bold text-foreground-variant">Không tìm thấy bài viết</h1>
          <p className="mt-4 text-foreground-variant">
            Bài viết bạn tìm không tồn tại hoặc đã bị xoá.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="blog-detail" className="pt-14 md:pt-0 pb-16 md:pb-24">
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={postImageUrl(post.thumb)}
            alt={post.title}
            className="h-full w-full object-cover"
            onError={e => {
              e.currentTarget.src = PlaceholderImage.src;
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-800 via-gray-800/50 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0  py-8 md:py-60 text-center text-white">
          <div className="inner">
            <div className="flex md:gap-3 gap-1 items-center bg-white/80 mx-auto backdrop-blur-md px-2 py-1 md:px-6 md:py-2 rounded-full w-fit">
              <span className="text-xs md:text-base text-blue-midnight">{categoryLabel}</span>
            </div>
            <h1 className="mt-3 mx-auto max-w-xs text-xl leading-tight font-bold md:max-w-3xl md:text-3xl lg:text-4xl line-clamp-2">
              {post.title}
            </h1>
            <span className="mt-5 text-sm md:text-base hidden max-w-2xl mx-auto md:line-clamp-2">
              {post.excerpt}
            </span>
            <div className="mt-2 md:mt-4 flex justify-center text-gray-300">
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <Pencil className="size-3 md:size-5" />
                  <span className="text-xs md:text-base">
                    {formatDate(new Date(post.published_at), "HH:mm - dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 py-8 flex-col items-center gap-1 text-white hidden md:flex">
          <button
            type="button"
            onClick={() =>
              document.getElementById("blog-content")?.scrollIntoView({ behavior: "smooth" })
            }
            className="group flex flex-col items-center gap-1 cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200 focus:outline-none active:scale-95"
            aria-label="Cuộn xuống nội dung"
          >
            <span className="text-xs md:text-sm font-medium tracking-widest uppercase">
              Cuộn xuống
            </span>
            <ChevronDown className="animate-bounce mt-0.5" />
          </button>
        </div>
      </div>

      <div id="blog-content" className="l-section-content">
        <div className="inner">
          <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-10">
            <div className="w-full lg:w-4/12 lg:shrink-0">
              <aside className="bg-blue-ice rounded-3xl p-6 lg:sticky lg:top-32 lg:p-8">
                <h2 className="mb-4 text-orange-accent-dark text-xl font-bold">Mục lục</h2>
                <TableOfContents html={injectHeadingIds(post.content ?? "")} />
              </aside>
            </div>

            <div className="w-full lg:w-8/12">
              {post.excerpt && (
                <div className="mb-5 text-lg font-semibold text-gray-600">{post.excerpt}</div>
              )}
              <div
                className="prose lg:prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: injectHeadingIds(post.content ?? "") }}
              />
              {postTags && postTags.length > 0 && (
                <div className="my-6 flex flex-wrap items-center justify-start gap-3">
                  {postTags.map(pt => (
                    <div
                      key={pt.tag}
                      className="bg-surface-container flex items-center gap-1 rounded-full px-4 py-1 text-sm font-medium"
                    >
                      <span># {tagMap[pt.tag] ?? pt.tag}</span>
                    </div>
                  ))}
                </div>
              )}

              <hr className="mt-6 border-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {relatedPosts && relatedPosts.length > 0 && (
        <div className="l-section-content">
          <div className="inner">
            <h2
              className={`${unbounded.className} mb-8 md:mb-16 text-center bg-linear-to-r from-orange-accent-dark to-orange-amber bg-clip-text text-xl md:text-3xl font-medium tracking-tight text-transparent md:text-4xl`}
            >
              Bài viết liên quan
            </h2>
            <div className="grid grid-cols-1 gap-4 md:gap-12 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map(p => {
                const relCatLabel = getPostCategoryLabel(p.category, categoryMap);
                return (
                  <PostCard
                    key={p.name}
                    post={p}
                    categoryLabel={relCatLabel}
                    departmentCode={blogCode}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Support />
    </section>
  );
}
