export const ROLE_HOME_MAP = {
  admin: "/admin/home",
  manager: "/manager/home",
  hr: "/hr/home",
  employee: "/employee/home",
} as const;

export const ROLE_CHANGE_PASSWORD_MAP = {
  admin: "/admin/change-password",
  manager: "/manager/change-password",
  hr: "/hr/change-password",
  employee: "/employee/change-password",
} as const;

export type AppRole = keyof typeof ROLE_HOME_MAP;

const ROLE_PRIORITY: AppRole[] = ["admin", "manager", "hr", "employee"];

function normalizeRole(role: string): AppRole | null {
  const normalized = role.trim().toLowerCase().replace(/^role_/, "");

  if (normalized === "admin") return "admin";
  if (normalized === "manager") return "manager";
  if (normalized === "hr") return "hr";
  if (normalized === "employee") return "employee";

  return null;
}

export function normalizeRoles(roles: readonly string[] | null | undefined): AppRole[] {
  if (!roles?.length) {
    return [];
  }

  const unique = new Set<AppRole>();

  for (const role of roles) {
    const normalized = normalizeRole(role);
    if (normalized) {
      unique.add(normalized);
    }
  }

  return Array.from(unique);
}

export function parseRolesCookie(raw: string | undefined): AppRole[] {
  if (!raw) {
    return [];
  }

  return normalizeRoles(raw.split(","));
}

export function getHomePathForRoles(roles: readonly string[] | null | undefined): string | null {
  const normalized = normalizeRoles(roles);

  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) {
      return ROLE_HOME_MAP[role];
    }
  }

  return null;
}

export function getChangePasswordPathForRoles(
  roles: readonly string[] | null | undefined,
): string | null {
  const normalized = normalizeRoles(roles);

  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) {
      return ROLE_CHANGE_PASSWORD_MAP[role];
    }
  }

  return null;
}

export function getRequiredRoleFromPath(pathname: string): AppRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/manager" || pathname.startsWith("/manager/")) return "manager";
  if (pathname === "/hr" || pathname.startsWith("/hr/")) return "hr";
  if (pathname === "/employee" || pathname.startsWith("/employee/")) return "employee";

  return null;
}

export function canAccessPathByRoles(
  roles: readonly string[] | null | undefined,
  pathname: string,
): boolean {
  const requiredRole = getRequiredRoleFromPath(pathname);
  if (!requiredRole) {
    return true;
  }

  const normalized = normalizeRoles(roles);
  return normalized.includes(requiredRole);
}

/*
Tóm tắt:
- Tập trung toàn bộ helper phân quyền theo role cho frontend/middleware.
- Chuẩn hóa role thô (ví dụ ROLE_ADMIN -> admin), loại role không hợp lệ và role trùng.
- Ánh xạ role sang route mặc định cho home và change-password theo thứ tự ưu tiên (nếu 1 tài khoản có nhiều role):
  admin -> manager -> hr -> employee.
- Tách role từ cookie (`user_roles`) và xác định role bắt buộc từ pathname.
- Cung cấp hàm kiểm tra quyền truy cập để middleware cho phép/chặn route theo role.
*/
