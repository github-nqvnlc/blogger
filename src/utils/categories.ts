import type { Category } from "@/types/blogs";
import { queryClient } from "@/lib/ApiProvider";
import { GUEST_METADATA_KEYS } from "@/hooks/useGuestMetadata";

function getCategoryList(): Category[] {
  return queryClient.getQueryData<Category[]>(GUEST_METADATA_KEYS.categories) ?? [];
}

export function getCategoryByLabel(label: string | undefined | null): Category | undefined {
  if (typeof label !== "string" || !label.trim()) return undefined;
  return getCategoryList().find(row => row.category === label);
}

export function getCategoryByName(name: string | undefined | null): Category | undefined {
  if (typeof name !== "string" || !name.trim()) return undefined;
  const id = name.trim();
  return getCategoryList().find(row => row.name === id);
}

export function getCategoryLabelByName(name: string | undefined | null): string {
  return getCategoryByName(name)?.category ?? "";
}
