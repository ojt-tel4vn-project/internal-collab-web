import { NextResponse } from "next/server";
import { clearAuthSessionCookies } from "@/lib/backend";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthSessionCookies(response);
  return response;
}

/*
Tóm tắt:
- Xử lý đăng xuất tại frontend API route.
- Xóa toàn bộ cookie auth bằng cách set `maxAge: 0`:
  `access_token`, `refresh_token`, `token_type`, `user_roles`.
- Trả về `{ success: true }` để UI điều hướng về trang đăng nhập.
*/
