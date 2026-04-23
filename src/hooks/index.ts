// src/hooks/index.ts
// Entry point — import hooks từ đây thay vì từng file riêng lẻ

// ── Auth ──────────────────────────────────────────────────────────────────────
export { useAuth } from "./useAuth";
export type { FrappeUser } from "./useAuth";

// ── Document (Read) ───────────────────────────────────────────────────────────
export { useGetDoc } from "./useGetDoc";
export { useGetList } from "./useGetList";
export { useGetCount } from "./useGetCount";
export { useLazyLoadList } from "./useLazyLoadList";
export type { UseLazyLoadListArgs, UseLazyLoadListResult } from "./useLazyLoadList";

// ── Document (Write) ──────────────────────────────────────────────────────────
export { useCreateDoc } from "./useCreateDoc";
export { useUpdateDoc } from "./useUpdateDoc";
export { useDeleteDoc } from "./useDeleteDoc";

// ── Raw Endpoint Calls ────────────────────────────────────────────────────────
export { useGetCall } from "./useGetCall";
export { useGetMethod } from "./useGetMethod";
export { usePostCall, usePutCall, useDeleteCall } from "./useMutationCall";

// ── Utilities ─────────────────────────────────────────────────────────────────
export { useFileUpload } from "./useFileUpload";
export { useDocSearch } from "./useDocSearch";
export type { FileUploadResponse } from "./useFileUpload";

// ── Language ──────────────────────────────────────────────────────────────────
export { useLanguage } from "./useLanguage";
