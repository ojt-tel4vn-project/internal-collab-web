import { NextRequest, NextResponse } from "next/server";
import {
  canAccessPathByRoles,
  getChangePasswordPathForRoles,
  getHomePathForRoles,
  getRequiredRoleFromPath,
  parseRolesCookie,
} from "@/lib/auth";
import {
  applyAuthSessionCookies,
  clearAuthSessionCookies,
  getAccessTokenFromRequest,
  hasAuthSession,
  isJwtExpired,
  refreshAuthSession,
} from "@/lib/backend";

type SessionState = {
  isAuthenticated: boolean;
  clearAuthCookies: boolean;
  refreshedSession: Awaited<ReturnType<typeof refreshAuthSession>>["session"];
};

async function resolveSessionState(request: NextRequest): Promise<SessionState> {
  if (!hasAuthSession(request)) {
    return {
      isAuthenticated: false,
      clearAuthCookies: false,
      refreshedSession: null,
    };
  }

  if (!isJwtExpired(getAccessTokenFromRequest(request))) {
    return {
      isAuthenticated: true,
      clearAuthCookies: false,
      refreshedSession: null,
    };
  }

  const refreshResult = await refreshAuthSession(request);

  return {
    isAuthenticated: Boolean(refreshResult.session),
    clearAuthCookies: refreshResult.clearAuthCookies,
    refreshedSession: refreshResult.session,
  };
}

function finalizeResponse(response: NextResponse, sessionState: SessionState) {
  if (sessionState.refreshedSession) {
    applyAuthSessionCookies(response, sessionState.refreshedSession);
  }

  if (sessionState.clearAuthCookies) {
    clearAuthSessionCookies(response);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionState = await resolveSessionState(request);

  const roles = parseRolesCookie(request.cookies.get("user_roles")?.value);
  const homePath = getHomePathForRoles(roles);
  const changePasswordPath = getChangePasswordPathForRoles(roles);
  const requiredRole = getRequiredRoleFromPath(pathname);
  const isPasswordChangeRequired = request.cookies.get("require_password_change")?.value === "1";

  if (pathname === "/") {
    if (sessionState.isAuthenticated && isPasswordChangeRequired && changePasswordPath) {
      return finalizeResponse(
        NextResponse.redirect(new URL(changePasswordPath, request.url)),
        sessionState,
      );
    }

    if (sessionState.isAuthenticated && homePath) {
      return finalizeResponse(NextResponse.redirect(new URL(homePath, request.url)), sessionState);
    }

    return finalizeResponse(NextResponse.next(), sessionState);
  }

  if (!requiredRole) {
    return finalizeResponse(NextResponse.next(), sessionState);
  }

  if (!sessionState.isAuthenticated) {
    return finalizeResponse(NextResponse.redirect(new URL("/", request.url)), sessionState);
  }

  if (!canAccessPathByRoles(roles, pathname)) {
    if (homePath) {
      return finalizeResponse(NextResponse.redirect(new URL(homePath, request.url)), sessionState);
    }

    return finalizeResponse(NextResponse.redirect(new URL("/", request.url)), sessionState);
  }

  if (isPasswordChangeRequired && changePasswordPath && pathname !== changePasswordPath) {
    return finalizeResponse(
      NextResponse.redirect(new URL(changePasswordPath, request.url)),
      sessionState,
    );
  }

  if (pathname === `/${requiredRole}` && homePath) {
    return finalizeResponse(NextResponse.redirect(new URL(homePath, request.url)), sessionState);
  }

  return finalizeResponse(NextResponse.next(), sessionState);
}

export const config = {
  matcher: ["/", "/admin/:path*", "/manager/:path*", "/hr/:path*", "/employee/:path*"],
};
