import { NextRequest, NextResponse } from "next/server";
import {
  canAccessPathByRoles,
  getChangePasswordPathForRoles,
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
  const changePasswordPath = getChangePasswordPathForRoles(roles);
  const requiredRole = getRequiredRoleFromPath(pathname);
  const isPasswordChangeRequired = request.cookies.get("require_password_change")?.value === "1";

  if (pathname === "/") {
    if (isAuthenticated && isPasswordChangeRequired && changePasswordPath) {
      return NextResponse.redirect(new URL(changePasswordPath, request.url));
    }
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

  if (isPasswordChangeRequired && changePasswordPath && pathname !== changePasswordPath) {
    return NextResponse.redirect(new URL(changePasswordPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/manager/:path*", "/hr/:path*", "/employee/:path*"],
};

/*
Tóm tắt:
- Đây là lớp guard ở mức route (middleware/proxy) cho toàn bộ app theo role.
- Kiểm tra đăng nhập qua cookie token; chưa đăng nhập thì chuyển về `/`.
- Đọc role từ cookie `user_roles` để:
  - xác định trang home mặc định theo ưu tiên role,
  - kiểm tra user có quyền vào route role tương ứng hay không.
- Nếu truy cập route không đúng role, tự động redirect về home phù hợp (hoặc `/`).
- Nếu cookie `require_password_change=1` còn hiệu lực:
  - ép user về đúng trang `/<role>/change-password`,
  - chặn truy cập các trang khác cho tới khi đổi mật khẩu thành công.
- `matcher` giới hạn phạm vi áp dụng cho `/` và các nhánh role:
  `/admin/*`, `/manager/*`, `/hr/*`, `/employee/*`.
*/
