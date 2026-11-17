export class ApiError extends Error {
  status: number;
  details?: Array<{ field: string; message: string }>;
  code?: string;

  constructor(status: number, message: string, details?: Array<{ field: string; message: string }>, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function getAuthToken(): string | null {
  return localStorage.getItem("lendly_token");
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem("lendly_token", token);
  else localStorage.removeItem("lendly_token");
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const error = (body as { error?: { message?: string; details?: Array<{ field: string; message: string }>; code?: string } }).error;
    throw new ApiError(
      response.status,
      error?.message ?? "Request failed",
      error?.details,
      error?.code,
    );
  }

  return body as T;
}
