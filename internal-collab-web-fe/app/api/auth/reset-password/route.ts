import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const upstreamResponse = await proxyToBackend({
      method: "POST",
      path: "/auth/reset-password",
      body: {
        new_password: body?.new_password,
        token: body?.token,
      },
    });

    return new NextResponse(upstreamResponse.text, {
      status: upstreamResponse.status,
      headers: {
        "content-type": upstreamResponse.contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to process reset password request." },
      { status: 500 },
    );
  }
}

/*
Tóm tắt:
- Nhận `token` và `new_password` từ trang reset-password.
- Proxy request sang backend `/auth/reset-password`.
- Giữ nguyên status/body/content-type từ backend để frontend xử lý thành công/lỗi.
- Trả lỗi 500 nếu có sự cố khi xử lý request tại tầng frontend API route.
*/
