"use client";

import * as React from "react";
import { toast } from "sonner";

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message.trim();
    if (message) return message;
  }

  return fallback;
}

function renderToastDescription(description: string): React.ReactNode {
  const anchorPattern = /<a\s+([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi;

  if (!anchorPattern.test(description)) {
    return description;
  }

  anchorPattern.lastIndex = 0;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(description)) !== null) {
    const [fullMatch, beforeHrefAttrs, href, afterHrefAttrs, label] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(description.slice(lastIndex, matchIndex));
    }

    const relMatch = `${beforeHrefAttrs} ${afterHrefAttrs}`.match(/\brel="([^"]*)"/i);
    const targetMatch = `${beforeHrefAttrs} ${afterHrefAttrs}`.match(/\btarget="([^"]*)"/i);

    parts.push(
      React.createElement(
        "a",
        {
          key: `${href}-${matchIndex}`,
          href,
          rel: relMatch?.[1] || "noopener noreferrer",
          target: targetMatch?.[1] || "_blank",
          className: "font-medium underline underline-offset-4",
        },
        label
      )
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < description.length) {
    parts.push(description.slice(lastIndex));
  }

  return React.createElement("span", { className: "break-words" }, ...parts);
}

export function showCrudSuccess(title: string, description?: string) {
  toast.success(title, {
    description: description ? renderToastDescription(description) : undefined,
    className: "[&>svg]:!text-green-600 dark:[&>svg]:!text-green-400",
  });
}

export function showCrudError(title: string, error: unknown, fallbackDescription: string) {
  const description = extractErrorMessage(error, fallbackDescription);

  toast.error(title, {
    description: renderToastDescription(description),
    className: "[&>svg]:!text-red-600 dark:[&>svg]:!text-red-400 [&>.bg-error]:!bg-red-500",
  });
}
