/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Pencil } from "lucide-react";
import { formatDate } from "date-fns";
import { useGetList } from "@/hooks";
import { Post, PostTag } from "@/types/blogs";
import PlaceholderImage from "@public/images/post-placeholder.png";
import { postImageUrl } from "@/helper/format-image";
import { injectHeadingIds, TableOfContents } from "@/app/[locale]/blog/[slug]/_toc";
import { useCategoryMap, useTagMap } from "@/hooks/useGuestMetadata";
import { unbounded } from "@/lib/font";
import { PostCard } from "@/components/sections/post-cart";
import Support from "@/components/sections/support";

export default function BlogDetailPage() {
  const params = useParams();
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
    if (!post?.category) return "";
    if (typeof post.category !== "string") return post.category.category;
    return categoryMap[post.category as string] ?? post.category;
  }, [post, categoryMap]);

  if (postLoading) {
    return (
      <section className="mt-16 md:mt-30">
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
      <section className="mt-16 md:mt-30">
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
    <section id="blog-detail" className="mt-14 lg:mt-24">
      <div className="inner relative aspect-video w-full md:aspect-auto md:h-96 overflow-hidden rounded-none md:rounded-4xl">
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
        <div className="relative py-16 text-center text-white md:py-24">
          <div className="inner">
            <h1 className="mx-auto mb-6 max-w-xs text-2xl leading-tight font-bold md:max-w-3xl md:text-3xl lg:text-4xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300">
              {categoryLabel && (
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-5" />
                  <span className="text-sm md:text-md">{categoryLabel}</span>
                </div>
              )}
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <Pencil className="size-5" />
                  <span className="text-sm md:text-md">
                    {formatDate(new Date(post.published_at), "HH:mm - dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="l-section-content">
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
              className={`${unbounded.className} mb-16 text-center bg-linear-to-r from-orange-accent-dark to-orange-amber bg-clip-text text-3xl font-medium tracking-tight text-transparent md:text-4xl`}
            >
              Bài viết liên quan
            </h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map(p => {
                const relCatLabel =
                  typeof p.category === "string"
                    ? (categoryMap[p.category] ?? p.category)
                    : ((p.category as { category: string })?.category ?? "");
                return <PostCard key={p.name} post={p} categoryLabel={relCatLabel} />;
              })}
            </div>
          </div>
        </div>
      )}

      <Support />
    </section>
  );
}
