import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_ACCEPT_HEADER = "application/json, application/problem+json";
const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

type ProxyResult = {
  ok: boolean;
  status: number;
  text: string;
  contentType: string;
  authSession?: AuthSession | null;
  clearAuthCookies?: boolean;
};

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

export function getRefreshTokenFromRequest(request: NextRequest) {
  return request.cookies.get("refresh_token")?.value ?? null;
}

export function getTokenTypeFromRequest(request: NextRequest) {
  return request.cookies.get("token_type")?.value ?? "Bearer";
}

export function hasAuthSession(request: NextRequest) {
  return Boolean(getAccessTokenFromRequest(request) || getRefreshTokenFromRequest(request));
}

export function isJwtExpired(token: string | null | undefined) {
  if (!token) {
    return true;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return true;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as {
      exp?: unknown;
    };

    if (typeof parsed.exp !== "number") {
      return true;
    }

    return parsed.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

function buildAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function applyAuthSessionCookies(response: NextResponse, session: AuthSession) {
  response.cookies.set({
    name: "access_token",
    value: session.accessToken,
    ...buildAuthCookieOptions(ACCESS_TOKEN_MAX_AGE),
  });
  response.cookies.set({
    name: "refresh_token",
    value: session.refreshToken,
    ...buildAuthCookieOptions(REFRESH_TOKEN_MAX_AGE),
  });
  response.cookies.set({
    name: "token_type",
    value: session.tokenType,
    ...buildAuthCookieOptions(REFRESH_TOKEN_MAX_AGE),
  });
}

export function clearAuthSessionCookies(response: NextResponse) {
  const expired = buildAuthCookieOptions(0);
  response.cookies.set({ name: "access_token", value: "", ...expired });
  response.cookies.set({ name: "refresh_token", value: "", ...expired });
  response.cookies.set({ name: "token_type", value: "", ...expired });
  response.cookies.set({ name: "user_roles", value: "", ...expired });
  response.cookies.set({ name: "require_password_change", value: "", ...expired });
}

export async function refreshAuthSession(
  request: NextRequest,
  refreshTokenOverride?: string | null,
): Promise<{ session: AuthSession | null; clearAuthCookies: boolean }> {
  const refreshToken = refreshTokenOverride ?? getRefreshTokenFromRequest(request);
  if (!refreshToken) {
    return { session: null, clearAuthCookies: true };
  }

  const url = buildApiUrl("/auth/refresh-token");
  if (!url) {
    return { session: null, clearAuthCookies: false };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: DEFAULT_ACCEPT_HEADER,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return { session: null, clearAuthCookies: true };
  }

  try {
    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
    };

    if (!data.access_token || !data.refresh_token) {
      return { session: null, clearAuthCookies: true };
    }

    return {
      session: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: (data.token_type ?? "Bearer").trim() || "Bearer",
      },
      clearAuthCookies: false,
    };
  } catch {
    return { session: null, clearAuthCookies: true };
  }
}

type ProxyOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  request?: NextRequest;
  body?: unknown;
  headers?: HeadersInit;
  authSession?: AuthSession | null;
};

export async function proxyToBackend({
  method = "GET",
  path,
  request,
  body,
  headers,
  authSession,
}: ProxyOptions) {
  const serializedBody = body === undefined ? undefined : JSON.stringify(body);
  const url = buildApiUrl(path);
  if (!url) {
    return {
      ok: false,
      status: 500,
      text: JSON.stringify({
        message: "Server configuration error: API_LINK is missing or invalid.",
      }),
      contentType: "application/json",
      clearAuthCookies: false,
    } satisfies ProxyResult;
  }

  const buildHeaders = (session?: Pick<AuthSession, "accessToken" | "tokenType">) => {
    const outboundHeaders = new Headers(headers);
    if (!outboundHeaders.has("Accept")) {
      outboundHeaders.set("Accept", DEFAULT_ACCEPT_HEADER);
    }

    if (serializedBody !== undefined && !outboundHeaders.has("Content-Type")) {
      outboundHeaders.set("Content-Type", "application/json");
    }

    if (session?.accessToken) {
      outboundHeaders.set("Authorization", `${session.tokenType} ${session.accessToken}`);
    }

    return outboundHeaders;
  };

  const executeFetch = async (session?: Pick<AuthSession, "accessToken" | "tokenType">) =>
    fetch(url, {
      method,
      headers: buildHeaders(session),
      body: serializedBody,
    });

  const initialSession = authSession
    ? {
        accessToken: authSession.accessToken,
        tokenType: authSession.tokenType,
      }
    : request
      ? {
          accessToken: getAccessTokenFromRequest(request) ?? "",
          tokenType: getTokenTypeFromRequest(request),
        }
      : undefined;

  let response = await executeFetch(initialSession?.accessToken ? initialSession : undefined);
  let refreshedSession: AuthSession | null = null;
  let clearAuthCookies = false;

  if (response.status === 401 && request) {
    const refreshResult = await refreshAuthSession(request, authSession?.refreshToken);

    if (refreshResult.session) {
      refreshedSession = refreshResult.session;
      response = await executeFetch({
        accessToken: refreshedSession.accessToken,
        tokenType: refreshedSession.tokenType,
      });
    } else if (refreshResult.clearAuthCookies) {
      clearAuthCookies = true;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
    contentType: response.headers.get("content-type") ?? "application/json",
    authSession: refreshedSession,
    clearAuthCookies,
  } satisfies ProxyResult;
}

export function createProxyResponse(result: ProxyResult) {
  const response = new NextResponse(result.text, {
    status: result.status,
    headers: {
      "content-type": result.contentType,
    },
  });

  if (result.authSession) {
    applyAuthSessionCookies(response, result.authSession);
  }

  if (result.clearAuthCookies) {
    clearAuthSessionCookies(response);
  }

  return response;
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
