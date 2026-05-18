import { getApiClient } from "@/lib/apiClient";
import type { Topic } from "@/types/blogs";

export async function resolveTopicLabelsByDocNames(
  names: (string | undefined | null)[]
): Promise<string[]> {
  const order = names
    .map(n => (typeof n === "string" ? n.trim() : ""))
    .filter((n): n is string => n.length > 0);
  const unique = [...new Set(order)];
  if (unique.length === 0) return [];

  const apiClient = getApiClient();
  const res = await apiClient.get<{ data: Topic[] }>("/api/resource/topics", {
    params: {
      fields: JSON.stringify(["name", "topic"]),
      filters: JSON.stringify([["name", "in", unique]]),
      limit: Math.max(20, unique.length),
    },
  });

  const rows: Topic[] = res.data?.data ?? (res.data as unknown as Topic[]) ?? [];

  const labelByName = new Map<string, string>();
  for (const r of rows) {
    if (typeof r.name === "string" && typeof r.topic === "string") {
      labelByName.set(r.name, r.topic);
    }
  }

  return order.map(name => labelByName.get(name) ?? name);
}

/**
 * Giải quyết label của một Topic theo doc name.
 */
export async function resolveTopicLabel(topicName: string): Promise<string> {
  const trimmed = topicName.trim();
  if (!trimmed) return "";
  try {
    const [label] = await resolveTopicLabelsByDocNames([trimmed]);
    return label ?? `Topic ${trimmed} not found`;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(msg);
    return msg;
  }
}
