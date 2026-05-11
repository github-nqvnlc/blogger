import PlaceholderImage from "@public/images/post-placeholder.png";
import { getBaseUrl } from "@/lib/utils";

export function postImageUrl(thumb: string | undefined | null): string {
  if (!thumb) return PlaceholderImage.src;
  if (thumb.startsWith("http")) return thumb;
  return `${getBaseUrl()}${thumb}`;
}
