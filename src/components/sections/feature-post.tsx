/* eslint-disable @next/next/no-img-element */
import React from "react";
import { useGetList } from "@/hooks";
import { Post, PostTag } from "@/types/blogs";
import { ArrowRight, Newspaper, PenIcon } from "lucide-react";
import { unbounded } from "@/lib/font";
import PlaceholderImage from "@public/images/post-placeholder.png";
import { getBaseUrl } from "@/lib/utils";
import { formatDate } from "date-fns";
import { useTagMap } from "@/hooks/useGuestMetadata";

const FeaturePost = ({
  title,
  odd = false,
  department_name,
  department_code,
}: {
  title: string;
  odd?: boolean;
  department_name?: string;
  department_code: string;
}) => {
  const { data: posts } = useGetList<Post>("posts", {
    fields: ["*"],
    filters: [
      ["department", "=", department_name],
      ["status", "=", "Published"],
    ],
    limit: 4,
  });

  const { data: featuredPostTags } = useGetList<PostTag>(
    "post_tags",
    {
      fields: ["tag"],
      filters: posts?.[0]?.name ? [["post", "=", posts[0].name]] : [["post", "=", "__none__"]],
      limit: 20,
    },
    { enabled: !!posts?.[0]?.name }
  );

  const tagMap = useTagMap();
  return (
    <div className="l-section-content">
      {!!posts && posts?.length > 0 ? (
        <div className="inner">
          <h1
            className={`text-2xl md:text-4xl lg:text-5xl ${unbounded.className} font-bold leading-[1.2] bg-linear-to-r from-orange-accent-dark to-orange-vibrant text-transparent bg-clip-text text-center md:text-left
                    ${odd ? "md:text-right" : ""}`}
          >
            {title}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 my-6 md:my-12">
            <div className={`col-span-1 md:col-span-6 ${odd ? "md:order-2" : "md:order-1"}`}>
              <a href={`/${department_code}/${posts?.[0].slug}`}>
                <div className="cursor-pointer group">
                  <div className="relative aspect-video">
                    <div className="absolute inset-0 shrink-0 overflow-hidden rounded-2xl md:rounded-4xl">
                      <img
                        src={
                          posts?.[0].thumb
                            ? posts[0].thumb.startsWith("http")
                              ? posts[0].thumb
                              : `${getBaseUrl()}${posts[0].thumb}`
                            : PlaceholderImage.src
                        }
                        alt={posts?.[0].title || title}
                        className="object-cover w-full h-full aspect-video rounded-2xl md:rounded-4xl transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                        onError={e => {
                          e.currentTarget.src = PlaceholderImage.src;
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/0 rounded-2xl md:rounded-4xl"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 space-y-1.5 md:space-y-2 text-white">
                      <div className="flex items-center gap-2">
                        <Newspaper className="size-3.5 md:size-4 shrink-0" />
                        <span className="text-xs md:text-sm line-clamp-1">{title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PenIcon className="size-3.5 md:size-4 shrink-0" />
                        <span className="text-xs md:text-sm">
                          {posts?.[0].published_at
                            ? formatDate(new Date(posts[0].published_at), " HH:mm - dd/MM/yyyy")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="my-4 md:my-5 space-y-2 md:space-y-4">
                    <div className="font-bold text-blue-muted text-lg md:text-3xl leading-snug">
                      {posts?.[0].title}
                    </div>
                    <div className="font-normal text-sm md:text-base line-clamp-2">
                      {posts?.[0].excerpt}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {featuredPostTags?.map(pt => (
                      <span
                        key={pt.tag}
                        className="inline-flex items-center rounded-full border border-blue-midnight px-3 py-1 text-xs font-medium text-blue-dark"
                      >
                        # {tagMap[pt.tag] ?? pt.tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            </div>
            <div className={`col-span-1 md:col-span-6 ${odd ? "md:order-1" : "md:order-2"}`}>
              <div className="relative flex flex-col gap-5 md:gap-10">
                {posts?.slice(1, 4).map((post, index) => (
                  <a href={`/${department_code}/${post.slug}`} key={post.name ?? index}>
                    <div className="flex gap-3 md:gap-6">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 shrink-0 overflow-hidden rounded-2xl md:rounded-3xl">
                        <img
                          src={
                            post.thumb
                              ? post.thumb.startsWith("http")
                                ? post.thumb
                                : `${getBaseUrl()}${post.thumb}`
                              : PlaceholderImage.src
                          }
                          alt={post.title}
                          className="object-cover w-full h-full"
                          onError={e => {
                            e.currentTarget.src = PlaceholderImage.src;
                          }}
                        />
                      </div>
                      <div className="flex flex-1 flex-col space-y-2">
                        <span className="text-base md:text-xl font-bold text-blue-muted leading-snug line-clamp-2">
                          {post.title}
                        </span>
                        <p className="text-sm text-foreground-variant line-clamp-2 sm:line-clamp-3">
                          {post.thumb_desc || post.excerpt}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <a href={`/${department_code}`}>
              <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-brand to-blue-muted px-6 py-2 text-white font-medium shadow-sm transition hover:opacity-90">
                <span className="text-sm md:text-base">Xem thêm</span>
                <ArrowRight className="size-5" />
              </div>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FeaturePost;
