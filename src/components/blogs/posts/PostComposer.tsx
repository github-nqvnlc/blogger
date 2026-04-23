"use client";

import {
  BlogContentComposer,
  BlogContentComposerHandle,
} from "@/components/blogs/editor/blog-content-composer";
import { CoverImageField, CoverSource } from "@/components/blogs/metadata/CoverImageField";
import { SearchableMultiSelect } from "@/components/blogs/metadata/SearchableMultiSelect";
import {
  SearchableSingleSelect,
  SelectOption,
} from "@/components/blogs/metadata/SearchableSingleSelect";
import { PostContentPreview } from "@/components/blogs/posts/PostContentPreview";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useCreateDoc, useDeleteDoc, useGetDoc, useGetList, useUpdateDoc } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath, getDictionary } from "@/i18n";
import {
  formatFrappeDatetime,
  formatPostStatusLabel,
  formatPostVisibilityLabel,
  getCategoryName,
  getPrivateFlag,
  normalizeEditorHtml,
  normalizePostFileDoc,
  POST_STATUS_VALUES,
  POST_VISIBILITY_VALUES,
  slugify,
  stripHtml,
} from "@/lib/blog-posts";
import { cn, getBaseUrl } from "@/lib/utils";
import {
  BlogDepartment,
  Category,
  Post,
  PostFileDoc,
  PostFormValues,
  PostTag,
  PostTopic,
  Tag,
  Topic,
} from "@/types/blogs";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type StepNumber = 1 | 2 | 3;
type FieldName = keyof PostFormValues | "topics" | "tags";
type StepTitleKey = "metadata" | "content" | "review";
type StepConfig = {
  step: StepNumber;
  titleKey: StepTitleKey;
};
type CategoryDraftField = "category" | "slug" | "description";
type CategoryDraftValues = {
  category: string;
  slug: string;
  description: string;
};
type TopicDraftField = "topic" | "slug" | "desc";
type TopicDraftValues = {
  topic: string;
  slug: string;
  desc: string;
};
type TagDraftField = "tag_name" | "slug" | "description";
type TagDraftValues = {
  tag_name: string;
  slug: string;
  description: string;
};
type PendingNavigationIntent = "cancel" | "leave";
type PendingNavigation = {
  href: string;
  intent: PendingNavigationIntent;
};
type ComposerSnapshot = {
  form: PostFormValues;
  topicIds: string[];
  tagIds: string[];
};

const INITIAL_FORM_STATE: PostFormValues = {
  title: "",
  department: "",
  category: "",
  slug: "",
  thumb: "",
  thumb_desc: "",
  excerpt: "",
  status: "Draft",
  visibility: "Public",
  content: "",
};

const INITIAL_CATEGORY_DRAFT: CategoryDraftValues = {
  category: "",
  slug: "",
  description: "",
};

const INITIAL_TOPIC_DRAFT: TopicDraftValues = {
  topic: "",
  slug: "",
  desc: "",
};

const INITIAL_TAG_DRAFT: TagDraftValues = {
  tag_name: "",
  slug: "",
  description: "",
};

const CREATE_STEPS: StepConfig[] = [
  { step: 1, titleKey: "metadata" },
  { step: 2, titleKey: "content" },
  { step: 3, titleKey: "review" },
];

const EDIT_STEPS: StepConfig[] = [
  { step: 1, titleKey: "metadata" },
  { step: 2, titleKey: "content" },
];

function getTrimmedLength(value: string): number {
  return value.trim().length;
}

function createComposerSnapshot(
  form: PostFormValues,
  topicIds: string[],
  tagIds: string[]
): ComposerSnapshot {
  return {
    form: { ...form },
    topicIds: [...topicIds].sort(),
    tagIds: [...tagIds].sort(),
  };
}

function serializeComposerSnapshot(snapshot: ComposerSnapshot): string {
  return JSON.stringify(snapshot);
}

function createHistoryGuardState(currentState: unknown) {
  if (currentState && typeof currentState === "object" && !Array.isArray(currentState)) {
    return {
      ...currentState,
      __postComposerGuard: true,
    };
  }

  return {
    __postComposerGuard: true,
  };
}

function isHistoryGuardState(state: unknown): boolean {
  return Boolean(
    state &&
    typeof state === "object" &&
    !Array.isArray(state) &&
    "__postComposerGuard" in state &&
    (state as { __postComposerGuard?: boolean }).__postComposerGuard
  );
}

function clearHistoryGuardState(state: unknown) {
  if (state && typeof state === "object" && !Array.isArray(state)) {
    const nextState = { ...(state as Record<string, unknown>) };
    delete nextState.__postComposerGuard;
    return nextState;
  }

  return {};
}

function focusField(fieldName: FieldName) {
  const selectors: Record<FieldName, string> = {
    title: "#post-title",
    department: "#post-department",
    category: "#post-category",
    slug: "#post-slug",
    thumb: "#post-cover-field",
    thumb_desc: "#post-thumb-desc",
    excerpt: "#post-excerpt",
    status: "[data-post-status-trigger]",
    visibility: "[data-post-visibility-trigger]",
    content: "#post-content-editor",
    topics: "#post-topics",
    tags: "#post-tags",
  };

  const element = document.querySelector(selectors[fieldName]) as HTMLElement | null;
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus();
}

interface PostComposerProps {
  mode?: "create" | "edit";
  postId?: string;
}

export function PostComposer({ mode = "create", postId }: PostComposerProps) {
  const isEditMode = mode === "edit";
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const copy = t.blogPosts ?? getDictionary(locale).blogPosts;
  const categoryCopy = t.blogCategories ?? getDictionary(locale).blogCategories;
  const categoryFormCopy = categoryCopy.form;
  const topicCopy = t.blogTopics ?? getDictionary(locale).blogTopics;
  const topicFormCopy = topicCopy.form;
  const tagCopy = t.blogTags ?? getDictionary(locale).blogTags;
  const tagFormCopy = tagCopy.form;
  const statusLabels = copy.status;
  const visibilityLabels = copy.visibility;
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [form, setForm] = useState<PostFormValues>(INITIAL_FORM_STATE);
  const [createdCategoryOption, setCreatedCategoryOption] = useState<SelectOption | null>(null);
  const [createdTopicOptions, setCreatedTopicOptions] = useState<SelectOption[]>([]);
  const [createdTagOptions, setCreatedTagOptions] = useState<SelectOption[]>([]);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isCreateTopicDialogOpen, setIsCreateTopicDialogOpen] = useState(false);
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraftValues>(INITIAL_CATEGORY_DRAFT);
  const [topicDraft, setTopicDraft] = useState<TopicDraftValues>(INITIAL_TOPIC_DRAFT);
  const [tagDraft, setTagDraft] = useState<TagDraftValues>(INITIAL_TAG_DRAFT);
  const [categoryDraftErrors, setCategoryDraftErrors] = useState<
    Partial<Record<CategoryDraftField, string>>
  >({});
  const [topicDraftErrors, setTopicDraftErrors] = useState<
    Partial<Record<TopicDraftField, string>>
  >({});
  const [tagDraftErrors, setTagDraftErrors] = useState<Partial<Record<TagDraftField, string>>>({});
  const [categorySlugEdited, setCategorySlugEdited] = useState(false);
  const [topicSlugEdited, setTopicSlugEdited] = useState(false);
  const [tagSlugEdited, setTagSlugEdited] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [coverSource, setCoverSource] = useState<CoverSource>("url");
  const [coverFileMeta, setCoverFileMeta] = useState<PostFileDoc | null>(null);
  const [isCoverBusy, setIsCoverBusy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [hasInitializedEdit, setHasInitializedEdit] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<ComposerSnapshot>(() =>
    createComposerSnapshot(INITIAL_FORM_STATE, [], [])
  );
  const [transientCoverUploadCount, setTransientCoverUploadCount] = useState(0);
  const [transientEditorUploadCount, setTransientEditorUploadCount] = useState(0);
  const [editorHasTransientUploads, setEditorHasTransientUploads] = useState(false);
  const editorRef = useRef<BlogContentComposerHandle>(null);
  const shouldBlockNavigationRef = useRef(false);
  const currentUrlRef = useRef(pathname);
  const initialCoverFileNameRef = useRef<string | null>(null);
  const transientCoverFileNamesRef = useRef<Set<string>>(new Set());
  const transientEditorFileNamesRef = useRef<Set<string>>(new Set());
  const skipNextPopstateRef = useRef(false);

  const {
    data: existingPost,
    isLoading: isLoadingExistingPost,
    error: existingPostError,
  } = useGetDoc<Post>("posts", isEditMode ? (postId ?? null) : null, {
    enabled: !!currentUser && isEditMode && !!postId,
  });

  const { data: existingPostTopics, isLoading: isLoadingExistingPostTopics } =
    useGetList<PostTopic>(
      "post_topics",
      {
        fields: ["name", "post", "topic"],
        filters: postId ? [["post", "=", postId]] : undefined,
        limit: 200,
      },
      {
        enabled: !!currentUser && isEditMode && !!postId,
      }
    );

  const { data: existingPostTags, isLoading: isLoadingExistingPostTags } = useGetList<PostTag>(
    "post_tags",
    {
      fields: ["name", "post", "tag"],
      filters: postId ? [["post", "=", postId]] : undefined,
      limit: 200,
    },
    {
      enabled: !!currentUser && isEditMode && !!postId,
    }
  );

  const { data: existingCoverFiles, isLoading: isLoadingExistingCoverFile } =
    useGetList<PostFileDoc>(
      "File",
      {
        fields: ["name", "file_url", "file_name", "is_private"],
        filters: existingPost?.thumb ? [["file_url", "=", existingPost.thumb]] : undefined,
        limit: 1,
      },
      {
        enabled: !!currentUser && isEditMode && !!existingPost?.thumb,
      }
    );

  const existingCoverFile = useMemo(
    () => normalizePostFileDoc(existingCoverFiles?.[0]),
    [existingCoverFiles]
  );

  const { data: selectedDepartment } = useGetDoc<BlogDepartment>(
    "blog_departments",
    form.department || null,
    {
      enabled: !!currentUser && !!form.department,
    }
  );

  const { data: selectedCategory } = useGetDoc<Category>("categories", form.category || null, {
    enabled: !!currentUser && !!form.category,
  });

  const { data: selectedTopicsData } = useGetList<Topic>(
    "topics",
    {
      fields: ["name", "topic", "slug", "desc", "department", "creation"],
      filters: selectedTopicIds.length > 0 ? [["name", "in", selectedTopicIds]] : undefined,
      orderBy: { field: "creation", order: "desc" },
      limit: selectedTopicIds.length || 20,
    },
    {
      enabled: !!currentUser && selectedTopicIds.length > 0,
    }
  );

  const { data: selectedTagsData } = useGetList<Tag>(
    "tags",
    {
      fields: ["name", "tag_name", "slug", "description", "creation"],
      filters: selectedTagIds.length > 0 ? [["name", "in", selectedTagIds]] : undefined,
      orderBy: { field: "creation", order: "desc" },
      limit: selectedTagIds.length || 20,
    },
    {
      enabled: !!currentUser && selectedTagIds.length > 0,
    }
  );

  const createPost = useCreateDoc<Post>("posts");
  const createPostTopic = useCreateDoc<PostTopic>("post_topics");
  const createPostTag = useCreateDoc<PostTag>("post_tags");
  const createCategory = useCreateDoc<Category>("categories");
  const createTopic = useCreateDoc<Topic>("topics");
  const createTag = useCreateDoc<Tag>("tags");
  const deletePostTopic = useDeleteDoc("post_topics");
  const deletePostTag = useDeleteDoc("post_tags");
  const updateFile = useUpdateDoc<PostFileDoc>("File");
  const deleteFile = useDeleteDoc("File");
  const updatePost = useUpdateDoc<Post>("posts");

  const selectedDepartmentOption = useMemo<SelectOption | null>(
    () =>
      selectedDepartment
        ? {
          value: selectedDepartment.name,
          label: selectedDepartment.department_name,
          description: selectedDepartment.department_code,
          keywords: [selectedDepartment.department_code, selectedDepartment.description].filter(
            Boolean
          ),
        }
        : null,
    [selectedDepartment]
  );

  const selectedCategoryOption = useMemo<SelectOption | null>(
    () =>
      selectedCategory
        ? {
          value: selectedCategory.name,
          label: getCategoryName(selectedCategory),
          description: selectedCategory.slug || selectedCategory.description,
          keywords: [selectedCategory.slug, selectedCategory.description].filter(Boolean),
        }
        : null,
    [selectedCategory]
  );

  const selectedDepartmentLabel =
    selectedDepartment?.department_name ?? selectedDepartmentOption?.label ?? form.department;

  const effectiveSelectedCategoryOption = useMemo<SelectOption | null>(() => {
    if (selectedCategoryOption) {
      return selectedCategoryOption;
    }

    if (createdCategoryOption?.value === form.category) {
      return createdCategoryOption;
    }

    return null;
  }, [createdCategoryOption, form.category, selectedCategoryOption]);

  const selectedTopicOptions = useMemo<SelectOption[]>(() => {
    const topicMap = new Map<string, SelectOption>(
      (selectedTopicsData ?? []).map(topic => {
        const option: SelectOption = {
          value: topic.name,
          label: topic.topic,
          description: topic.slug || topic.desc || undefined,
          keywords: [topic.slug, topic.desc].filter(Boolean),
        };

        return [topic.name, option];
      })
    );

    return selectedTopicIds
      .map(topicId => topicMap.get(topicId))
      .filter((option): option is SelectOption => Boolean(option));
  }, [selectedTopicIds, selectedTopicsData]);

  const effectiveSelectedTopicOptions = useMemo(() => {
    const optionMap = new Map<string, SelectOption>();

    for (const option of createdTopicOptions) {
      if (selectedTopicIds.includes(option.value)) {
        optionMap.set(option.value, option);
      }
    }

    for (const option of selectedTopicOptions) {
      optionMap.set(option.value, option);
    }

    return Array.from(optionMap.values());
  }, [createdTopicOptions, selectedTopicIds, selectedTopicOptions]);

  const selectedTagOptions = useMemo<SelectOption[]>(() => {
    const tagMap = new Map<string, SelectOption>(
      (selectedTagsData ?? []).map(tag => {
        const option: SelectOption = {
          value: tag.name,
          label: tag.tag_name,
          description: tag.slug || tag.description || undefined,
          keywords: [tag.slug, tag.description].filter(Boolean),
        };

        return [tag.name, option];
      })
    );

    return selectedTagIds
      .map(tagId => tagMap.get(tagId))
      .filter((option): option is SelectOption => Boolean(option));
  }, [selectedTagIds, selectedTagsData]);

  const effectiveSelectedTagOptions = useMemo(() => {
    const optionMap = new Map<string, SelectOption>();

    for (const option of createdTagOptions) {
      if (selectedTagIds.includes(option.value)) {
        optionMap.set(option.value, option);
      }
    }

    for (const option of selectedTagOptions) {
      optionMap.set(option.value, option);
    }

    return Array.from(optionMap.values());
  }, [createdTagOptions, selectedTagIds, selectedTagOptions]);

  const selectedTopics = useMemo(() => {
    const topicMap = new Map((selectedTopicsData ?? []).map(topic => [topic.name, topic]));
    return selectedTopicIds
      .map(topicId => topicMap.get(topicId))
      .filter((topic): topic is Topic => Boolean(topic));
  }, [selectedTopicIds, selectedTopicsData]);

  const selectedTags = useMemo(() => {
    const tagMap = new Map((selectedTagsData ?? []).map(tag => [tag.name, tag]));
    return selectedTagIds.map(tagId => tagMap.get(tagId)).filter((tag): tag is Tag => Boolean(tag));
  }, [selectedTagIds, selectedTagsData]);

  const currentSnapshot = useMemo(
    () => createComposerSnapshot(form, selectedTopicIds, selectedTagIds),
    [form, selectedTagIds, selectedTopicIds]
  );

  const hasUnsavedChanges = useMemo(
    () => serializeComposerSnapshot(currentSnapshot) !== serializeComposerSnapshot(initialSnapshot),
    [currentSnapshot, initialSnapshot]
  );

  const hasTransientUploads =
    transientCoverUploadCount > 0 || transientEditorUploadCount > 0 || editorHasTransientUploads;
  const shouldBlockNavigation = hasUnsavedChanges || hasTransientUploads;

  useEffect(() => {
    shouldBlockNavigationRef.current = shouldBlockNavigation;
  }, [shouldBlockNavigation]);

  useEffect(() => {
    currentUrlRef.current =
      typeof window === "undefined"
        ? pathname
        : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const hasGuardState = isHistoryGuardState(window.history.state);

    if (shouldBlockNavigation) {
      if (!hasGuardState) {
        window.history.pushState(createHistoryGuardState(window.history.state), "", currentUrl);
      }

      currentUrlRef.current = currentUrl;
      return;
    }

    if (hasGuardState) {
      skipNextPopstateRef.current = true;
      window.history.back();
    }
  }, [pathname, shouldBlockNavigation]);

  const registerTransientCoverUpload = useCallback((file: PostFileDoc | null) => {
    if (!file?.name || file.name === initialCoverFileNameRef.current) {
      return;
    }

    const nextTrackedFiles = new Set(transientCoverFileNamesRef.current);
    nextTrackedFiles.add(file.name);
    transientCoverFileNamesRef.current = nextTrackedFiles;
    setTransientCoverUploadCount(nextTrackedFiles.size);
  }, []);

  const clearTrackedTransientCoverUploads = useCallback(() => {
    transientCoverFileNamesRef.current = new Set();
    setTransientCoverUploadCount(0);
  }, []);

  const registerTransientEditorUpload = useCallback((fileName: string) => {
    if (!fileName) {
      return;
    }

    const nextTrackedFiles = new Set(transientEditorFileNamesRef.current);
    nextTrackedFiles.add(fileName);
    transientEditorFileNamesRef.current = nextTrackedFiles;
    setTransientEditorUploadCount(nextTrackedFiles.size);
    setEditorHasTransientUploads(true);
  }, []);

  const clearTrackedTransientEditorUploads = useCallback(() => {
    transientEditorFileNamesRef.current = new Set();
    setTransientEditorUploadCount(0);
    setEditorHasTransientUploads(false);
  }, []);

  const cleanupTransientCoverUploads = useCallback(
    async (keepFileNames: string[] = []) => {
      const keepSet = new Set(keepFileNames.filter(Boolean));
      const remainingFiles = new Set<string>();

      for (const fileName of transientCoverFileNamesRef.current) {
        if (keepSet.has(fileName)) {
          remainingFiles.add(fileName);
          continue;
        }

        try {
          await deleteFile.deleteDoc(fileName);
        } catch { }
      }

      transientCoverFileNamesRef.current = remainingFiles;
      setTransientCoverUploadCount(remainingFiles.size);
    },
    [deleteFile]
  );

  const cleanupTransientEditorUploads = useCallback(
    async (keepFileNames: string[] = []) => {
      const keepSet = new Set(keepFileNames.filter(Boolean));
      const remainingFiles = new Set<string>();

      for (const fileName of transientEditorFileNamesRef.current) {
        if (keepSet.has(fileName)) {
          remainingFiles.add(fileName);
          continue;
        }

        try {
          await deleteFile.deleteDoc(fileName);
        } catch { }
      }

      transientEditorFileNamesRef.current = remainingFiles;
      setTransientEditorUploadCount(remainingFiles.size);
      setEditorHasTransientUploads(remainingFiles.size > 0);
    },
    [deleteFile]
  );

  const cleanupTransientUploads = useCallback(
    async (keepCoverFileNames: string[] = [], keepEditorFileNames: string[] = []) => {
      await cleanupTransientCoverUploads(keepCoverFileNames);
      await cleanupTransientEditorUploads(keepEditorFileNames);
    },
    [cleanupTransientCoverUploads, cleanupTransientEditorUploads]
  );

  const performNavigation = useCallback(
    (href: string) => {
      if (typeof window !== "undefined" && isHistoryGuardState(window.history.state)) {
        window.history.replaceState(
          clearHistoryGuardState(window.history.state),
          "",
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        );
      }

      if (href.startsWith("/")) {
        router.push(href);
        return;
      }

      window.location.href = href;
    },
    [router]
  );

  const requestNavigation = useCallback((href: string, intent: PendingNavigationIntent) => {
    setPendingNavigation({ href, intent });
  }, []);

  useEffect(() => {
    if (
      !isEditMode ||
      hasInitializedEdit ||
      !existingPost ||
      isLoadingExistingPostTopics ||
      isLoadingExistingPostTags ||
      isLoadingExistingCoverFile
    ) {
      return;
    }

    const nextForm: PostFormValues = {
      title: existingPost.title ?? "",
      department:
        typeof existingPost.department === "string"
          ? existingPost.department
          : (existingPost.department?.name ?? ""),
      category:
        typeof existingPost.category === "string"
          ? existingPost.category
          : (existingPost.category?.name ?? ""),
      slug: existingPost.slug ?? "",
      thumb: existingPost.thumb ?? "",
      thumb_desc: existingPost.thumb_desc ?? "",
      excerpt: existingPost.excerpt ?? "",
      status: existingPost.status ?? "Draft",
      visibility: existingPost.visibility ?? "Public",
      content: existingPost.content ?? "",
    };
    const nextTopicIds = (existingPostTopics ?? []).map(item => item.topic);
    const nextTagIds = (existingPostTags ?? []).map(item => item.tag);
    const nextCoverSource: CoverSource = existingCoverFile ? "upload" : "url";

    setForm(nextForm);
    setSelectedTopicIds(nextTopicIds);
    setSelectedTagIds(nextTagIds);
    setCoverSource(nextCoverSource);
    setCoverFileMeta(existingCoverFile);
    setCreatedCategoryOption(null);
    setCreatedTopicOptions([]);
    setCreatedTagOptions([]);
    setFieldErrors({});
    setCurrentStep(1);
    setSlugEdited(Boolean(existingPost.slug?.trim()));
    setPendingNavigation(null);
    clearTrackedTransientCoverUploads();
    clearTrackedTransientEditorUploads();
    initialCoverFileNameRef.current = existingCoverFile?.name ?? null;
    setInitialSnapshot(createComposerSnapshot(nextForm, nextTopicIds, nextTagIds));
    setHasInitializedEdit(true);
  }, [
    clearTrackedTransientCoverUploads,
    clearTrackedTransientEditorUploads,
    existingCoverFile,
    existingPost,
    existingPostTags,
    existingPostTopics,
    hasInitializedEdit,
    isEditMode,
    isLoadingExistingCoverFile,
    isLoadingExistingPostTags,
    isLoadingExistingPostTopics,
  ]);

  useEffect(() => {
    if (!coverFileMeta?.name) {
      return;
    }

    registerTransientCoverUpload(coverFileMeta);
  }, [coverFileMeta, registerTransientCoverUpload]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!shouldBlockNavigationRef.current) return;

      e.preventDefault();
      e.returnValue = copy.browserLeavePrompt;
      return copy.browserLeavePrompt;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [copy.browserLeavePrompt]);

  const safeNavigate = useCallback(
    (
      href: string,
      options?: {
        intent?: PendingNavigationIntent;
        skipConfirm?: boolean;
      }
    ) => {
      if (!options?.skipConfirm && shouldBlockNavigationRef.current) {
        requestNavigation(href, options?.intent ?? "leave");
        return;
      }

      performNavigation(href);
    },
    [performNavigation, requestNavigation]
  );

  useEffect(() => {
    const handler = () => {
      const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (skipNextPopstateRef.current) {
        skipNextPopstateRef.current = false;
        currentUrlRef.current = nextUrl;
        return;
      }

      if (!shouldBlockNavigationRef.current) {
        currentUrlRef.current = nextUrl;
        return;
      }

      const confirmed = window.confirm(copy.browserLeavePrompt);

      if (!confirmed) {
        window.history.pushState(
          createHistoryGuardState(window.history.state),
          "",
          currentUrlRef.current
        );
        return;
      }

      void cleanupTransientUploads().finally(() => {
        skipNextPopstateRef.current = true;
        window.history.back();
      });
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [cleanupTransientUploads, copy.browserLeavePrompt]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!shouldBlockNavigationRef.current || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        return;
      }

      const anchor = eventTarget.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextHref = `${url.pathname}${url.search}${url.hash}`;
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const currentRoute = `${window.location.pathname}${window.location.search}`;

      if (
        nextHref === currentHref ||
        (`${url.pathname}${url.search}` === currentRoute && url.hash)
      ) {
        return;
      }

      event.preventDefault();
      requestNavigation(nextHref, "leave");
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [requestNavigation]);

  const clearFieldError = useCallback((field: FieldName) => {
    setFieldErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const updateField = useCallback(
    <K extends keyof PostFormValues>(field: K, value: PostFormValues[K]) => {
      setForm(currentForm => ({ ...currentForm, [field]: value }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  // Auto-generate slug from title unless user manually edited it
  const handleTitleChange = useCallback(
    (value: string) => {
      updateField("title", value);
      if (!slugEdited && value.trim()) {
        const nextSlug = slugify(value);
        if (form.slug !== nextSlug) {
          updateField("slug", nextSlug);
        }
      }
    },
    [slugEdited, form.slug, updateField]
  );

  const clearCategoryDraftError = useCallback((field: CategoryDraftField) => {
    setCategoryDraftErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const openCreateCategoryDialog = useCallback(
    (initialName = "") => {
      if (!form.department) {
        toast.error(copy.validation.departmentRequired);
        return;
      }

      const normalizedName = initialName.trim();
      setCategoryDraft({
        category: normalizedName,
        slug: normalizedName ? slugify(normalizedName) : "",
        description: "",
      });
      setCategorySlugEdited(false);
      setCategoryDraftErrors({});
      setIsCreateCategoryDialogOpen(true);
    },
    [copy.validation.departmentRequired, form.department]
  );

  const handleCategoryDraftChange = useCallback(
    <K extends keyof CategoryDraftValues>(field: K, value: CategoryDraftValues[K]) => {
      setCategoryDraft(currentDraft => ({ ...currentDraft, [field]: value }));
      clearCategoryDraftError(field);
    },
    [clearCategoryDraftError]
  );

  const handleCategoryNameChange = useCallback(
    (value: string) => {
      handleCategoryDraftChange("category", value);
      if (!categorySlugEdited) {
        handleCategoryDraftChange("slug", slugify(value));
      }
    },
    [categorySlugEdited, handleCategoryDraftChange]
  );

  function validateCategoryDraft() {
    const nextErrors: Partial<Record<CategoryDraftField, string>> = {};
    const nameLength = getTrimmedLength(categoryDraft.category);

    if (!nameLength) {
      nextErrors.category = categoryFormCopy.nameRequired;
    } else if (nameLength < 2) {
      nextErrors.category = categoryFormCopy.nameMin;
    } else if (nameLength > 100) {
      nextErrors.category = categoryFormCopy.nameMax;
    }

    if (
      categoryDraft.slug.trim() &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categoryDraft.slug.trim())
    ) {
      nextErrors.slug = categoryFormCopy.slugPattern;
    } else if (categoryDraft.slug.trim().length > 140) {
      nextErrors.slug = categoryFormCopy.slugMax;
    }

    if (getTrimmedLength(categoryDraft.description) > 500) {
      nextErrors.description = categoryFormCopy.descriptionMax;
    }

    setCategoryDraftErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      firstError: nextErrors.category ?? nextErrors.slug ?? nextErrors.description,
    };
  }

  async function handleCreateCategory() {
    if (!form.department) {
      toast.error(copy.validation.departmentRequired);
      return;
    }

    const { isValid, firstError } = validateCategoryDraft();

    if (!isValid) {
      toast.error(firstError ?? categoryFormCopy.createFailure);
      return;
    }

    try {
      const createdCategory = await createCategory.createDoc({
        category: categoryDraft.category.trim(),
        department: form.department,
        description: categoryDraft.description.trim(),
        slug: categoryDraft.slug.trim(),
        is_active: 1,
      });

      const nextOption: SelectOption = {
        value: createdCategory.name,
        label: getCategoryName(createdCategory),
        description: createdCategory.slug || createdCategory.description || undefined,
        keywords: [createdCategory.slug, createdCategory.description].filter(Boolean),
      };

      setCreatedCategoryOption(nextOption);
      updateField("category", createdCategory.name);
      clearFieldError("category");
      setCategoryDraft(INITIAL_CATEGORY_DRAFT);
      setCategoryDraftErrors({});
      setCategorySlugEdited(false);
      setIsCreateCategoryDialogOpen(false);
      toast.success(categoryFormCopy.createSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : categoryFormCopy.createFailure
      );
    }
  }

  const clearTopicDraftError = useCallback((field: TopicDraftField) => {
    setTopicDraftErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const openCreateTopicDialog = useCallback(
    (initialName = "") => {
      if (!form.department) {
        toast.error(copy.validation.departmentRequired);
        return;
      }

      const normalizedName = initialName.trim();
      setTopicDraft({
        topic: normalizedName,
        slug: normalizedName ? slugify(normalizedName) : "",
        desc: "",
      });
      setTopicSlugEdited(false);
      setTopicDraftErrors({});
      setIsCreateTopicDialogOpen(true);
    },
    [copy.validation.departmentRequired, form.department]
  );

  const handleTopicDraftChange = useCallback(
    <K extends keyof TopicDraftValues>(field: K, value: TopicDraftValues[K]) => {
      setTopicDraft(currentDraft => ({ ...currentDraft, [field]: value }));
      clearTopicDraftError(field);
    },
    [clearTopicDraftError]
  );

  const handleTopicNameChange = useCallback(
    (value: string) => {
      handleTopicDraftChange("topic", value);
      if (!topicSlugEdited) {
        handleTopicDraftChange("slug", slugify(value));
      }
    },
    [handleTopicDraftChange, topicSlugEdited]
  );

  function validateTopicDraft() {
    const nextErrors: Partial<Record<TopicDraftField, string>> = {};
    const nameLength = getTrimmedLength(topicDraft.topic);

    if (!nameLength) {
      nextErrors.topic = topicFormCopy.nameRequired;
    } else if (nameLength < 2) {
      nextErrors.topic = topicFormCopy.nameMin;
    } else if (nameLength > 100) {
      nextErrors.topic = topicFormCopy.nameMax;
    }

    if (topicDraft.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicDraft.slug.trim())) {
      nextErrors.slug = topicFormCopy.slugPattern;
    } else if (topicDraft.slug.trim().length > 140) {
      nextErrors.slug = topicFormCopy.slugMax;
    }

    if (getTrimmedLength(topicDraft.desc) > 500) {
      nextErrors.desc = topicFormCopy.descriptionMax;
    }

    setTopicDraftErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      firstError: nextErrors.topic ?? nextErrors.slug ?? nextErrors.desc,
    };
  }

  async function handleCreateTopic() {
    if (!form.department) {
      toast.error(copy.validation.departmentRequired);
      return;
    }

    const { isValid, firstError } = validateTopicDraft();

    if (!isValid) {
      toast.error(firstError ?? topicFormCopy.createFailure);
      return;
    }

    try {
      const createdTopic = await createTopic.createDoc({
        topic: topicDraft.topic.trim(),
        department: form.department,
        desc: topicDraft.desc.trim(),
        slug: topicDraft.slug.trim(),
        is_active: 1,
      });

      const nextOption: SelectOption = {
        value: createdTopic.name,
        label: createdTopic.topic,
        description: createdTopic.slug || createdTopic.desc || undefined,
        keywords: [createdTopic.slug, createdTopic.desc].filter(Boolean),
      };

      setCreatedTopicOptions(current => [
        ...current.filter(item => item.value !== nextOption.value),
        nextOption,
      ]);
      setSelectedTopicIds(current =>
        current.includes(createdTopic.name) ? current : [...current, createdTopic.name]
      );
      clearFieldError("topics");
      setTopicDraft(INITIAL_TOPIC_DRAFT);
      setTopicDraftErrors({});
      setTopicSlugEdited(false);
      setIsCreateTopicDialogOpen(false);
      toast.success(topicFormCopy.createSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : topicFormCopy.createFailure
      );
    }
  }

  const clearTagDraftError = useCallback((field: TagDraftField) => {
    setTagDraftErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }, []);

  const openCreateTagDialog = useCallback((initialName = "") => {
    const normalizedName = initialName.trim();
    setTagDraft({
      tag_name: normalizedName,
      slug: normalizedName ? slugify(normalizedName) : "",
      description: "",
    });
    setTagSlugEdited(false);
    setTagDraftErrors({});
    setIsCreateTagDialogOpen(true);
  }, []);

  const handleTagDraftChange = useCallback(
    <K extends keyof TagDraftValues>(field: K, value: TagDraftValues[K]) => {
      setTagDraft(currentDraft => ({ ...currentDraft, [field]: value }));
      clearTagDraftError(field);
    },
    [clearTagDraftError]
  );

  const handleTagNameChange = useCallback(
    (value: string) => {
      handleTagDraftChange("tag_name", value);
      if (!tagSlugEdited) {
        handleTagDraftChange("slug", slugify(value));
      }
    },
    [handleTagDraftChange, tagSlugEdited]
  );

  function validateTagDraft() {
    const nextErrors: Partial<Record<TagDraftField, string>> = {};
    const nameLength = getTrimmedLength(tagDraft.tag_name);

    if (!nameLength) {
      nextErrors.tag_name = tagFormCopy.nameRequired;
    } else if (nameLength < 2) {
      nextErrors.tag_name = tagFormCopy.nameMin;
    } else if (nameLength > 100) {
      nextErrors.tag_name = tagFormCopy.nameMax;
    }

    if (tagDraft.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tagDraft.slug.trim())) {
      nextErrors.slug = tagFormCopy.slugPattern;
    } else if (tagDraft.slug.trim().length > 140) {
      nextErrors.slug = tagFormCopy.slugMax;
    }

    if (getTrimmedLength(tagDraft.description) > 500) {
      nextErrors.description = tagFormCopy.descriptionMax;
    }

    setTagDraftErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      firstError: nextErrors.tag_name ?? nextErrors.slug ?? nextErrors.description,
    };
  }

  async function handleCreateTag() {
    const { isValid, firstError } = validateTagDraft();

    if (!isValid) {
      toast.error(firstError ?? tagFormCopy.createFailure);
      return;
    }

    try {
      const createdTag = await createTag.createDoc({
        tag_name: tagDraft.tag_name.trim(),
        description: tagDraft.description.trim(),
        slug: tagDraft.slug.trim(),
        is_active: 1,
      });

      const nextOption: SelectOption = {
        value: createdTag.name,
        label: createdTag.tag_name,
        description: createdTag.slug || createdTag.description || undefined,
        keywords: [createdTag.slug, createdTag.description].filter(Boolean),
      };

      setCreatedTagOptions(current => [
        ...current.filter(item => item.value !== nextOption.value),
        nextOption,
      ]);
      setSelectedTagIds(current =>
        current.includes(createdTag.name) ? current : [...current, createdTag.name]
      );
      clearFieldError("tags");
      setTagDraft(INITIAL_TAG_DRAFT);
      setTagDraftErrors({});
      setTagSlugEdited(false);
      setIsCreateTagDialogOpen(false);
      toast.success(tagFormCopy.createSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : tagFormCopy.createFailure
      );
    }
  }

  function applyValidationErrors(nextErrors: Partial<Record<FieldName, string>>) {
    setFieldErrors(nextErrors);

    const firstErrorField = (Object.keys(nextErrors) as FieldName[])[0];
    if (!firstErrorField) {
      return;
    }

    toast.error(nextErrors[firstErrorField] ?? copy.validation.generic);
    focusField(firstErrorField);
  }

  function validateStepOne() {
    const nextErrors: Partial<Record<FieldName, string>> = {};
    const titleLength = getTrimmedLength(form.title);

    if (!titleLength) {
      nextErrors.title = copy.validation.titleRequired;
    } else if (titleLength < 3) {
      nextErrors.title = copy.validation.titleMin;
    } else if (titleLength > 200) {
      nextErrors.title = copy.validation.titleMax;
    }

    if (!form.department) {
      nextErrors.department = copy.validation.departmentRequired;
    }

    if (!form.category) {
      nextErrors.category = copy.validation.categoryRequired;
    }

    if (!form.thumb.trim()) {
      nextErrors.thumb = copy.validation.thumbRequired;
    }

    if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      nextErrors.slug = copy.validation.slugPattern;
    } else if (form.slug.trim().length > 140) {
      nextErrors.slug = copy.validation.slugMax;
    }

    if (getTrimmedLength(form.thumb_desc) > 300) {
      nextErrors.thumb_desc = copy.validation.thumbDescMax;
    }

    if (getTrimmedLength(form.excerpt) > 500) {
      nextErrors.excerpt = copy.validation.excerptMax;
    }

    if (!form.status) {
      nextErrors.status = copy.validation.statusRequired;
    }

    if (!form.visibility) {
      nextErrors.visibility = copy.validation.visibilityRequired;
    }

    if (Object.keys(nextErrors).length > 0) {
      applyValidationErrors(nextErrors);
      return false;
    }

    return true;
  }

  function validateStepTwo() {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    if (!stripHtml(form.content).trim()) {
      nextErrors.content = copy.validation.contentRequired;
    }

    if (Object.keys(nextErrors).length > 0) {
      applyValidationErrors(nextErrors);
      return false;
    }

    return true;
  }

  async function syncCoverFile(postName: string, currentThumbUrl: string) {
    let finalThumbUrl = currentThumbUrl;

    if (coverSource === "upload" && coverFileMeta?.name) {
      const attached = await updateFile.updateDoc(coverFileMeta.name, {
        attached_to_doctype: "posts",
        attached_to_name: postName,
        attached_to_field: "thumb",
        is_private: getPrivateFlag(form.visibility),
      } as Partial<PostFileDoc>);

      const normalizedFile = normalizePostFileDoc(attached);
      setCoverFileMeta(normalizedFile);
      finalThumbUrl = normalizedFile?.file_url ?? finalThumbUrl;
    }

    if (finalThumbUrl && finalThumbUrl !== currentThumbUrl) {
      await updatePost.updateDoc(postName, {
        thumb: finalThumbUrl,
      });
    }

    if (finalThumbUrl && finalThumbUrl !== form.thumb) {
      updateField("thumb", finalThumbUrl);
    }

    return finalThumbUrl;
  }

  async function syncPostTopics(postName: string) {
    if (!isEditMode) {
      for (const topicId of selectedTopicIds) {
        await createPostTopic.createDoc({
          post: postName,
          topic: topicId,
        });
      }
      return;
    }

    const currentItems = existingPostTopics ?? [];
    const currentMap = new Map(currentItems.map(item => [item.topic, item]));

    await Promise.all(
      selectedTopicIds
        .filter(topicId => !currentMap.has(topicId))
        .map(topicId =>
          createPostTopic.createDoc({
            post: postName,
            topic: topicId,
          })
        )
    );

    await Promise.all(
      currentItems
        .filter(item => !selectedTopicIds.includes(item.topic))
        .map(item => deletePostTopic.deleteDoc(item.name))
    );
  }

  async function syncPostTags(postName: string) {
    if (!isEditMode) {
      for (const tagId of selectedTagIds) {
        await createPostTag.createDoc({
          post: postName,
          tag: tagId,
        });
      }
      return;
    }

    const currentItems = existingPostTags ?? [];
    const currentMap = new Map(currentItems.map(item => [item.tag, item]));

    await Promise.all(
      selectedTagIds
        .filter(tagId => !currentMap.has(tagId))
        .map(tagId =>
          createPostTag.createDoc({
            post: postName,
            tag: tagId,
          })
        )
    );

    await Promise.all(
      currentItems
        .filter(item => !selectedTagIds.includes(item.tag))
        .map(item => deletePostTag.deleteDoc(item.name))
    );
  }

  async function handleSubmitPost() {
    if (isSubmitting || isCoverBusy) {
      if (isCoverBusy) {
        toast.error(copy.validation.coverBusy);
      }
      return;
    }

    const isStepOneValid = validateStepOne();
    const isStepTwoValid = validateStepTwo();

    if (!isStepOneValid) {
      setCurrentStep(1);
      return;
    }

    if (!isStepTwoValid) {
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Partial<Post> = {
        title: form.title.trim(),
        department: form.department,
        category: form.category,
        slug: form.slug.trim() || undefined,
        thumb: form.thumb.trim(),
        thumb_desc: form.thumb_desc.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        status: form.status,
        visibility: form.visibility,
        content: normalizeEditorHtml(form.content),
      };

      let targetPostId = postId;

      if (isEditMode) {
        if (!postId) {
          throw new Error(copy.toast.updateFailure);
        }

        if (form.status === "Published" && !existingPost?.published_at) {
          payload.published_at = formatFrappeDatetime(new Date());
        }

        await updatePost.updateDoc(postId, payload);
      } else {
        payload.author = currentUser || undefined;
        payload.published_at =
          form.status === "Published" ? formatFrappeDatetime(new Date()) : undefined;

        const createdPost = await createPost.createDoc(payload);
        targetPostId = createdPost.name;
      }

      if (!targetPostId) {
        throw new Error(copy.toast.updateFailure);
      }

      const finalThumbUrl = await syncCoverFile(targetPostId, form.thumb.trim());
      const persistedCoverFileName =
        coverSource === "upload" ? (coverFileMeta?.name ?? null) : null;

      await cleanupTransientCoverUploads(persistedCoverFileName ? [persistedCoverFileName] : []);
      await syncPostTopics(targetPostId);
      await syncPostTags(targetPostId);

      clearTrackedTransientCoverUploads();
      clearTrackedTransientEditorUploads();
      setInitialSnapshot(
        createComposerSnapshot({ ...form, thumb: finalThumbUrl }, selectedTopicIds, selectedTagIds)
      );
      toast.success(isEditMode ? copy.toast.updateSuccess : copy.toast.createSuccess);
      safeNavigate(
        buildLocalePath(locale, isEditMode ? `/admin/posts/${targetPostId}` : "/admin/posts"),
        { skipConfirm: true }
      );
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : isEditMode
            ? copy.toast.updateFailure
            : copy.toast.createFailure
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmNavigation() {
    if (!pendingNavigation) {
      return;
    }

    const target = pendingNavigation.href;
    setPendingNavigation(null);

    await cleanupTransientUploads();
    performNavigation(target);
  }

  function handleStayOnPage() {
    setPendingNavigation(null);
  }

  const statusCode = (existingPostError as { response?: { status?: number } } | null)?.response
    ?.status;
  const isEditLoading =
    isEditMode &&
    (!hasInitializedEdit ||
      isLoadingExistingPost ||
      isLoadingExistingPostTopics ||
      isLoadingExistingPostTags ||
      isLoadingExistingCoverFile);
  const cancelHref =
    isEditMode && postId
      ? buildLocalePath(locale, `/admin/posts/${postId}`)
      : buildLocalePath(locale, "/admin/posts");
  const pageTitle = isEditMode ? copy.editTitle : copy.createTitle;
  const pageDescription = isEditMode ? copy.editDescription : copy.createDescription;
  const steps = isEditMode ? EDIT_STEPS : CREATE_STEPS;
  const totalSteps = steps.length;
  const pendingNavigationTitle =
    pendingNavigation?.intent === "cancel"
      ? copy.cancelDraftConfirmTitle
      : copy.unsavedNavigationTitle;
  const pendingNavigationDescription =
    pendingNavigation?.intent === "cancel"
      ? hasTransientUploads
        ? copy.cancelDraftConfirmWithUploadsDescription
        : copy.cancelDraftConfirmDescription
      : copy.unsavedNavigationDescription;
  // const stepCounterText = copy.stepCounter
  //   .replace("{current}", String(currentStep))
  //   .replace("{total}", String(totalSteps));
  const submitLabel = isSubmitting
    ? isEditMode
      ? copy.saving
      : copy.creating
    : isEditMode
      ? copy.save
      : copy.create;

  if (isAuthLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="text-sm text-muted-foreground">Redirecting...</div>;
  }

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.postAccessDeniedDescription} />;
  }

  if (isEditMode && isEditLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (isEditMode && !existingPost) {
    return notFound();
  }

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageDescription}</p>
      </div>
      <div className="flex flex-col gap-6">
        <div className="col-span-2">
          {currentStep === 1 ? (
            <Card>
              <CardContent className="grid gap-4 md:gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-4 md:gap-6 ">
                  {/* Cover Image */}
                  <div className="space-y-2">
                    <CoverImageField
                      id="post-cover-field"
                      value={form.thumb}
                      visibility={form.visibility}
                      disabled={isSubmitting}
                      invalid={Boolean(fieldErrors.thumb)}
                      source={coverSource}
                      fileMeta={coverFileMeta}
                      onChange={value => {
                        updateField("thumb", value);
                        clearFieldError("thumb");
                      }}
                      onSourceChange={setCoverSource}
                      onFileMetaChange={setCoverFileMeta}
                      onBusyChange={setIsCoverBusy}
                    />
                  </div>

                  {/* Thumbnail Description */}
                  <div className="space-y-2">
                    <Label htmlFor="post-thumb-desc">{copy.form.thumbDesc}</Label>
                    <Textarea
                      id="post-thumb-desc"
                      rows={4}
                      value={form.thumb_desc}
                      onChange={event => updateField("thumb_desc", event.target.value)}
                      placeholder={copy.form.thumbDescPlaceholder}
                      aria-invalid={Boolean(fieldErrors.thumb_desc)}
                      className={cn(fieldErrors.thumb_desc && "border-destructive")}
                    />
                    <p className="text-sm text-muted-foreground">
                      {getTrimmedLength(form.thumb_desc)}/300
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                  {/* Title */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="post-title">{copy.form.title}</Label>
                    <Input
                      id="post-title"
                      value={form.title}
                      onChange={event => handleTitleChange(event.target.value)}
                      placeholder={copy.form.titlePlaceholder}
                      aria-invalid={Boolean(fieldErrors.title)}
                      className={cn(fieldErrors.title && "border-destructive")}
                    />
                    <p className="text-sm text-muted-foreground">
                      {getTrimmedLength(form.title)}/200
                    </p>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="post-excerpt">{copy.form.excerpt}</Label>
                    <Textarea
                      id="post-excerpt"
                      rows={4}
                      value={form.excerpt}
                      onChange={event => updateField("excerpt", event.target.value)}
                      placeholder={copy.form.excerptPlaceholder}
                      aria-invalid={Boolean(fieldErrors.excerpt)}
                      className={cn(fieldErrors.excerpt && "border-destructive")}
                    />
                    <p className="text-sm text-muted-foreground">
                      {getTrimmedLength(form.excerpt)}/500
                    </p>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="post-slug">{copy.form.slug}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const nextSlug = slugify(form.title);
                          setSlugEdited(true);
                          updateField("slug", nextSlug);
                        }}
                        disabled={!form.title.trim()}
                        className="h-7 text-xs"
                      >
                        {copy.form.generateSlug}
                      </Button>
                    </div>
                    <Input
                      id="post-slug"
                      value={form.slug}
                      onChange={event => {
                        setSlugEdited(true);
                        updateField("slug", slugify(event.target.value));
                      }}
                      placeholder={copy.form.slugPlaceholder}
                      aria-invalid={Boolean(fieldErrors.slug)}
                      className={cn(fieldErrors.slug && "border-destructive")}
                    />
                    <p className="text-xs text-muted-foreground">{copy.form.slugHelp}</p>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="post-department">{copy.form.department}</Label>
                    <div id="post-department">
                      <SearchableSingleSelect
                        value={form.department}
                        resource="blog_departments"
                        fields={[
                          "name",
                          "department_name",
                          "department_code",
                          "description",
                          "creation",
                        ]}
                        filters={[["is_active", "=", 1]]}
                        searchFields={["department_name", "department_code", "description"]}
                        valueField="name"
                        labelField="department_name"
                        descriptionField="department_code"
                        keywordFields={["department_code", "description"]}
                        onChange={value => {
                          updateField("department", value);
                          updateField("category", "");
                          setCreatedCategoryOption(null);
                          setCreatedTopicOptions([]);
                          setSelectedTopicIds([]);
                          clearFieldError("department");
                          clearFieldError("category");
                          clearFieldError("topics");
                        }}
                        placeholder={copy.form.departmentPlaceholder}
                        searchPlaceholder={copy.selector.searchDepartment}
                        emptyText={copy.selector.noDepartment}
                        invalid={Boolean(fieldErrors.department)}
                        disabled={isSubmitting}
                        selectedOption={selectedDepartmentOption}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="post-category">{copy.form.category}</Label>
                    <div id="post-category">
                      <SearchableSingleSelect
                        value={form.category}
                        resource="categories"
                        fields={[
                          "name",
                          "category",
                          "slug",
                          "description",
                          "department",
                          "creation",
                        ]}
                        filters={
                          form.department
                            ? [
                              ["is_active", "=", 1],
                              ["department", "=", form.department],
                            ]
                            : undefined
                        }
                        searchFields={["category", "slug", "description"]}
                        valueField="name"
                        labelField="category"
                        descriptionField="slug"
                        keywordFields={["slug", "description"]}
                        onChange={value => {
                          updateField("category", value);
                          if (createdCategoryOption?.value !== value) {
                            setCreatedCategoryOption(null);
                          }
                          clearFieldError("category");
                        }}
                        placeholder={
                          form.department
                            ? copy.form.categoryPlaceholder
                            : copy.selector.selectDepartmentFirst
                        }
                        searchPlaceholder={copy.selector.searchCategory}
                        emptyText={
                          form.department
                            ? copy.selector.noCategory
                            : copy.selector.selectDepartmentFirst
                        }
                        invalid={Boolean(fieldErrors.category)}
                        disabled={isSubmitting || !form.department}
                        enabled={!!form.department}
                        selectedOption={effectiveSelectedCategoryOption}
                        emptyActionLabel={categoryCopy.addCategory}
                        onEmptyAction={openCreateCategoryDialog}
                      />
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-2">
                    <Label htmlFor="post-topics">{copy.form.topics}</Label>
                    <div id="post-topics">
                      <SearchableMultiSelect
                        values={selectedTopicIds}
                        resource="topics"
                        fields={["name", "topic", "slug", "desc", "department", "creation"]}
                        filters={
                          form.department
                            ? [
                              ["is_active", "=", 1],
                              ["department", "=", form.department],
                            ]
                            : undefined
                        }
                        searchFields={["topic", "slug", "desc"]}
                        valueField="name"
                        labelField="topic"
                        descriptionField="slug"
                        keywordFields={["slug", "desc"]}
                        onChange={values => {
                          setSelectedTopicIds(values);
                          clearFieldError("topics");
                        }}
                        placeholder={copy.form.topics}
                        searchPlaceholder={copy.selector.searchTopic}
                        emptyText={
                          form.department
                            ? copy.selector.noTopic
                            : copy.selector.selectDepartmentFirst
                        }
                        emptySelectionText={copy.previewSection.emptyTopics}
                        disabled={isSubmitting || !form.department}
                        enabled={!!form.department}
                        selectedOptions={effectiveSelectedTopicOptions}
                        emptyActionLabel={topicCopy.addTopic}
                        onEmptyAction={openCreateTopicDialog}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="post-tags">{copy.form.tags}</Label>

                    <div id="post-tags">
                      <SearchableMultiSelect
                        values={selectedTagIds}
                        resource="tags"
                        fields={["name", "tag_name", "slug", "description", "creation"]}
                        filters={[["is_active", "=", 1]]}
                        searchFields={["tag_name", "slug", "description"]}
                        valueField="name"
                        labelField="tag_name"
                        descriptionField="slug"
                        keywordFields={["slug", "description"]}
                        onChange={values => {
                          setSelectedTagIds(values);
                          clearFieldError("tags");
                        }}
                        placeholder={copy.form.tags}
                        searchPlaceholder={copy.selector.searchTag}
                        emptyText={copy.selector.noTag}
                        emptySelectionText={copy.previewSection.emptyTags}
                        disabled={isSubmitting}
                        selectedOptions={effectiveSelectedTagOptions}
                        emptyActionLabel={tagCopy.addTag}
                        onEmptyAction={openCreateTagDialog}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>{copy.form.status}</Label>
                    <Select
                      value={form.status || undefined}
                      onValueChange={value =>
                        updateField("status", value as PostFormValues["status"])
                      }
                    >
                      <SelectTrigger
                        className={cn("w-full", fieldErrors.status && "border-destructive")}
                        aria-invalid={Boolean(fieldErrors.status)}
                        data-post-status-trigger=""
                      >
                        <SelectValue placeholder={copy.form.statusPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_STATUS_VALUES.map(status => (
                          <SelectItem key={status} value={status}>
                            {formatPostStatusLabel(status, statusLabels)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2">
                    <Label>{copy.form.visibility}</Label>
                    <Select
                      value={form.visibility || undefined}
                      onValueChange={value =>
                        updateField("visibility", value as PostFormValues["visibility"])
                      }
                    >
                      <SelectTrigger
                        className={cn("w-full", fieldErrors.visibility && "border-destructive")}
                        aria-invalid={Boolean(fieldErrors.visibility)}
                        data-post-visibility-trigger=""
                      >
                        <SelectValue placeholder={copy.form.visibilityPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_VISIBILITY_VALUES.map(visibility => (
                          <SelectItem key={visibility} value={visibility}>
                            {formatPostVisibilityLabel(visibility, visibilityLabels)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>{copy.steps.content.title}</CardTitle>
                <CardDescription>{copy.steps.content.description}</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-3 space-y-4">
                <div className="col-span-3">
                  <BlogContentComposer
                    ref={editorRef}
                    id="post-content-editor"
                    value={form.content}
                    onChange={value => {
                      updateField("content", value);
                      clearFieldError("content");
                    }}
                    onTransientImageUpload={registerTransientEditorUpload}
                    onTransientUploadsChange={setEditorHasTransientUploads}
                    disabled={isSubmitting}
                    invalid={Boolean(fieldErrors.content)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isEditMode && currentStep === 3 ? (
            <Card>
              <CardHeader>
                <CardTitle>{copy.previewSection.title}</CardTitle>
                <CardDescription>{copy.steps.review.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {form.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.thumb.includes("https") ? form.thumb : `${getBaseUrl()}${form.thumb}`}
                    alt={form.title || copy.cover.previewAlt}
                    className="max-h-[420px] w-full rounded-2xl border object-cover"
                  />
                ) : null}

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatPostStatusLabel(form.status, statusLabels)}</Badge>
                    <Badge variant="outline">
                      {formatPostVisibilityLabel(form.visibility, visibilityLabels)}
                    </Badge>
                    {selectedDepartment ? (
                      <Badge variant="secondary">{selectedDepartment.department_name}</Badge>
                    ) : null}
                    {selectedCategory ? (
                      <Badge variant="outline">{getCategoryName(selectedCategory)}</Badge>
                    ) : null}
                    {coverSource === "upload" && coverFileMeta ? (
                      <Badge variant="secondary">
                        {coverFileMeta.is_private ? copy.cover.privateFile : copy.cover.publicFile}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl font-semibold tracking-tight">{form.title}</h1>
                    {form.excerpt ? (
                      <p className="text-lg leading-8 text-muted-foreground">{form.excerpt}</p>
                    ) : null}
                    {form.thumb_desc ? (
                      <p className="text-sm text-muted-foreground">{form.thumb_desc}</p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{copy.form.topics}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTopics.length > 0 ? (
                          selectedTopics.map(topic => (
                            <Badge key={topic.name} variant="outline">
                              {topic.topic}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">{copy.previewSection.emptyTopics}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">{copy.form.tags}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.length > 0 ? (
                          selectedTags.map(tag => (
                            <Badge key={tag.name} variant="outline">
                              {tag.tag_name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">{copy.previewSection.emptyTags}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-5">
                    <PostContentPreview
                      value={form.content}
                      emptyText={copy.previewSection.emptyContent}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 rounded-2xl border shadow-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/10">
        <div className="flex md:flex-row items-center md:justify-between gap-3 p-3">
          <div
            className={cn("hidden md:grid gap-2", isEditMode ? "md:grid-cols-2" : "md:grid-cols-3")}
          >
            {steps.map(stepItem => {
              const stepCopy = copy.steps[stepItem.titleKey];
              const isActive = currentStep === stepItem.step;
              const isCompleted = currentStep > stepItem.step;

              return (
                <div
                  key={stepItem.step}
                  className={cn(
                    "rounded-lg border px-3 py-3 transition-colors",
                    isActive && "border-primary bg-primary/5",
                    isCompleted && "border-emerald-500 bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        isActive && "border-primary bg-primary text-primary-foreground",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white"
                      )}
                    >
                      {stepItem.step}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none">{stepCopy.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => safeNavigate(cancelHref, { intent: "cancel" })}
                  className="flex-1 md:flex-none"
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={() => validateStepOne() && setCurrentStep(2)}
                  className="flex-1 md:flex-none"
                >
                  {copy.continue}
                </Button>
              </>
            ) : null}

            {currentStep === 2 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 md:flex-none"
                >
                  {copy.back}
                </Button>
                {isEditMode ? (
                  <Button
                    type="button"
                    onClick={handleSubmitPost}
                    disabled={isSubmitting || isCoverBusy}
                    className="flex-1 md:flex-none"
                  >
                    {submitLabel}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => validateStepTwo() && setCurrentStep(3)}
                    className="flex-1 md:flex-none"
                  >
                    {copy.preview}
                  </Button>
                )}
              </>
            ) : null}

            {!isEditMode && currentStep === 3 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 md:flex-none"
                >
                  {copy.back}
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitPost}
                  disabled={isSubmitting || isCoverBusy}
                  className="flex-1 md:flex-none"
                >
                  {submitLabel}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <Dialog
        open={isCreateCategoryDialogOpen}
        onOpenChange={nextOpen => {
          setIsCreateCategoryDialogOpen(nextOpen);
          if (!nextOpen) {
            setCategoryDraftErrors({});
            setCategorySlugEdited(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{categoryCopy.addCategoryTitle}</DialogTitle>
            <DialogDescription>{categoryCopy.addCategoryDescription}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              void handleCreateCategory();
            }}
          >
            <div className="space-y-2">
              <Label>{categoryFormCopy.department}</Label>
              <Input value={selectedDepartmentLabel} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-category-name">{categoryFormCopy.name}</Label>
              <Input
                id="inline-category-name"
                value={categoryDraft.category}
                onChange={event => handleCategoryNameChange(event.target.value)}
                placeholder={categoryFormCopy.namePlaceholder}
                disabled={createCategory.loading}
                aria-invalid={Boolean(categoryDraftErrors.category)}
                className={cn(categoryDraftErrors.category && "border-destructive")}
                autoFocus
              />
              {categoryDraftErrors.category ? (
                <p className="text-sm text-destructive">{categoryDraftErrors.category}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="inline-category-slug">{categoryFormCopy.slug}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategorySlugEdited(true);
                    handleCategoryDraftChange("slug", slugify(categoryDraft.category));
                  }}
                  disabled={!categoryDraft.category.trim() || createCategory.loading}
                  className="h-7 text-xs"
                >
                  {categoryFormCopy.generateSlug}
                </Button>
              </div>
              <Input
                id="inline-category-slug"
                value={categoryDraft.slug}
                onChange={event => {
                  setCategorySlugEdited(true);
                  handleCategoryDraftChange("slug", slugify(event.target.value));
                }}
                placeholder={categoryFormCopy.slugPlaceholder}
                disabled={createCategory.loading}
                aria-invalid={Boolean(categoryDraftErrors.slug)}
                className={cn(categoryDraftErrors.slug && "border-destructive")}
              />
              {categoryDraftErrors.slug ? (
                <p className="text-sm text-destructive">{categoryDraftErrors.slug}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{categoryFormCopy.slugHelp}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-category-description">{categoryFormCopy.description}</Label>
              <Textarea
                id="inline-category-description"
                rows={4}
                value={categoryDraft.description}
                onChange={event => handleCategoryDraftChange("description", event.target.value)}
                placeholder={categoryFormCopy.descriptionPlaceholder}
                disabled={createCategory.loading}
                aria-invalid={Boolean(categoryDraftErrors.description)}
                className={cn(categoryDraftErrors.description && "border-destructive")}
              />
              {categoryDraftErrors.description ? (
                <p className="text-sm text-destructive">{categoryDraftErrors.description}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {getTrimmedLength(categoryDraft.description)}/500
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCategoryDialogOpen(false)}
                disabled={createCategory.loading}
              >
                {categoryFormCopy.cancel}
              </Button>
              <Button type="submit" disabled={createCategory.loading}>
                {categoryFormCopy.submitCreate}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateTopicDialogOpen}
        onOpenChange={nextOpen => {
          setIsCreateTopicDialogOpen(nextOpen);
          if (!nextOpen) {
            setTopicDraftErrors({});
            setTopicSlugEdited(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{topicCopy.addTopicTitle}</DialogTitle>
            <DialogDescription>{topicCopy.addTopicDescription}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              void handleCreateTopic();
            }}
          >
            <div className="space-y-2">
              <Label>{topicFormCopy.department}</Label>
              <Input value={selectedDepartmentLabel} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-topic-name">{topicFormCopy.name}</Label>
              <Input
                id="inline-topic-name"
                value={topicDraft.topic}
                onChange={event => handleTopicNameChange(event.target.value)}
                placeholder={topicFormCopy.namePlaceholder}
                disabled={createTopic.loading}
                aria-invalid={Boolean(topicDraftErrors.topic)}
                className={cn(topicDraftErrors.topic && "border-destructive")}
                autoFocus
              />
              {topicDraftErrors.topic ? (
                <p className="text-sm text-destructive">{topicDraftErrors.topic}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="inline-topic-slug">{topicFormCopy.slug}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTopicSlugEdited(true);
                    handleTopicDraftChange("slug", slugify(topicDraft.topic));
                  }}
                  disabled={!topicDraft.topic.trim() || createTopic.loading}
                  className="h-7 text-xs"
                >
                  {topicFormCopy.generateSlug}
                </Button>
              </div>
              <Input
                id="inline-topic-slug"
                value={topicDraft.slug}
                onChange={event => {
                  setTopicSlugEdited(true);
                  handleTopicDraftChange("slug", slugify(event.target.value));
                }}
                placeholder={topicFormCopy.slugPlaceholder}
                disabled={createTopic.loading}
                aria-invalid={Boolean(topicDraftErrors.slug)}
                className={cn(topicDraftErrors.slug && "border-destructive")}
              />
              {topicDraftErrors.slug ? (
                <p className="text-sm text-destructive">{topicDraftErrors.slug}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{topicFormCopy.slugHelp}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-topic-description">{topicFormCopy.description}</Label>
              <Textarea
                id="inline-topic-description"
                rows={4}
                value={topicDraft.desc}
                onChange={event => handleTopicDraftChange("desc", event.target.value)}
                placeholder={topicFormCopy.descriptionPlaceholder}
                disabled={createTopic.loading}
                aria-invalid={Boolean(topicDraftErrors.desc)}
                className={cn(topicDraftErrors.desc && "border-destructive")}
              />
              {topicDraftErrors.desc ? (
                <p className="text-sm text-destructive">{topicDraftErrors.desc}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {getTrimmedLength(topicDraft.desc)}/500
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTopicDialogOpen(false)}
                disabled={createTopic.loading}
              >
                {topicFormCopy.cancel}
              </Button>
              <Button type="submit" disabled={createTopic.loading}>
                {topicFormCopy.submitCreate}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateTagDialogOpen}
        onOpenChange={nextOpen => {
          setIsCreateTagDialogOpen(nextOpen);
          if (!nextOpen) {
            setTagDraftErrors({});
            setTagSlugEdited(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{tagCopy.addTagTitle}</DialogTitle>
            <DialogDescription>{tagCopy.addTagDescription}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              void handleCreateTag();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="inline-tag-name">{tagFormCopy.name}</Label>
              <Input
                id="inline-tag-name"
                value={tagDraft.tag_name}
                onChange={event => handleTagNameChange(event.target.value)}
                placeholder={tagFormCopy.namePlaceholder}
                disabled={createTag.loading}
                aria-invalid={Boolean(tagDraftErrors.tag_name)}
                className={cn(tagDraftErrors.tag_name && "border-destructive")}
                autoFocus
              />
              {tagDraftErrors.tag_name ? (
                <p className="text-sm text-destructive">{tagDraftErrors.tag_name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="inline-tag-slug">{tagFormCopy.slug}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTagSlugEdited(true);
                    handleTagDraftChange("slug", slugify(tagDraft.tag_name));
                  }}
                  disabled={!tagDraft.tag_name.trim() || createTag.loading}
                  className="h-7 text-xs"
                >
                  {tagFormCopy.generateSlug}
                </Button>
              </div>
              <Input
                id="inline-tag-slug"
                value={tagDraft.slug}
                onChange={event => {
                  setTagSlugEdited(true);
                  handleTagDraftChange("slug", slugify(event.target.value));
                }}
                placeholder={tagFormCopy.slugPlaceholder}
                disabled={createTag.loading}
                aria-invalid={Boolean(tagDraftErrors.slug)}
                className={cn(tagDraftErrors.slug && "border-destructive")}
              />
              {tagDraftErrors.slug ? (
                <p className="text-sm text-destructive">{tagDraftErrors.slug}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{tagFormCopy.slugHelp}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-tag-description">{tagFormCopy.description}</Label>
              <Textarea
                id="inline-tag-description"
                rows={4}
                value={tagDraft.description}
                onChange={event => handleTagDraftChange("description", event.target.value)}
                placeholder={tagFormCopy.descriptionPlaceholder}
                disabled={createTag.loading}
                aria-invalid={Boolean(tagDraftErrors.description)}
                className={cn(tagDraftErrors.description && "border-destructive")}
              />
              {tagDraftErrors.description ? (
                <p className="text-sm text-destructive">{tagDraftErrors.description}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {getTrimmedLength(tagDraft.description)}/500
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTagDialogOpen(false)}
                disabled={createTag.loading}
              >
                {tagFormCopy.cancel}
              </Button>
              <Button type="submit" disabled={createTag.loading}>
                {tagFormCopy.submitCreate}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingNavigation}
        onOpenChange={open => {
          if (!open) handleStayOnPage();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingNavigationTitle}</AlertDialogTitle>
            <AlertDialogDescription>{pendingNavigationDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnPage}>{copy.no}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              {t.common?.confirm ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
