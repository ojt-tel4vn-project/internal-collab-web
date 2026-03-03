import { NextRequest } from "next/server";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_ACCEPT_HEADER = "application/json, application/problem+json";

function normalizeApiPath(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function getApiBaseUrl() {
  const configured = (process.env.API_LINK ?? "").trim();

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_API_BASE_URL;
  }

  return null;
}

export function buildApiUrl(path: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  const normalizedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  return new URL(normalizeApiPath(path), normalizedBase).toString();
}

export function getAccessTokenFromRequest(request: NextRequest) {
  return request.cookies.get("access_token")?.value ?? null;
}

export function getTokenTypeFromRequest(request: NextRequest) {
  return request.cookies.get("token_type")?.value ?? "Bearer";
}

type ProxyOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  request?: NextRequest;
  body?: unknown;
  headers?: HeadersInit;
};

export async function proxyToBackend({
  method = "GET",
  path,
  request,
  body,
  headers,
}: ProxyOptions) {
  const url = buildApiUrl(path);
  if (!url) {
    return {
      ok: false,
      status: 500,
      text: JSON.stringify({
        message: "Server configuration error: API_LINK is missing or invalid.",
      }),
      contentType: "application/json",
    };
  }

  const outboundHeaders = new Headers(headers);
  if (!outboundHeaders.has("Accept")) {
    outboundHeaders.set("Accept", DEFAULT_ACCEPT_HEADER);
  }

  if (body !== undefined && !outboundHeaders.has("Content-Type")) {
    outboundHeaders.set("Content-Type", "application/json");
  }

  if (request) {
    const accessToken = getAccessTokenFromRequest(request);
    if (accessToken) {
      const tokenType = getTokenTypeFromRequest(request);
      outboundHeaders.set("Authorization", `${tokenType} ${accessToken}`);
    }
  }

  const response = await fetch(url, {
    method,
    headers: outboundHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
    contentType: response.headers.get("content-type") ?? "application/json",
  };
}

/*
Tóm tắt:
- Quản lý cấu hình URL backend API từ `API_LINK` (fallback localhost khi môi trường dev).
- Chuẩn hóa và ghép URL endpoint backend an toàn qua `buildApiUrl`.
- Đọc token từ cookie request (`access_token`, `token_type`) để gắn Authorization khi cần.
- Cung cấp hàm `proxyToBackend` dùng chung cho route handlers:
  nhận method/path/body/headers, gọi backend, và trả về dữ liệu phản hồi chuẩn hóa
  gồm `ok`, `status`, `text`, `contentType`.
- Giúp các API route trong app tránh lặp logic gọi backend và xử lý header cơ bản.
*/
