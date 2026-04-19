import type {
  Category,
  PostFileDoc,
  PostStatusOption,
  PostVisibilityOption,
} from "@/types/blogs";

export const POST_STATUS_VALUES: PostStatusOption[] = [
  "Draft",
  "Published",
  "Archived",
];

export const POST_VISIBILITY_VALUES: PostVisibilityOption[] = [
  "Public",
  "Internal",
];

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatFrappeDatetime(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEditorHtml(value: string): string {
  const nextValue = value
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .trim();

  return stripHtml(nextValue) ? nextValue : "";
}

export function formatPostStatusLabel(
  value: PostStatusOption,
  labels: Record<PostStatusOption, string>,
): string {
  return labels[value] ?? value;
}

export function formatPostVisibilityLabel(
  value: PostVisibilityOption,
  labels: Record<PostVisibilityOption, string>,
): string {
  return labels[value] ?? value;
}

export function getPrivateFlag(visibility: PostVisibilityOption): number {
  return visibility === "Internal" ? 1 : 0;
}

export function normalizePostFileDoc(
  value: Partial<PostFileDoc> | null | undefined,
): PostFileDoc | null {
  if (!value?.name || !value.file_url) {
    return null;
  }

  return {
    name: value.name,
    file_url: value.file_url,
    file_name: value.file_name ?? "",
    is_private: Number(value.is_private ?? 0),
  };
}

export function getCategoryName(category: Category): string {
  return category.category || category.name;
}

export function isSupportedImageUrl(value: string): boolean {
  if (!value.trim()) return false;

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"].some(
      (extension) => pathname.endsWith(extension),
    );
  } catch {
    return false;
  }
}

export type ParsedVideoMedia = {
  provider: "youtube" | "vimeo" | "file";
  kind: "embed" | "file";
  src: string;
  title?: string;
} | null;

export function parseVideoMediaUrl(value: string): ParsedVideoMedia {
  const nextValue = value.trim();
  if (!nextValue) return null;

  try {
    const url = new URL(nextValue);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (!videoId) return null;
      return {
        provider: "youtube",
        kind: "embed",
        src: `https://www.youtube.com/embed/${videoId}`,
      };
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.replace(/^\/+/, "");
      if (!videoId) return null;
      return {
        provider: "youtube",
        kind: "embed",
        src: `https://www.youtube.com/embed/${videoId}`,
      };
    }

    if (host.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).pop();
      if (!videoId) return null;
      return {
        provider: "vimeo",
        kind: "embed",
        src: `https://player.vimeo.com/video/${videoId}`,
      };
    }

    const pathname = url.pathname.toLowerCase();
    if (
      [".mp4", ".webm", ".ogg"].some((extension) =>
        pathname.endsWith(extension),
      )
    ) {
      return {
        provider: "file",
        kind: "file",
        src: nextValue,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function restoreEmbeddedMediaHtml(value: string): string {
  return value;
}

export function normalizeBlogMediaUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function isHtmlContent(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  return /<\/?[a-z][\s\S]*>/i.test(value);
}
