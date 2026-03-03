import { NextRequest, NextResponse } from "next/server";
import {
  canAccessPathByRoles,
  getHomePathForRoles,
  getRequiredRoleFromPath,
  parseRolesCookie,
} from "@/libs/auth";

function hasAuthCookies(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  return Boolean(accessToken || refreshToken);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasAuthCookies(request);

  const roles = parseRolesCookie(request.cookies.get("user_roles")?.value);
  const homePath = getHomePathForRoles(roles);
  const requiredRole = getRequiredRoleFromPath(pathname);

  if (pathname === "/") {
    if (isAuthenticated && homePath) {
      return NextResponse.redirect(new URL(homePath, request.url));
    }
    return NextResponse.next();
  }

  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!canAccessPathByRoles(roles, pathname)) {
    if (homePath) {
      return NextResponse.redirect(new URL(homePath, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === `/${requiredRole}` && homePath) {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/manager/:path*", "/hr/:path*", "/employee/:path*"],
};