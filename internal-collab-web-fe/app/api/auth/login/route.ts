import { NextResponse } from "next/server";
import { normalizeRoles } from "@/lib/auth";
import { applyAuthSessionCookies, proxyToBackend } from "@/lib/backend";

type BackendLoginResponse = {
  access_token: string;
  refresh_token: string;
  require_password_change?: boolean;
  token_type?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    employee_code: string;
    status: string;
    roles?: string[];
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstreamResponse = await proxyToBackend({
      method: "POST",
      path: "/auth/login",
      body: {
        email: body?.email,
        password: body?.password,
      },
    });

    if (!upstreamResponse.ok) {
      return new NextResponse(upstreamResponse.text, {
        status: upstreamResponse.status,
        headers: {
          "content-type": upstreamResponse.contentType,
        },
      });
    }

    let data: BackendLoginResponse;
    try {
      data = JSON.parse(upstreamResponse.text) as BackendLoginResponse;
    } catch {
      return NextResponse.json(
        { message: "Invalid login response from authentication service." },
        { status: 502 },
      );
    }

    if (!data.access_token || !data.refresh_token) {
      return NextResponse.json(
        { message: "Authentication service did not return required tokens." },
        { status: 502 },
      );
    }

    const normalizedRoles = normalizeRoles(data.user?.roles ?? []);
    const isProduction = process.env.NODE_ENV === "production";
    const tokenType = (data.token_type ?? "Bearer").trim() || "Bearer";
    const requirePasswordChange = Boolean(data.require_password_change);

    const response = NextResponse.json({
      require_password_change: requirePasswordChange,
      user: data.user
        ? {
            ...data.user,
            roles: normalizedRoles,
          }
        : null,
    });

    applyAuthSessionCookies(response, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType,
    });

    response.cookies.set({
      name: "user_roles",
      value: normalizedRoles.join(","),
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: "require_password_change",
      value: requirePasswordChange ? "1" : "",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: requirePasswordChange ? 60 * 60 * 24 * 7 : 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to process login request." },
      { status: 500 },
    );
  }
}
