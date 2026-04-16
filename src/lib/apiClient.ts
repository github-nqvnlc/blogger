import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

let _apiClient: AxiosInstance | null = null;

interface FrappeServerMessage {
  message?: string;
}

interface FrappeErrorPayload {
  message?: string;
  exception?: string;
  _error_message?: string;
  _server_messages?: string;
}

/**
 * Lấy CSRF token từ cookie (Frappe gửi trong cookie "csrf_token")
 */
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function stripFrappeExceptionPrefix(value: string): string {
  return value.replace(/^[\w.]+:\s*/u, "").trim();
}

function parseServerMessages(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    for (const item of parsed) {
      if (typeof item === "string") {
        try {
          const nested = JSON.parse(item) as FrappeServerMessage;
          if (nested.message?.trim()) {
            return nested.message.trim();
          }
        } catch {
          if (item.trim()) return item.trim();
        }
      }

      if (
        typeof item === "object" &&
        item !== null &&
        "message" in item &&
        typeof item.message === "string" &&
        item.message.trim()
      ) {
        return item.message.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getFrappeErrorMessage(payload: FrappeErrorPayload | undefined): string | null {
  if (!payload) return null;

  const serverMessage = parseServerMessages(payload._server_messages);
  if (serverMessage) return serverMessage;

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.exception === "string" && payload.exception.trim()) {
    return stripFrappeExceptionPrefix(payload.exception);
  }

  if (
    typeof payload._error_message === "string" &&
    payload._error_message.trim()
  ) {
    return payload._error_message.trim();
  }

  return null;
}

export function createApiClient() {
  _apiClient = axios.create({
    // Không set baseURL — hook gọi /api/... trực tiếp, Next.js rewrite forward sang Frappe
    timeout: 15_000,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // Bắt buộc để gửi cookie session cùng request
    withCredentials: true,
  });

  // ── Request Interceptor: CSRF token cho mutation ─────────────────
  _apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    if (method && method !== "GET" && method !== "HEAD") {
      const csrf = getCsrfToken();
      if (csrf) {
        config.headers["X-Frappe-CSRF-Token"] = csrf;
      }
    }
    return config;
  });

  // ── Response Interceptor ─────────────────────────────────────────
  // Không auto-redirect ở đây — để hook tự xử lý (tránh vòng lặp /login)
  _apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const payload = error.response?.data as FrappeErrorPayload | undefined;
      const message =
        getFrappeErrorMessage(payload) ??
        (typeof error.message === "string" && error.message.trim()
          ? error.message.trim()
          : "Unknown error");
      return Promise.reject(new Error(message));
    },
  );

  return _apiClient;
}

/** Lấy instance đã khởi tạo */
export function getApiClient(): AxiosInstance {
  if (!_apiClient) {
    return createApiClient();
  }
  return _apiClient;
}

