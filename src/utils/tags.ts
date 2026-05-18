import type { Tag } from "@/types/blogs";
import { queryClient } from "@/lib/ApiProvider";
import { GUEST_METADATA_KEYS } from "@/hooks/useGuestMetadata";

function getTagList(): Tag[] {
  return queryClient.getQueryData<Tag[]>(GUEST_METADATA_KEYS.tags) ?? [];
}

export function getTagByLabel(label: string | undefined | null): Tag | undefined {
  if (typeof label !== "string" || !label.trim()) return undefined;
  return getTagList().find(row => row.tag_name === label);
}

export function getTagByName(name: string | undefined | null): Tag | undefined {
  if (typeof name !== "string" || !name.trim()) return undefined;
  const id = name.trim();
  return getTagList().find(row => row.name === id);
}

export function getTagLabelByName(name: string | undefined | null): string {
  return getTagByName(name)?.tag_name ?? "";
}
