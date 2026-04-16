"use client";

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

export function showCrudSuccess(title: string, description?: string) {
  toast.success(title, {
    description: description,
    className: "[&>svg]:!text-green-600 dark:[&>svg]:!text-green-400",
  });
}

export function showCrudError(
  title: string,
  error: unknown,
  fallbackDescription: string,
) {
  toast.error(title, {
    description: extractErrorMessage(error, fallbackDescription),
    className:
      "[&>svg]:!text-red-600 dark:[&>svg]:!text-red-400 [&>.bg-error]:!bg-red-500",
  });
}
