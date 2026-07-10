/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAllCategories, useGetList } from "@/hooks";
import { keepPreviousData } from "@tanstack/react-query";
import { BlogDepartment, Category, Post } from "@/types/blogs";
import type { Filter } from "@/types/hooks";
import PlaceholderImage from "@public/images/post-placeholder.png";
import { ArrowDown, ChevronRight, Newspaper, PenIcon } from "lucide-react";
import { getBaseUrl } from "@/lib/utils";
import { formatDate } from "date-fns";
import Circle from "@/components/svgs/circle";
import { getCategoryLabelByName } from "@/utils/categories";
import { unbounded } from "@/lib/font";
import { PostCard } from "@/components/sections/post-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const FEATURED_COUNT = 5;

function Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogCode = params?.blog as string;
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeCategory, setActiveCategoryState] = useState<string | null>(() =>
    searchParams.get("category")
  );
  const [postLimit, setPostLimit] = useState(12);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [featuredApi, setFeaturedApi] = useState<CarouselApi>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileCategoryRef = useRef<HTMLDivElement>(null);

  const setActiveCategory = useCallback(
    (cat: string | null) => {
      setActiveCategoryState(cat);
      const url = new URL(window.location.href);
      if (cat) {
        url.searchParams.set("category", cat);
      } else {
        url.searchParams.delete("category");
      }
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    setActiveCategoryState(searchParams.get("category"));
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileCategoryRef.current && !mobileCategoryRef.current.contains(e.target as Node)) {
        setMobileCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: department } = useGetList<BlogDepartment>("blog_departments", {
    fields: ["*"],
    filters: [["department_code", "=", blogCode]],
    limit: 1,
  });

  const { data: allCategories } = useAllCategories();
  const deptName = department?.[0]?.name;
  const categories = useMemo<Category[]>(() => {
    if (!allCategories || !deptName) return [];

    return allCategories.filter(cat => {
      const dept = cat.department;
      return typeof dept === "string" ? dept === deptName : dept?.name === deptName;
    });
  }, [allCategories, deptName]);

  // URL dùng slug: ?category=phan-tich-san-pham.
  // API posts lưu category theo name, nên cần đổi slug -> name trước khi filter.
  const activeCategoryDoc = useMemo(
    () =>
      activeCategory
        ? categories.find(cat => cat.slug === activeCategory || cat.name === activeCategory)
        : undefined,
    [activeCategory, categories]
  );
  const activeCategoryName = activeCategoryDoc?.name ?? activeCategory;
  const activeCategoryLabel = activeCategoryDoc?.category ?? "Tất cả";
  const postFilters = useMemo<Filter[]>(() => {
    if (!deptName) return [];

    return [
      ["department", "=", deptName],
      ...(activeCategoryName ? [["category", "=", activeCategoryName] as Filter] : []),
    ];
  }, [activeCategoryName, deptName]);

  const { data: posts } = useGetList<Post>(
    "posts",
    {
      fields: ["*"],
      filters: postFilters,
      limit: postLimit,
      orderBy: { field: "published_at", order: "desc" },
    },
    {
      enabled: Boolean(deptName),
      placeholderData: keepPreviousData,
    }
  );

  const featuredPosts = posts?.slice(0, FEATURED_COUNT) ?? [];
  const hasPosts = (posts?.length ?? 0) > 0;

  useEffect(() => {
    setFeaturedIndex(0);
    setPostLimit(12);
    featuredApi?.scrollTo(0);
  }, [activeCategory, featuredApi]);

  useEffect(() => {
    if (!featuredApi) return;

    const updateFeaturedIndex = () => {
      setFeaturedIndex(featuredApi.selectedScrollSnap());
    };

    updateFeaturedIndex();
    featuredApi.on("select", updateFeaturedIndex);
    featuredApi.on("reInit", updateFeaturedIndex);

    return () => {
      featuredApi.off("select", updateFeaturedIndex);
      featuredApi.off("reInit", updateFeaturedIndex);
    };
  }, [featuredApi]);

  const thumbSrc = (thumb?: string | null) =>
    thumb ? (thumb.startsWith("http") ? thumb : `${getBaseUrl()}${thumb}`) : PlaceholderImage.src;

  return (
    <section className="l-section relative overflow-hidden">
      {/* Top-right ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 65% at 100% 0%, #e5eff7 0%, rgba(229,239,247,0.65) 30%, rgba(229,239,247,0.2) 55%, transparent 75%)",
        }}
      />
      {department?.[0] && (
        <div className="inner relative z-10">
          <div className="my-6">
            <h1 className={`text-lg md:text-3xl font-bold text-blue-muted ${unbounded.className}`}>
              {department?.[0]?.department_name}
            </h1>
          </div>

          {hasPosts && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* ── Featured slider ── */}
              <div className="col-span-1 md:col-span-7">
                <Carousel setApi={setFeaturedApi} opts={{ align: "start" }}>
                  <CarouselContent className="ml-0">
                    {featuredPosts.map(featured => (
                      <CarouselItem key={featured.name} className="pl-0">
                        <a href={`/${blogCode}/${featured.slug}`} className="block">
                          <div className="cursor-pointer group relative">
                            <div className="relative aspect-7/5">
                              <div className="absolute inset-0 shrink-0 overflow-hidden rounded-2xl md:rounded-4xl">
                                <img
                                  src={thumbSrc(featured.thumb)}
                                  alt={featured.title}
                                  className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
                                  onError={e => {
                                    e.currentTarget.src = PlaceholderImage.src;
                                  }}
                                />
                              </div>

                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/0 rounded-2xl md:rounded-4xl" />

                              {/* Content overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2 text-white">
                                <div className="flex md:gap-3 gap-1 items-center bg-white/20 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full w-fit">
                                  <Circle className="md:size-4 size-3" />
                                  <span className="text-xs md:text-base">
                                    {getCategoryLabelByName(featured.category as string)}
                                  </span>
                                </div>
                                <div className="mt-2 md:mt-4  md:max-w-3/4 max-w-full">
                                  <h1 className="text-base md:text-2xl font-bold">
                                    {featured.title}
                                  </h1>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between mt-3 md:mt-10">
                                  <div className="flex items-center gap-2">
                                    <Newspaper className="md:size-4 size-3" />
                                    <span className="text-xs md:text-sm">
                                      {department?.[0]?.department_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <PenIcon className="md:size-4 size-3" />
                                    <span className="text-xs md:text-sm">
                                      {featured.published_at
                                        ? formatDate(
                                            new Date(featured.published_at),
                                            "HH:mm - dd/MM/yyyy"
                                          )
                                        : "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {featuredPosts.length > 1 && (
                    <>
                      <CarouselPrevious
                        aria-label="Previous post"
                        className="cursor-pointer !left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/30 text-white backdrop-blur-sm transition hover:bg-white/50 disabled:opacity-30 md:flex"
                      />
                      <CarouselNext
                        aria-label="Next post"
                        className="cursor-pointer !right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/30 text-white backdrop-blur-sm transition hover:bg-white/50 disabled:opacity-30 md:flex"
                      />
                      <div className="mt-3 flex justify-center gap-2">
                        {featuredPosts.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => featuredApi?.scrollTo(i)}
                            aria-label={`Go to post ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === featuredIndex ? "w-6 bg-blue-midnight" : "w-1.5 bg-gray-300"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </Carousel>
              </div>

              {/* ── Side list ── */}
              <div className="col-span-1 md:col-span-5">
                <div
                  className={`${unbounded.className} text-lg md:text-2xl font-bold mb-5 bg-linear-to-r from-orange-accent-dark to-orange-vibrant text-transparent bg-clip-text `}
                >
                  Bài viết nổi bật
                </div>
                <div className="relative flex flex-col gap-4">
                  {featuredPosts.slice(0, 5).map((post, index) => (
                    <a href={`/${blogCode}/${post.slug}`} key={post.name ?? index}>
                      <div className="flex gap-3 items-center">
                        <div className="relative aspect-7/5 w-24 shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={thumbSrc(post.thumb)}
                            alt={post.title}
                            className="object-cover w-full h-full"
                            onError={e => {
                              e.currentTarget.src = PlaceholderImage.src;
                            }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col space-y-2">
                          <span className="text-base font-bold text-blue-muted leading-snug">
                            {post.title}
                          </span>
                        </div>
                      </div>
                      <hr className="border-border mt-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <div
              className={`${unbounded.className} mt-16 mb-10 text-center text-lg md:text-2xl font-bold bg-linear-to-r from-orange-accent-dark to-orange-vibrant text-transparent bg-clip-text`}
            >
              Danh mục bài viết
            </div>

            {categories.length > 0 && (
              <div className="mt-6">
                <div ref={mobileCategoryRef} className="relative md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileCategoryOpen(o => !o)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 ${
                      mobileCategoryOpen || activeCategory
                        ? "border-blue-midnight bg-blue-midnight text-white"
                        : "border-blue-brand text-blue-brand"
                    }`}
                  >
                    <span className="truncate">{activeCategoryLabel}</span>
                    <ChevronRight
                      className={`size-5 shrink-0 transition-transform duration-200 ${
                        mobileCategoryOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {mobileCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                      <ul className="py-1">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory(null);
                              setMobileCategoryOpen(false);
                            }}
                            className={`w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors duration-150 ${
                              activeCategory === null
                                ? "bg-blue-midnight/10 font-semibold text-blue-midnight"
                                : "text-gray-700"
                            }`}
                          >
                            Tất cả
                          </button>
                        </li>
                        {categories.map(cat => (
                          <li key={cat.name}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCategory(cat.slug);
                                setMobileCategoryOpen(false);
                              }}
                              className={`w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors duration-150 ${
                                activeCategory === cat.slug || activeCategory === cat.name
                                  ? "bg-blue-midnight/10 font-semibold text-blue-midnight"
                                  : "text-gray-700"
                              }`}
                            >
                              {cat.category}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="hidden flex-wrap items-center justify-center gap-2 md:flex">
                  {/* "Tất cả" tab */}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-6 py-2 text-lg font-semibold transition-colors duration-200 ${
                      activeCategory === null
                        ? "bg-linear-to-r from-blue-brand to-blue-midnight text-white"
                        : "border border-blue-brand text-blue-brand"
                    }`}
                  >
                    Tất cả
                  </button>

                  {/* First 5 categories as pills */}
                  {categories.slice(0, 5).map(cat => (
                    <button
                      key={cat.name}
                      onClick={() =>
                        setActiveCategory(cat.slug === activeCategory ? null : cat.slug)
                      }
                      className={`cursor-pointer whitespace-nowrap rounded-full px-6 py-2 text-lg font-semibold transition-colors duration-200 ${
                        activeCategory === cat.slug || activeCategory === cat.name
                          ? "bg-linear-to-r from-blue-brand to-blue-midnight text-white"
                          : "border border-blue-brand text-blue-brand"
                      }`}
                    >
                      {cat.category}
                    </button>
                  ))}

                  {/* Overflow dropdown */}
                  {categories.length > 5 && (
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() => setDropdownOpen(o => !o)}
                        className={`cursor-pointer flex items-center gap-1 whitespace-nowrap rounded-full px-6 py-2 text-lg font-semibold transition-colors duration-200 ${
                          dropdownOpen ||
                          categories
                            .slice(5)
                            .some(c => c.slug === activeCategory || c.name === activeCategory)
                            ? "bg-linear-to-r from-blue-brand to-blue-midnight text-white"
                            : "border border-blue-brand text-blue-brand"
                        }`}
                      >
                        Xem thêm
                        <ChevronRight
                          className={`size-4 transition-transform duration-200 ${
                            dropdownOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                          <ul className="py-1">
                            {categories.slice(5).map(cat => (
                              <li key={cat.name}>
                                <button
                                  onClick={() => {
                                    setActiveCategory(
                                      cat.slug === activeCategory ? null : cat.slug
                                    );
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                                    activeCategory === cat.slug || activeCategory === cat.name
                                      ? "bg-blue-midnight/10 font-semibold text-blue-midnight"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {cat.category}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid w-full grid-cols-1 gap-4 md:gap-12 md:grid-cols-2 lg:grid-cols-3 mt-6 md:mt-10">
                  {hasPosts ? (
                    posts?.map(p => {
                      const catName =
                        typeof p.category === "string" ? p.category : p.category?.name;
                      return (
                        <PostCard
                          key={p.name}
                          post={p}
                          categoryLabel={getCategoryLabelByName(catName)}
                          departmentCode={blogCode}
                        />
                      );
                    })
                  ) : posts ? (
                    <p className="col-span-full text-center text-gray-500">
                      Chưa có bài viết trong danh mục này.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {posts && posts.length >= postLimit && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setPostLimit(l => l + 12)}
                className="cursor-pointer px-8 py-3 flex items-center gap-2 font-semibold text-blue-midnight hover:underline"
              >
                <span>Hiện thêm</span>
                <ArrowDown className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Page;
