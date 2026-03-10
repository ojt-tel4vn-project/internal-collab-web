import { NextRequest, NextResponse } from "next/server";
import {
  createProxyResponse,
  hasAuthSession,
  proxyToBackend,
} from "@/libs/backend-api";

export async function POST(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const upstreamResponse = await proxyToBackend({
      method: "POST",
      path: "/auth/change-password",
      request,
      body: {
        old_password: body?.old_password,
        new_password: body?.new_password,
      },
    });

    const response = createProxyResponse(upstreamResponse);

    if (upstreamResponse.ok) {
      response.cookies.set({
        name: "require_password_change",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to process change password request." },
      { status: 500 },
    );
  }
}

/*
Tóm tắt:
- API route đổi mật khẩu cho user đã đăng nhập.
- Kiểm tra có `access_token` trong cookie; thiếu token thì trả 401.
- Proxy `old_password` và `new_password` sang backend `/auth/change-password`
  kèm Authorization lấy từ cookie.
- Nếu backend đổi mật khẩu thành công, xóa cookie `require_password_change`
  để mở khóa điều hướng trong middleware.
*/
