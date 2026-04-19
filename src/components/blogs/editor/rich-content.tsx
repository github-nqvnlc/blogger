import { isHtmlContent, restoreEmbeddedMediaHtml } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

type RichContentProps = {
  value?: string | null;
  className?: string;
  emptyText?: string;
};

export function RichContent({ value, className, emptyText }: RichContentProps) {
  if (!value?.trim()) {
    return emptyText ? (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyText}
      </p>
    ) : null;
  }

  if (isHtmlContent(value)) {
    const normalizedHtml = restoreEmbeddedMediaHtml(value);

    return (
      <div
        className={cn(
          "leading-7 text-sm wrap-break-word sm:text-base [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:italic [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:rounded-xl [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:border-0 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:my-4 [&_video]:w-full [&_video]:rounded-xl",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: normalizedHtml }}
      />
    );
  }

  return (
    <div
      className={cn(
        "whitespace-pre-wrap text-sm leading-7 wrap-break-word sm:text-base",
        className,
      )}
    >
      {value}
    </div>
  );
}
