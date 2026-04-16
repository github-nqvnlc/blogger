// src/types/blogs.ts

// ─── Core Entities ──────────────────────────────────────────

export interface BlogDepartment {
  name: string;
  department_name: string;
  department_code: string;
  description: string;
  is_active: number; // 1 = active, 0 = inactive
  sort_order?: number;
  creation: string | number;
}

export interface Category {
  name: string;
  category: string;
  department:
    | string
    | Pick<BlogDepartment, "name" | "department_name" | "department_code">;
  description: string;
  is_active: number;
  creation: string | number;
  slug: string;
}

export interface Topic {
  name: string;
  topic: string;
  department: string;
  desc: string;
  is_active: number;
  slug: string;
  creation?: string | number;
}

export interface Tag {
  name: string;
  tag_name: string;
  slug: string;
  description: string;
  is_active: number;
}

// ─── Post ──────────────────────────────────────────────────

export type PostStatus = "Draft" | "Published" | "Archived";
export type PostVisibility = "Public" | "Internal";

export interface Post {
  name: string;
  title: string;
  department:
    | string
    | Pick<BlogDepartment, "name" | "department_name" | "department_code">;
  category: string | Pick<Category, "name" | "category" | "slug">;
  slug: string;
  author: string;
  published_at: string;
  thumb: string;
  thumb_desc: string;
  excerpt: string;
  status: PostStatus;
  visibility: PostVisibility;
  view_count: number;
  content: string;
  creation?: string | number;
}

// ─── Junction Tables ───────────────────────────────────────

export interface PostTopic {
  name: string;
  post: string;
  topic: string;
}

export interface PostTag {
  name: string;
  post: string;
  tag: string;
}

// ─── Comment ───────────────────────────────────────────────

export interface Comment {
  name: string;
  post: string;
  user: string;
  comment_answer: string | null;
  noi_dung: string;
  created_at?: string;
}

// ─── Assembled Data (sau khi FE assemble) ─────────────────

export interface AssembledPost extends Post {
  department: Pick<
    BlogDepartment,
    "name" | "department_name" | "department_code"
  >;
  category: Pick<Category, "name" | "category" | "slug">;
  topics: Pick<Topic, "name" | "topic" | "slug">[];
  tags: Pick<Tag, "name" | "tag_name" | "slug">[];
  comments: AssembledComment[];
}

export interface AssembledComment extends Comment {
  replies: Comment[];
}

// ─── Department Filter & Sort Types ────────────────────────

export type DepartmentSortField =
  | "name"
  | "department_name"
  | "department_code"
  | "sort_order"
  | "creation";
export type DepartmentSortOrder = "asc" | "desc";

export interface DepartmentFilterState {
  search?: string;
  is_active?: "all" | "active" | "inactive";
  sort_by?: DepartmentSortField;
  sort_order?: DepartmentSortOrder;
}

export interface DepartmentFormValues {
  department_name: string;
  department_code: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryFormValues {
  category: string;
  department: string;
  description: string;
  slug: string;
  is_active: boolean;
}
