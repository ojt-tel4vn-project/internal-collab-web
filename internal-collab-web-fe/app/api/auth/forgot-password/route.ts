import { NextResponse } from "next/server";
import { proxyToBackend } from "@/libs/backend-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const upstreamResponse = await proxyToBackend({
      method: "POST",
      path: "/auth/forgot-password",
      body: {
        email: body?.email,
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
      { message: "Unable to process forgot password request." },
      { status: 500 },
    );
  }
}

/*
Tóm tắt:
- Nhận email từ trang forgot-password.
- Proxy request sang backend `/auth/forgot-password`.
- Giữ nguyên status/body/content-type từ backend để frontend hiển thị thông báo phù hợp.
- Trả lỗi 500 nếu không xử lý được request ở tầng frontend API route.
*/
